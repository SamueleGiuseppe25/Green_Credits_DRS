"""add voucher preference to collections

Revision ID: 0016_add_voucher_preference_to_collections
Revises: 0015_add_address_fields
Create Date: 2026-02-21 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0016_add_voucher_preference_to_collections"
down_revision: Union[str, None] = "0015_add_address_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collections",
        sa.Column("voucher_preference", sa.String(8), nullable=True, server_default=None),
    )
    op.add_column(
        "collections",
        sa.Column("charity_id", sa.String(64), nullable=True, server_default=None),
    )


def downgrade() -> None:
    op.drop_column("collections", "charity_id")
    op.drop_column("collections", "voucher_preference")
