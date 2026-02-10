"""add drivers table and collection driver fields

Revision ID: 0008_add_drivers_and_collection_driver_fields
Revises: 0007_add_subscription_period_fields
Create Date: 2026-02-09 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0008_add_drivers_and_collection_driver_fields"
down_revision: Union[str, None] = "0007_add_subscription_period_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_driver to users
    op.add_column("users", sa.Column("is_driver", sa.Boolean(), nullable=False, server_default="0"))

    # Create drivers table
    op.create_table(
        "drivers",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("vehicle_type", sa.String(50), nullable=True),
        sa.Column("vehicle_plate", sa.String(20), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_drivers_user_id"), "drivers", ["user_id"], unique=True)

    # Add driver_id and proof_url to collections
    op.add_column("collections", sa.Column("driver_id", sa.Integer(), sa.ForeignKey("drivers.id"), nullable=True))
    op.add_column("collections", sa.Column("proof_url", sa.String(512), nullable=True))
    op.create_index(op.f("ix_collections_driver_id"), "collections", ["driver_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_collections_driver_id"), table_name="collections")
    op.drop_column("collections", "proof_url")
    op.drop_column("collections", "driver_id")
    op.drop_index(op.f("ix_drivers_user_id"), table_name="drivers")
    op.drop_table("drivers")
    op.drop_column("users", "is_driver")
