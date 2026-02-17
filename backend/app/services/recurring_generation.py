"""
Generate collection rows from active recurring slots.
"""

from datetime import datetime, timedelta, date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Collection, CollectionSlot


def _get_occurrence_dates(
    slot: CollectionSlot,
    weeks_ahead: int,
) -> list[date]:
    """Compute occurrence dates for a slot within the next weeks_ahead weeks."""
    today = datetime.utcnow().date()
    end_date = today + timedelta(weeks=weeks_ahead)
    dates: list[date] = []

    # Python weekday: Mon=0, Sun=6 (matches our slot.weekday)
    target_weekday = slot.weekday

    if slot.frequency == "weekly":
        for plus_days in range(weeks_ahead * 7 + 1):
            d = today + timedelta(days=plus_days)
            if d > end_date:
                break
            if d.weekday() == target_weekday:
                dates.append(d)
    elif slot.frequency in ("fortnightly", "every_2_weeks"):
        # Find first occurrence on or after today
        days_until = (target_weekday - today.weekday()) % 7
        first = today + timedelta(days=days_until)
        if first < today:
            first += timedelta(days=7)
        d = first
        while d <= end_date:
            dates.append(d)
            d += timedelta(days=14)
    elif slot.frequency == "monthly":
        # Every 4 weeks
        days_until = (target_weekday - today.weekday()) % 7
        first = today + timedelta(days=days_until)
        if first < today:
            first += timedelta(days=7)
        d = first
        while d <= end_date:
            dates.append(d)
            d += timedelta(days=28)
    else:
        # Fallback to weekly
        for plus_days in range(weeks_ahead * 7 + 1):
            d = today + timedelta(days=plus_days)
            if d > end_date:
                break
            if d.weekday() == target_weekday:
                dates.append(d)

    return dates


async def generate_collections(
    session: AsyncSession,
    weeks_ahead: int = 4,
) -> dict:
    """
    Generate collection rows from active recurring slots for the next weeks_ahead weeks.
    Returns {"generated": count_created, "skipped": count_already_existed}.
    """
    generated = 0
    skipped = 0

    slots = (
        await session.execute(
            select(CollectionSlot).where(CollectionSlot.status == "active")
        )
    ).scalars().all()

    for slot in slots:
        if slot.preferred_return_point_id is None:
            continue

        for occ_date in _get_occurrence_dates(slot, weeks_ahead):
            # scheduled_at: combine date with slot.start_time
            scheduled_at = datetime.combine(
                occ_date,
                slot.start_time,
            )

            # Skip past dates
            if scheduled_at < datetime.utcnow():
                continue

            # Check if collection already exists for this slot + date (same day)
            day_start = datetime.combine(occ_date, slot.start_time)
            day_end = day_start + timedelta(days=1)
            existing = await session.scalar(
                select(Collection.id).where(
                    Collection.collection_slot_id == slot.id,
                    Collection.scheduled_at >= day_start,
                    Collection.scheduled_at < day_end,
                ).limit(1)
            )
            if existing is not None:
                skipped += 1
                continue

            col = Collection(
                user_id=slot.user_id,
                return_point_id=slot.preferred_return_point_id,
                scheduled_at=scheduled_at,
                status="scheduled",
                bag_count=1,
                notes=None,
                collection_slot_id=slot.id,
                driver_id=None,
            )
            session.add(col)
            generated += 1

    await session.commit()
    return {"generated": generated, "skipped": skipped}
