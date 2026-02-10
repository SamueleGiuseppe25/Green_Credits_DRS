"""add driver earnings and payouts

Revision ID: 0009_add_driver_earnings_and_payouts
Revises: 0008_add_drivers_and_collection_driver_fields
Create Date: 2026-02-09 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0009_add_driver_earnings_and_payouts"
down_revision: Union[str, None] = "0008_add_drivers_and_collection_driver_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "driver_earnings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=False),
        sa.Column(
            "collection_id",
            sa.Integer(),
            sa.ForeignKey("collections.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_driver_earnings_driver_id"), "driver_earnings", ["driver_id"])
    op.create_index(
        op.f("ix_driver_earnings_collection_id"), "driver_earnings", ["collection_id"], unique=True
    )

    op.create_table(
        "driver_payouts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_driver_payouts_driver_id"), "driver_payouts", ["driver_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_driver_payouts_driver_id"), table_name="driver_payouts")
    op.drop_table("driver_payouts")

    op.drop_index(op.f("ix_driver_earnings_collection_id"), table_name="driver_earnings")
    op.drop_index(op.f("ix_driver_earnings_driver_id"), table_name="driver_earnings")
    op.drop_table("driver_earnings")

