"""add claims table

Revision ID: 0013_add_claims_table
Revises: 0012_add_slot_status_and_collection_slot_fk
Create Date: 2026-02-21 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0013_add_claims_table"
down_revision: Union[str, None] = "0012_add_slot_status_and_collection_slot_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "claims",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(2048), nullable=False),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="open"),
        sa.Column("admin_response", sa.String(2048), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_claims_user_id", "claims", ["user_id"])
    op.create_index("ix_claims_status", "claims", ["status"])


def downgrade() -> None:
    op.drop_index("ix_claims_status", table_name="claims")
    op.drop_index("ix_claims_user_id", table_name="claims")
    op.drop_table("claims")
