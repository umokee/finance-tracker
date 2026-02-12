from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Settings
from ..schemas import SettingResponse, SettingUpdate
from ..auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.get("", response_model=List[SettingResponse])
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Settings))
    return result.scalars().all()


@router.get("/{key}", response_model=SettingResponse)
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Settings).where(Settings.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found")
    return setting


@router.put("/{key}", response_model=SettingResponse)
async def update_setting(key: str, data: SettingUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Settings).where(Settings.key == key))
    setting = result.scalar_one_or_none()

    if setting:
        setting.value = data.value
    else:
        setting = Settings(key=key, value=data.value)
        db.add(setting)

    await db.commit()
    await db.refresh(setting)
    return setting
