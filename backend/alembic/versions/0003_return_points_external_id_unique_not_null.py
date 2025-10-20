"""make return_points.external_id unique and not null

Revision ID: 0003_rp_external_id_unique
Revises: 0002_mvp_tables
Create Date: 2025-10-02 00:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_rp_external_id_unique"
down_revision: Union[str, None] = "0002_mvp_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill: set NULL external_id -> generated ids to avoid NOT NULL violation (SQLite/Postgres safe)
    op.execute(
        """
        UPDATE return_points
        SET external_id = 'rp_' || id
        WHERE external_id IS NULL
        """
    )
    # Defensive dedupe: keep lowest id per external_id
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            """
            DELETE FROM return_points t
            USING return_points d
            WHERE t.external_id = d.external_id
              AND t.id > d.id
            """
        )
    elif bind.dialect.name == "sqlite":
        op.execute(
            """
            DELETE FROM return_points
            WHERE external_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM return_points rp2
                WHERE rp2.external_id = return_points.external_id
                  AND rp2.rowid < return_points.rowid
              )
            """
        )
    # Alter to NOT NULL
    with op.batch_alter_table("return_points") as batch:
        batch.alter_column("external_id", existing_type=sa.String(length=64), nullable=False)
    # Add unique constraint (idempotent on SQLite by IF NOT EXISTS via raw SQL)
    if bind.dialect.name == "sqlite":
        op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_return_points_external_id ON return_points (external_id)")
    else:
        op.create_unique_constraint("uq_return_points_external_id", "return_points", ["external_id"])


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        op.execute("DROP INDEX IF EXISTS uq_return_points_external_id")
    else:
        op.drop_constraint("uq_return_points_external_id", "return_points", type_="unique")
    with op.batch_alter_table("return_points") as batch:
        batch.alter_column("external_id", existing_type=sa.String(length=64), nullable=True)



