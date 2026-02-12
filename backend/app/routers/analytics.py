from typing import List, Optional
from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models import Transaction, TransactionType, Goal, GoalContribution, Budget, Category
from ..schemas import OverviewResponse, CategorySpending, TrendPoint, DailySpending
from ..auth import verify_api_key
from ..balance import get_available_balance

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    income_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.type == TransactionType.income,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    )
    expense_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
        Transaction.type == TransactionType.expense,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    )
    count_query = select(func.count(Transaction.id)).where(
        Transaction.date >= start_date,
        Transaction.date <= end_date
    )

    income_result = await db.execute(income_query)
    expense_result = await db.execute(expense_query)
    count_result = await db.execute(count_query)

    total_income = Decimal(str(income_result.scalar()))
    total_expense = Decimal(str(expense_result.scalar()))

    goals_query = select(func.count(Goal.id)).where(Goal.completed == False)
    goals_result = await db.execute(goals_query)
    active_goals = goals_result.scalar()

    # Total in goals (contributions)
    contributions_result = await db.execute(
        select(func.coalesce(func.sum(GoalContribution.amount), 0))
    )
    total_in_goals = Decimal(str(contributions_result.scalar()))

    # Available balance = income - expense - contributions
    available_balance = total_income - total_expense - total_in_goals

    budgets_over = 0
    budget_query = select(Budget).where(
        Budget.month == date.today().month,
        Budget.year == date.today().year
    )
    budgets_result = await db.execute(budget_query)
    for budget in budgets_result.scalars():
        spent_query = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.category_id == budget.category_id,
            Transaction.type == TransactionType.expense,
            Transaction.date >= date.today().replace(day=1),
            Transaction.date <= date.today()
        )
        spent_result = await db.execute(spent_query)
        spent = Decimal(str(spent_result.scalar()))
        if spent > budget.amount:
            budgets_over += 1

    return OverviewResponse(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        available_balance=available_balance,
        total_in_goals=total_in_goals,
        transaction_count=count_result.scalar(),
        active_goals=active_goals,
        budgets_over_limit=budgets_over
    )


@router.get("/by-category", response_model=List[CategorySpending])
async def get_spending_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: TransactionType = TransactionType.expense,
    db: AsyncSession = Depends(get_db)
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    query = (
        select(
            Category.id,
            Category.name,
            func.coalesce(func.sum(Transaction.amount), 0).label("total")
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .where(
            Transaction.type == type,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Transaction.amount).desc())
    )

    result = await db.execute(query)
    rows = result.all()

    grand_total = sum(Decimal(str(row.total)) for row in rows)

    return [
        CategorySpending(
            category_id=row.id,
            category_name=row.name,
            total=Decimal(str(row.total)),
            percent=float(Decimal(str(row.total)) / grand_total * 100) if grand_total > 0 else 0
        )
        for row in rows
    ]


@router.get("/trend", response_model=List[TrendPoint])
async def get_trend(
    days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db)
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    query = (
        select(
            Transaction.date,
            Transaction.type,
            func.sum(Transaction.amount).label("total")
        )
        .where(Transaction.date >= start_date, Transaction.date <= end_date)
        .group_by(Transaction.date, Transaction.type)
        .order_by(Transaction.date)
    )

    result = await db.execute(query)
    rows = result.all()

    data_map = {}
    for row in rows:
        date_str = row.date.isoformat()
        if date_str not in data_map:
            data_map[date_str] = {"income": Decimal("0"), "expense": Decimal("0")}
        data_map[date_str][row.type.value] = Decimal(str(row.total))

    current = start_date
    trend = []
    while current <= end_date:
        date_str = current.isoformat()
        data = data_map.get(date_str, {"income": Decimal("0"), "expense": Decimal("0")})
        trend.append(TrendPoint(
            date=date_str,
            income=data["income"],
            expense=data["expense"]
        ))
        current += timedelta(days=1)

    return trend


@router.get("/daily-spending", response_model=List[DailySpending])
async def get_daily_spending(
    days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db)
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    query = (
        select(
            Transaction.date,
            func.sum(Transaction.amount).label("total")
        )
        .where(
            Transaction.type == TransactionType.expense,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        .group_by(Transaction.date)
        .order_by(Transaction.date)
    )

    result = await db.execute(query)
    rows = result.all()

    data_map = {row.date.isoformat(): Decimal(str(row.total)) for row in rows}

    current = start_date
    spending = []
    while current <= end_date:
        date_str = current.isoformat()
        spending.append(DailySpending(
            date=date_str,
            amount=data_map.get(date_str, Decimal("0"))
        ))
        current += timedelta(days=1)

    return spending
