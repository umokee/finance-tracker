from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Transaction, TransactionType
from ..schemas import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionSummary
from ..auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    type: Optional[TransactionType] = None,
    category_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Transaction).options(selectinload(Transaction.category))

    if type:
        query = query.where(Transaction.type == type)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if start_date:
        query = query.where(Transaction.date >= start_date)
    if end_date:
        query = query.where(Transaction.date <= end_date)

    query = query.order_by(Transaction.date.desc(), Transaction.id.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/summary", response_model=TransactionSummary)
async def get_transaction_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    income_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.type == TransactionType.income
    )
    expense_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.type == TransactionType.expense
    )
    count_query = select(func.count(Transaction.id))

    if start_date:
        income_query = income_query.where(Transaction.date >= start_date)
        expense_query = expense_query.where(Transaction.date >= start_date)
        count_query = count_query.where(Transaction.date >= start_date)
    if end_date:
        income_query = income_query.where(Transaction.date <= end_date)
        expense_query = expense_query.where(Transaction.date <= end_date)
        count_query = count_query.where(Transaction.date <= end_date)

    income_result = await db.execute(income_query)
    expense_result = await db.execute(expense_query)
    count_result = await db.execute(count_query)

    total_income = Decimal(str(income_result.scalar()))
    total_expense = Decimal(str(expense_result.scalar()))

    return TransactionSummary(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        count=count_result.scalar()
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    transaction = Transaction(**data.model_dump())
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.id == transaction.id)
    )
    return result.scalar_one()


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(transaction_id: int, data: TransactionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.commit()
    await db.refresh(transaction)

    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.category))
        .where(Transaction.id == transaction.id)
    )
    return result.scalar_one()


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    await db.delete(transaction)
    await db.commit()
