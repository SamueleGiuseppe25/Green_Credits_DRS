"""add frequency to collection_slots

Revision ID: 0005_add_frequency_to_collection_slots
Revises: 0004_collections_soft_delete_and_wallet_kind_len
Create Date: 2025-12-02 00:30:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_add_frequency_to_collection_slots"
down_revision: Union[str, None] = "0004_collections_soft_delete_and_wallet_kind_len"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collection_slots",
        sa.Column("frequency", sa.String(length=16), nullable=False, server_default="weekly"),
    )


def downgrade() -> None:
    op.drop_column("collection_slots", "frequency")


