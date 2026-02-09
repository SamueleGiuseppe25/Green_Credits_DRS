from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies.auth import CurrentUserDep
from ..services.db import get_db_session
from ..services.subscriptions import get_me as svc_get_me, activate as svc_activate, cancel as svc_cancel, choose_plan as svc_choose
from ..schemas import Subscription as SubscriptionSchema
from pydantic import BaseModel
from fastapi import HTTPException


router = APIRouter()


@router.get("/me", response_model=SubscriptionSchema)
async def get_me(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    sub = await svc_get_me(session, current_user.id)
    if sub is None:
        return {
            "status": "inactive",
            "planCode": None,
            "startDate": None,
            "endDate": None,
            "currentPeriodStart": None,
            "currentPeriodEnd": None,
        }
    return {
        "status": sub.status,
        "planCode": sub.plan_code,
        "startDate": sub.start_date,
        "endDate": sub.end_date,
        "currentPeriodStart": sub.current_period_start,
        "currentPeriodEnd": sub.current_period_end,
    }


@router.post("/activate", response_model=SubscriptionSchema)
async def activate(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    sub = await svc_activate(session, current_user.id)
    return {
        "status": sub.status,
        "planCode": sub.plan_code,
        "startDate": sub.start_date,
        "endDate": sub.end_date,
        "currentPeriodStart": sub.current_period_start,
        "currentPeriodEnd": sub.current_period_end,
    }


@router.post("/cancel", response_model=SubscriptionSchema)
async def cancel(current_user: CurrentUserDep, session: AsyncSession = Depends(get_db_session)):
    sub = await svc_cancel(session, current_user.id)
    return {
        "status": sub.status,
        "planCode": sub.plan_code,
        "startDate": sub.start_date,
        "endDate": sub.end_date,
        "currentPeriodStart": sub.current_period_start,
        "currentPeriodEnd": sub.current_period_end,
    }


class ChoosePlanRequest(BaseModel):
    planCode: str


@router.post("/choose", response_model=SubscriptionSchema)
async def choose_plan(
    current_user: CurrentUserDep,
    payload: ChoosePlanRequest,
    session: AsyncSession = Depends(get_db_session),
):
    try:
        sub = await svc_choose(session, current_user.id, payload.planCode)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "status": sub.status,
        "planCode": sub.plan_code,
        "startDate": sub.start_date,
        "endDate": sub.end_date,
        "currentPeriodStart": sub.current_period_start,
        "currentPeriodEnd": sub.current_period_end,
    }


