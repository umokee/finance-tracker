from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import AllocationRule, Goal, Category
from ..schemas import (
    AllocationRuleCreate, AllocationRuleUpdate, AllocationRuleResponse,
    AllocationCalculation
)
from ..auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


async def get_target_name(db: AsyncSession, target_type: str, target_id: int) -> str:
    if target_type == "goal":
        result = await db.execute(select(Goal).where(Goal.id == target_id))
        target = result.scalar_one_or_none()
        return target.name if target else ""
    elif target_type == "category":
        result = await db.execute(select(Category).where(Category.id == target_id))
        target = result.scalar_one_or_none()
        return target.name if target else ""
    return ""


async def rule_to_response(db: AsyncSession, rule: AllocationRule) -> AllocationRuleResponse:
    target_name = await get_target_name(db, rule.target_type, rule.target_id)
    return AllocationRuleResponse(
        id=rule.id,
        name=rule.name,
        percentage=rule.percentage,
        target_type=rule.target_type,
        target_id=rule.target_id,
        is_active=rule.is_active,
        sort_order=rule.sort_order,
        created_at=rule.created_at,
        target_name=target_name
    )


@router.get("", response_model=List[AllocationRuleResponse])
async def get_allocation_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AllocationRule)
        .where(AllocationRule.is_active == True)
        .order_by(AllocationRule.sort_order, AllocationRule.id)
    )
    rules = result.scalars().all()
    return [await rule_to_response(db, r) for r in rules]


@router.get("/calculate", response_model=List[AllocationCalculation])
async def calculate_allocation(amount: Decimal, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AllocationRule)
        .where(AllocationRule.is_active == True)
        .order_by(AllocationRule.sort_order, AllocationRule.id)
    )
    rules = result.scalars().all()

    calculations = []
    for rule in rules:
        target_name = await get_target_name(db, rule.target_type, rule.target_id)
        allocated_amount = amount * rule.percentage / 100
        calculations.append(AllocationCalculation(
            rule_id=rule.id,
            rule_name=rule.name,
            percentage=rule.percentage,
            target_type=rule.target_type,
            target_id=rule.target_id,
            target_name=target_name,
            amount=allocated_amount
        ))

    return calculations


@router.get("/{rule_id}", response_model=AllocationRuleResponse)
async def get_allocation_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AllocationRule).where(AllocationRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation rule not found")
    return await rule_to_response(db, rule)


@router.post("", response_model=AllocationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_allocation_rule(data: AllocationRuleCreate, db: AsyncSession = Depends(get_db)):
    if data.target_type not in ("goal", "category"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_type must be 'goal' or 'category'"
        )

    target_name = await get_target_name(db, data.target_type, data.target_id)
    if not target_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target {data.target_type} with id {data.target_id} not found"
        )

    rule = AllocationRule(**data.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return await rule_to_response(db, rule)


@router.patch("/{rule_id}", response_model=AllocationRuleResponse)
async def update_allocation_rule(rule_id: int, data: AllocationRuleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AllocationRule).where(AllocationRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation rule not found")

    update_data = data.model_dump(exclude_unset=True)

    if "target_type" in update_data or "target_id" in update_data:
        target_type = update_data.get("target_type", rule.target_type)
        target_id = update_data.get("target_id", rule.target_id)
        if target_type not in ("goal", "category"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="target_type must be 'goal' or 'category'"
            )
        target_name = await get_target_name(db, target_type, target_id)
        if not target_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Target {target_type} with id {target_id} not found"
            )

    for field, value in update_data.items():
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return await rule_to_response(db, rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allocation_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AllocationRule).where(AllocationRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation rule not found")

    await db.delete(rule)
    await db.commit()
