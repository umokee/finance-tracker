from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from .models import TransactionType, RecurrenceInterval


# Category schemas
class CategoryBase(BaseModel):
    name: str
    type: TransactionType
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[TransactionType] = None
    icon: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Transaction schemas
class TransactionBase(BaseModel):
    amount: Decimal
    type: TransactionType
    description: Optional[str] = None
    date: date
    category_id: int


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    date: Optional[date] = None
    category_id: Optional[int] = None


class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    category: CategoryResponse

    model_config = ConfigDict(from_attributes=True)


class TransactionSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    count: int


# Goal schemas
class GoalBase(BaseModel):
    name: str
    target_amount: Decimal
    deadline: Optional[date] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    deadline: Optional[date] = None


class GoalContributionCreate(BaseModel):
    amount: Decimal
    note: Optional[str] = None


class GoalContributionResponse(BaseModel):
    id: int
    goal_id: int
    amount: Decimal
    date: date
    note: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalResponse(GoalBase):
    id: int
    current_amount: Decimal
    completed: bool
    created_at: datetime
    progress_percent: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# Budget schemas
class BudgetBase(BaseModel):
    category_id: int
    amount: Decimal
    month: int
    year: int


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = None
    month: Optional[int] = None
    year: Optional[int] = None


class BudgetResponse(BudgetBase):
    id: int
    created_at: datetime
    category: CategoryResponse
    spent: Decimal = Decimal("0.00")
    remaining: Decimal = Decimal("0.00")
    percent_used: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# Recurring transaction schemas
class RecurringTransactionBase(BaseModel):
    amount: Decimal
    type: TransactionType
    description: Optional[str] = None
    category_id: int
    interval: RecurrenceInterval
    next_date: date


class RecurringTransactionCreate(RecurringTransactionBase):
    pass


class RecurringTransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    interval: Optional[RecurrenceInterval] = None
    next_date: Optional[date] = None
    is_active: Optional[bool] = None


class RecurringTransactionResponse(RecurringTransactionBase):
    id: int
    is_active: bool
    created_at: datetime
    category: CategoryResponse

    model_config = ConfigDict(from_attributes=True)


# Analytics schemas
class OverviewResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    available_balance: Decimal
    total_in_goals: Decimal
    transaction_count: int
    active_goals: int
    budgets_over_limit: int


class CategorySpending(BaseModel):
    category_id: int
    category_name: str
    total: Decimal
    percent: float


class TrendPoint(BaseModel):
    date: str
    income: Decimal
    expense: Decimal


class DailySpending(BaseModel):
    date: str
    amount: Decimal


# Settings schemas
class SettingResponse(BaseModel):
    key: str
    value: str


class SettingUpdate(BaseModel):
    value: str


# Allocation Rule schemas
class AllocationRuleBase(BaseModel):
    name: str
    percentage: int
    target_type: str  # "goal" or "category"
    target_id: int


class AllocationRuleCreate(AllocationRuleBase):
    pass


class AllocationRuleUpdate(BaseModel):
    name: Optional[str] = None
    percentage: Optional[int] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class AllocationRuleResponse(AllocationRuleBase):
    id: int
    is_active: bool
    sort_order: int
    created_at: datetime
    target_name: str = ""

    model_config = ConfigDict(from_attributes=True)


class AllocationCalculation(BaseModel):
    rule_id: int
    rule_name: str
    percentage: int
    target_type: str
    target_id: int
    target_name: str
    amount: Decimal
