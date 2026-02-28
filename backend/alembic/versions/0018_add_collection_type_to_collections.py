"""add collection_type to collections

Revision ID: 0018_add_collection_type_to_collections
Revises: 0017_add_zone_to_drivers
Create Date: 2026-02-28 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0018_add_collection_type_to_collections"
down_revision: Union[str, None] = "0017_add_zone_to_drivers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "collections",
        sa.Column("collection_type", sa.String(8), nullable=True, server_default="bottles"),
    )


def downgrade() -> None:
    op.drop_column("collections", "collection_type")
