from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from .models import Transaction, TransactionType, GoalContribution


async def get_available_balance(db: AsyncSession) -> Decimal:
    """
    Calculate available balance: total_income - total_expense - total_goal_contributions
    """
    # Total income
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.type == TransactionType.income)
    )
    total_income = Decimal(str(income_result.scalar()))

    # Total expense
    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.type == TransactionType.expense)
    )
    total_expense = Decimal(str(expense_result.scalar()))

    # Total goal contributions
    contributions_result = await db.execute(
        select(func.coalesce(func.sum(GoalContribution.amount), 0))
    )
    total_contributions = Decimal(str(contributions_result.scalar()))

    return total_income - total_expense - total_contributions
