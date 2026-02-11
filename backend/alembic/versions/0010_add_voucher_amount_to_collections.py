"""add voucher amount to collections

Revision ID: 0010_add_voucher_amount_to_collections
Revises: 0009_add_driver_earnings_and_payouts
Create Date: 2026-02-10 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0010_add_voucher_amount_to_collections"
down_revision: Union[str, None] = "0009_add_driver_earnings_and_payouts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collections",
        sa.Column("voucher_amount_cents", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("collections", "voucher_amount_cents")

