"""add slot status and collection slot fk

Revision ID: 0012_add_slot_status_and_collection_slot_fk
Revises: 0011_rename_processed_to_completed
Create Date: 2026-02-17 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012_add_slot_status_and_collection_slot_fk"
down_revision: Union[str, None] = "0011_rename_processed_to_completed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collection_slots",
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),
    )
    op.create_index("ix_collection_slots_status", "collection_slots", ["status"], unique=False)

    op.add_column(
        "collections",
        sa.Column("collection_slot_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_collections_collection_slot_id",
        "collections",
        "collection_slots",
        ["collection_slot_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_collections_collection_slot_id", "collections", ["collection_slot_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_collections_collection_slot_id", table_name="collections")
    op.drop_constraint("fk_collections_collection_slot_id", "collections", type_="foreignkey")
    op.drop_column("collections", "collection_slot_id")

    op.drop_index("ix_collection_slots_status", table_name="collection_slots")
    op.drop_column("collection_slots", "status")
