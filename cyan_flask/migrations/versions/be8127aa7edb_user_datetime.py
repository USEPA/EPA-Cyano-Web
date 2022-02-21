"""empty message

Revision ID: be8127aa7edb
Revises: 0f4c13350edb
Create Date: 2020-10-08 13:26:23.228652

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "be8127aa7edb"
down_revision = "0f4c13350edb"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("alter table user modify column created datetime")
    op.execute("alter table user modify column last_visit datetime")


def downgrade():
    op.execute("alter table user modify column created date")
    op.execute("alter table user modify column last_visit date")
