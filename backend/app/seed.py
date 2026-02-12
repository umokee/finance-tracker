from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .models import Category, TransactionType, Settings, Account, AccountType


DEFAULT_CATEGORIES = [
    {"name": "Salary", "type": TransactionType.income, "icon": "briefcase"},
    {"name": "Freelance", "type": TransactionType.income, "icon": "laptop"},
    {"name": "Investments", "type": TransactionType.income, "icon": "trending-up"},
    {"name": "Other Income", "type": TransactionType.income, "icon": "plus-circle"},
    {"name": "Food & Dining", "type": TransactionType.expense, "icon": "utensils"},
    {"name": "Transportation", "type": TransactionType.expense, "icon": "car"},
    {"name": "Housing", "type": TransactionType.expense, "icon": "home"},
    {"name": "Utilities", "type": TransactionType.expense, "icon": "zap"},
    {"name": "Entertainment", "type": TransactionType.expense, "icon": "film"},
    {"name": "Shopping", "type": TransactionType.expense, "icon": "shopping-bag"},
    {"name": "Healthcare", "type": TransactionType.expense, "icon": "heart"},
    {"name": "Education", "type": TransactionType.expense, "icon": "book"},
    {"name": "Other Expense", "type": TransactionType.expense, "icon": "minus-circle"},
]

DEFAULT_SETTINGS = [
    {"key": "currency", "value": "USD"},
    {"key": "currency_symbol", "value": "$"},
]


async def seed_categories(db: AsyncSession):
    result = await db.execute(select(Category).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    for cat_data in DEFAULT_CATEGORIES:
        category = Category(**cat_data)
        db.add(category)

    await db.commit()


async def seed_settings(db: AsyncSession):
    result = await db.execute(select(Settings).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    for setting_data in DEFAULT_SETTINGS:
        setting = Settings(**setting_data)
        db.add(setting)

    await db.commit()


async def seed_accounts(db: AsyncSession):
    result = await db.execute(select(Account).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    # Create default account
    default_account = Account(
        name="Main Account",
        type=AccountType.checking,
        is_default=True
    )
    db.add(default_account)
    await db.commit()


async def seed_all(db: AsyncSession):
    await seed_categories(db)
    await seed_settings(db)
    await seed_accounts(db)
