"""add zone to drivers

Revision ID: 0017_add_zone_to_drivers
Revises: 0016_add_voucher_preference_to_collections
Create Date: 2026-02-23 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0017_add_zone_to_drivers"
down_revision: Union[str, None] = "0016_add_voucher_preference_to_collections"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "drivers",
        sa.Column("zone", sa.String(32), nullable=True, server_default=None),
    )


def downgrade() -> None:
    op.drop_column("drivers", "zone")
