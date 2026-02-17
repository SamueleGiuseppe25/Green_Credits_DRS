"""rename processed to completed

Revision ID: 0011_rename_processed_to_completed
Revises: 0010_add_voucher_amount_to_collections
Create Date: 2026-02-17 00:00:00

"""

from typing import Sequence, Union

from alembic import op


revision: str = "0011_rename_processed_to_completed"
down_revision: Union[str, None] = "0010_add_voucher_amount_to_collections"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE collections SET status = 'completed' WHERE status = 'processed'")


def downgrade() -> None:
    op.execute("UPDATE collections SET status = 'processed' WHERE status = 'completed'")
