from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Budget, Transaction, TransactionType
from ..schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from ..auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


async def get_budget_with_spending(budget: Budget, db: AsyncSession) -> BudgetResponse:
    start_date = date(budget.year, budget.month, 1)
    if budget.month == 12:
        end_date = date(budget.year + 1, 1, 1)
    else:
        end_date = date(budget.year, budget.month + 1, 1)

    spent_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.category_id == budget.category_id,
        Transaction.type == TransactionType.expense,
        Transaction.date >= start_date,
        Transaction.date < end_date
    )
    result = await db.execute(spent_query)
    spent = Decimal(str(result.scalar()))

    remaining = budget.amount - spent
    percent_used = float(spent / budget.amount * 100) if budget.amount > 0 else 0

    return BudgetResponse(
        id=budget.id,
        category_id=budget.category_id,
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        created_at=budget.created_at,
        category=budget.category,
        spent=spent,
        remaining=remaining,
        percent_used=min(percent_used, 100.0)
    )


@router.get("", response_model=List[BudgetResponse])
async def get_budgets(
    month: Optional[int] = Query(default=None, ge=1, le=12),
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Budget).options(selectinload(Budget.category))

    if month is None:
        month = date.today().month
    if year is None:
        year = date.today().year

    query = query.where(Budget.month == month, Budget.year == year)
    result = await db.execute(query)
    budgets = result.scalars().all()

    return [await get_budget_with_spending(b, db) for b in budgets]


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(Budget.id == budget_id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return await get_budget_with_spending(budget, db)


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(data: BudgetCreate, db: AsyncSession = Depends(get_db)):
    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget amount must be greater than 0"
        )

    existing = await db.execute(
        select(Budget).where(
            Budget.category_id == data.category_id,
            Budget.month == data.month,
            Budget.year == data.year
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and period"
        )

    budget = Budget(**data.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(Budget.id == budget.id)
    )
    budget = result.scalar_one()
    return await get_budget_with_spending(budget, db)


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: int, data: BudgetUpdate, db: AsyncSession = Depends(get_db)):
    if data.amount is not None and data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget amount must be greater than 0"
        )

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(Budget.id == budget_id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)

    await db.commit()
    await db.refresh(budget)
    return await get_budget_with_spending(budget, db)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Budget).where(Budget.id == budget_id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    await db.delete(budget)
    await db.commit()
