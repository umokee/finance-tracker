from typing import List
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import RecurringTransaction, Transaction, RecurrenceInterval
from ..schemas import RecurringTransactionCreate, RecurringTransactionUpdate, RecurringTransactionResponse
from ..auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


def get_next_date(current_date: date, interval: RecurrenceInterval) -> date:
    if interval == RecurrenceInterval.daily:
        return current_date + timedelta(days=1)
    elif interval == RecurrenceInterval.weekly:
        return current_date + timedelta(weeks=1)
    elif interval == RecurrenceInterval.monthly:
        return current_date + relativedelta(months=1)
    elif interval == RecurrenceInterval.yearly:
        return current_date + relativedelta(years=1)
    return current_date


@router.get("", response_model=List[RecurringTransactionResponse])
async def get_recurring_transactions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RecurringTransaction)
        .options(selectinload(RecurringTransaction.category))
        .order_by(RecurringTransaction.next_date)
    )
    return result.scalars().all()


@router.get("/{recurring_id}", response_model=RecurringTransactionResponse)
async def get_recurring_transaction(recurring_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RecurringTransaction)
        .options(selectinload(RecurringTransaction.category))
        .where(RecurringTransaction.id == recurring_id)
    )
    recurring = result.scalar_one_or_none()
    if not recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    return recurring


@router.post("", response_model=RecurringTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_transaction(data: RecurringTransactionCreate, db: AsyncSession = Depends(get_db)):
    recurring = RecurringTransaction(**data.model_dump())
    db.add(recurring)
    await db.commit()
    await db.refresh(recurring)

    result = await db.execute(
        select(RecurringTransaction)
        .options(selectinload(RecurringTransaction.category))
        .where(RecurringTransaction.id == recurring.id)
    )
    return result.scalar_one()


@router.patch("/{recurring_id}", response_model=RecurringTransactionResponse)
async def update_recurring_transaction(
    recurring_id: int,
    data: RecurringTransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(RecurringTransaction).where(RecurringTransaction.id == recurring_id))
    recurring = result.scalar_one_or_none()
    if not recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recurring, field, value)

    await db.commit()
    await db.refresh(recurring)

    result = await db.execute(
        select(RecurringTransaction)
        .options(selectinload(RecurringTransaction.category))
        .where(RecurringTransaction.id == recurring.id)
    )
    return result.scalar_one()


@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_transaction(recurring_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecurringTransaction).where(RecurringTransaction.id == recurring_id))
    recurring = result.scalar_one_or_none()
    if not recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")

    await db.delete(recurring)
    await db.commit()


@router.post("/process", response_model=dict)
async def process_recurring_transactions(db: AsyncSession = Depends(get_db)):
    MAX_TRANSACTIONS_PER_CALL = 100

    today = date.today()
    result = await db.execute(
        select(RecurringTransaction).where(
            RecurringTransaction.is_active == True,
            RecurringTransaction.next_date <= today
        )
    )
    recurring_list = result.scalars().all()

    created_count = 0
    limit_reached = False

    for recurring in recurring_list:
        while recurring.next_date <= today:
            if created_count >= MAX_TRANSACTIONS_PER_CALL:
                limit_reached = True
                break

            transaction = Transaction(
                amount=recurring.amount,
                type=recurring.type,
                description=recurring.description,
                date=recurring.next_date,
                category_id=recurring.category_id
            )
            db.add(transaction)
            recurring.next_date = get_next_date(recurring.next_date, recurring.interval)
            created_count += 1

        if limit_reached:
            break

    await db.commit()
    return {
        "processed": len(recurring_list),
        "transactions_created": created_count,
        "limit_reached": limit_reached
    }
