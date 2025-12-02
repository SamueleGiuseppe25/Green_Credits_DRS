"""collections soft delete and wallet kind length

Revision ID: 0004_collections_soft_delete_and_wallet_kind_len
Revises: 0003_rp_external_id_unique
Create Date: 2025-12-02 00:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0004_collections_soft_delete_and_wallet_kind_len"
down_revision: Union[str, None] = "0003_rp_external_id_unique"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure alembic_version can store long revision ids (default 32 can be too short)
    try:
        op.alter_column(
            "alembic_version",
            "version_num",
            existing_type=sa.String(length=32),
            type_=sa.String(length=64),
            existing_nullable=False,
        )
    except Exception:
        # If the table/size already fits, ignore
        pass

    # Add soft delete flag to collections (NOT NULL default false)
    op.add_column(
        "collections",
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    # Ensure created_at / updated_at have server defaults (Postgres)
    op.alter_column(
        "collections",
        "created_at",
        existing_type=sa.DateTime(),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )
    op.alter_column(
        "collections",
        "updated_at",
        existing_type=sa.DateTime(),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )

    # Widen wallet transaction kind (VARCHAR 16 -> 32)
    op.alter_column(
        "wallet_transactions",
        "kind",
        existing_type=sa.String(length=16),
        type_=sa.String(length=32),
        existing_nullable=False,
    )


def downgrade() -> None:
    # Narrow wallet transaction kind back
    op.alter_column(
        "wallet_transactions",
        "kind",
        existing_type=sa.String(length=32),
        type_=sa.String(length=16),
        existing_nullable=False,
    )
    # Drop is_archived flag
    op.drop_column("collections", "is_archived")
    # Leave server_default changes as-is (no-op)


