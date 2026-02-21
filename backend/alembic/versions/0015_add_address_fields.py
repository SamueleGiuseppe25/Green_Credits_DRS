"""add address fields

Revision ID: 0015_add_address_fields
Revises: 0014_add_notifications_table
Create Date: 2026-02-21 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0015_add_address_fields"
down_revision: Union[str, None] = "0014_add_notifications_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("address", sa.String(512), nullable=True))
    op.add_column("collections", sa.Column("pickup_address", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("collections", "pickup_address")
    op.drop_column("users", "address")
