"""defaults

Revision ID: 351647c1b5a7
Revises: b66eab762188
Create Date: 2020-05-07 13:33:54.528370

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '351647c1b5a7'
down_revision = 'b66eab762188'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        table_name='location',
        column_name='marked',
        server_default=sa.text('false')
    )
    op.alter_column(
        table_name='location',
        column_name='compare',
        server_default=sa.text('false')
    )
    op.alter_column(
        table_name='location',
        column_name='type',
        server_default=sa.text('1')
    )
    op.alter_column(
        table_name='settings',
        column_name='enable_alert',
        server_default=sa.text('false')
    )


def downgrade():
    op.alter_column(
        table_name='location',
        column_name='marked',
        server_default=None
    )
    op.alter_column(
        table_name='location',
        column_name='compare',
        server_default=None
    )
    op.alter_column(
        table_name='location',
        column_name='type',
        server_default=None
    )
    op.alter_column(
        table_name='settings',
        column_name='enable_alert',
        server_default=None
    )
