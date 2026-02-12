from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
import sqlalchemy
from sqlalchemy import String, Text, Numeric, Date, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .database import Base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class RecurrenceInterval(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class AccountType(str, enum.Enum):
    checking = "checking"  # Основной
    savings = "savings"    # Накопления
    cash = "cash"          # Наличные


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[AccountType] = mapped_column(SQLEnum(AccountType), default=AccountType.checking)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transactions: Mapped[List["Transaction"]] = relationship(back_populates="account")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType))
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transactions: Mapped[List["Transaction"]] = relationship(back_populates="category")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[date] = mapped_column(Date, default=date.today)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    account_id: Mapped[Optional[int]] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    category: Mapped["Category"] = relationship(back_populates="transactions")
    account: Mapped[Optional["Account"]] = relationship(back_populates="transactions")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    current_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    contributions: Mapped[List["GoalContribution"]] = relationship(back_populates="goal", cascade="all, delete-orphan")


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    goal: Mapped["Goal"] = relationship(back_populates="contributions")


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        sqlalchemy.UniqueConstraint('category_id', 'month', 'year', name='uq_budget_category_period'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    month: Mapped[int] = mapped_column()  # 1-12
    year: Mapped[int] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    category: Mapped["Category"] = relationship(back_populates="budgets")


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    interval: Mapped[RecurrenceInterval] = mapped_column(SQLEnum(RecurrenceInterval))
    next_date: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    category: Mapped["Category"] = relationship()


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[str] = mapped_column(Text)


class AllocationRule(Base):
    __tablename__ = "allocation_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    percentage: Mapped[int] = mapped_column()
    target_type: Mapped[str] = mapped_column(String(20))  # "goal" or "category"
    target_id: Mapped[int] = mapped_column()
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True)
    from_account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    to_account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    from_account: Mapped["Account"] = relationship(foreign_keys=[from_account_id])
    to_account: Mapped["Account"] = relationship(foreign_keys=[to_account_id])
