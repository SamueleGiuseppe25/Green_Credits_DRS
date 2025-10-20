"""mvp tables

Revision ID: 0002_mvp_tables
Revises: 0001_initial
Create Date: 2025-10-02 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_mvp_tables"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("plan_code", sa.String(length=64), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    # status index
    op.execute("CREATE INDEX IF NOT EXISTS ix_subscriptions_status ON subscriptions (status)")

    op.create_table(
        "collection_slots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("weekday", sa.SmallInteger(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("preferred_return_point_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "collections",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("return_point_id", sa.Integer(), nullable=False, index=True),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, index=True),
        sa.Column("bag_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("notes", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "vouchers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("collection_id", sa.Integer(), nullable=False, index=True),
        sa.Column("store_chain", sa.String(length=64), nullable=False),
        sa.Column("store_name", sa.String(length=128), nullable=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("voucher_code", sa.String(length=128), nullable=True),
        sa.Column("proof_url", sa.String(length=255), nullable=True),
        sa.Column("donated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "wallet_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("ts", sa.DateTime(), nullable=False, index=True),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_index("ix_wallet_transactions_ts", table_name="wallet_transactions")
    op.drop_index("ix_wallet_transactions_user_id", table_name="wallet_transactions")
    op.drop_table("wallet_transactions")

    op.drop_index("ix_vouchers_collection_id", table_name="vouchers")
    op.drop_table("vouchers")

    op.drop_index("ix_collections_status", table_name="collections")
    op.drop_index("ix_collections_return_point_id", table_name="collections")
    op.drop_index("ix_collections_user_id", table_name="collections")
    op.drop_table("collections")

    op.drop_index("ix_collection_slots_user_id", table_name="collection_slots")
    op.drop_table("collection_slots")

    op.drop_index("ix_subscriptions_status", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_table("subscriptions")


