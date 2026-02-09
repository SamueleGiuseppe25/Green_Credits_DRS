"""add subscription period fields

Revision ID: 0007_add_subscription_period_fields
Revises: 0006_add_is_admin_to_users
Create Date: 2026-02-08 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007_add_subscription_period_fields"
down_revision: Union[str, None] = "0006_add_is_admin_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("subscriptions", sa.Column("current_period_start", sa.Date(), nullable=True))
    op.add_column("subscriptions", sa.Column("current_period_end", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("subscriptions", "current_period_end")
    op.drop_column("subscriptions", "current_period_start")

