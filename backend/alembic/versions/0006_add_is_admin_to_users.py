"""add is_admin to users

Revision ID: 0006_add_is_admin_to_users
Revises: 0005_add_frequency_to_collection_slots
Create Date: 2025-12-02 00:45:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_add_is_admin_to_users"
down_revision: Union[str, None] = "0005_add_frequency_to_collection_slots"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("users", "is_admin")


