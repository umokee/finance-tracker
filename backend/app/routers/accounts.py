from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models import Account, Transaction, TransactionType, Transfer
from ..schemas import AccountCreate, AccountUpdate, AccountResponse, TransferCreate, TransferResponse
from ..auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


async def get_account_balance(db: AsyncSession, account_id: int) -> Decimal:
    """Calculate account balance from transactions and transfers."""
    # Income to this account
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.account_id == account_id, Transaction.type == TransactionType.income)
    )
    income = Decimal(str(income_result.scalar()))

    # Expenses from this account
    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.account_id == account_id, Transaction.type == TransactionType.expense)
    )
    expense = Decimal(str(expense_result.scalar()))

    # Transfers in
    transfers_in_result = await db.execute(
        select(func.coalesce(func.sum(Transfer.amount), 0))
        .where(Transfer.to_account_id == account_id)
    )
    transfers_in = Decimal(str(transfers_in_result.scalar()))

    # Transfers out
    transfers_out_result = await db.execute(
        select(func.coalesce(func.sum(Transfer.amount), 0))
        .where(Transfer.from_account_id == account_id)
    )
    transfers_out = Decimal(str(transfers_out_result.scalar()))

    return income - expense + transfers_in - transfers_out


async def account_to_response(db: AsyncSession, account: Account) -> AccountResponse:
    balance = await get_account_balance(db, account.id)
    return AccountResponse(
        id=account.id,
        name=account.name,
        type=account.type,
        is_default=account.is_default,
        balance=balance,
        created_at=account.created_at
    )


@router.get("", response_model=List[AccountResponse])
async def get_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).order_by(Account.is_default.desc(), Account.name))
    accounts = result.scalars().all()
    return [await account_to_response(db, a) for a in accounts]


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return await account_to_response(db, account)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(data: AccountCreate, db: AsyncSession = Depends(get_db)):
    # Check if this is the first account - make it default
    count_result = await db.execute(select(func.count(Account.id)))
    is_first = count_result.scalar() == 0

    account = Account(**data.model_dump(), is_default=is_first)
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return await account_to_response(db, account)


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: int, data: AccountUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    update_data = data.model_dump(exclude_unset=True)

    # If setting as default, unset other defaults
    if update_data.get("is_default"):
        await db.execute(
            select(Account).where(Account.id != account_id)
        )
        for other in (await db.execute(select(Account).where(Account.id != account_id))).scalars():
            other.is_default = False

    for field, value in update_data.items():
        setattr(account, field, value)

    await db.commit()
    await db.refresh(account)
    return await account_to_response(db, account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(account_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if account.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default account"
        )

    # Check if account has transactions
    tx_result = await db.execute(
        select(func.count(Transaction.id)).where(Transaction.account_id == account_id)
    )
    if tx_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete account with transactions"
        )

    await db.delete(account)
    await db.commit()


# Transfer endpoints
@router.post("/transfer", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def create_transfer(data: TransferCreate, db: AsyncSession = Depends(get_db)):
    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )

    if data.from_account_id == data.to_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to the same account"
        )

    # Verify accounts exist
    from_result = await db.execute(select(Account).where(Account.id == data.from_account_id))
    from_account = from_result.scalar_one_or_none()
    if not from_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source account not found")

    to_result = await db.execute(select(Account).where(Account.id == data.to_account_id))
    to_account = to_result.scalar_one_or_none()
    if not to_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination account not found")

    # Check balance
    from_balance = await get_account_balance(db, data.from_account_id)
    if data.amount > from_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: {from_balance}"
        )

    transfer = Transfer(
        from_account_id=data.from_account_id,
        to_account_id=data.to_account_id,
        amount=data.amount,
        date=data.date or __import__('datetime').date.today(),
        note=data.note
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)

    # Reload with relationships
    result = await db.execute(
        select(Transfer).where(Transfer.id == transfer.id)
    )
    transfer = result.scalar_one()

    return TransferResponse(
        id=transfer.id,
        from_account_id=transfer.from_account_id,
        to_account_id=transfer.to_account_id,
        amount=transfer.amount,
        date=transfer.date,
        note=transfer.note,
        created_at=transfer.created_at,
        from_account=await account_to_response(db, from_account),
        to_account=await account_to_response(db, to_account)
    )


@router.get("/transfers/list", response_model=List[TransferResponse])
async def get_transfers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transfer).order_by(Transfer.date.desc()))
    transfers = result.scalars().all()

    responses = []
    for t in transfers:
        from_acc = (await db.execute(select(Account).where(Account.id == t.from_account_id))).scalar_one()
        to_acc = (await db.execute(select(Account).where(Account.id == t.to_account_id))).scalar_one()
        responses.append(TransferResponse(
            id=t.id,
            from_account_id=t.from_account_id,
            to_account_id=t.to_account_id,
            amount=t.amount,
            date=t.date,
            note=t.note,
            created_at=t.created_at,
            from_account=await account_to_response(db, from_acc),
            to_account=await account_to_response(db, to_acc)
        ))

    return responses
