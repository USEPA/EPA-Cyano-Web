"""reports table

Revision ID: 7f0146f3bfce
Revises: 970621e83c6c
Create Date: 2021-10-12 13:33:10.728504

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f0146f3bfce'
down_revision = '970621e83c6c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('report',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('report_num', sa.Integer(), nullable=False),
    sa.Column('report_id', sa.String(length=256), nullable=False),
    sa.Column('report_status', sa.String(length=32), nullable=False),
    sa.Column('report_file', sa.String(length=128), nullable=False),
    sa.Column('report_date', sa.String(length=10), nullable=False),
    sa.Column('report_objectids', sa.Text(), nullable=False),
    sa.Column('report_tribes', sa.Text(), nullable=False),
    sa.Column('report_counties', sa.Text(), nullable=False),
    sa.Column('report_ranges', sa.String(length=256), nullable=False),
    sa.Column('received_datetime', sa.DateTime(), nullable=False),
    sa.Column('started_datetime', sa.DateTime(), nullable=True),
    sa.Column('finished_datetime', sa.DateTime(), nullable=True),
    sa.Column('queue_time', sa.Integer(), nullable=True),
    sa.Column('exec_time', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('report')
    # ### end Alembic commands ###