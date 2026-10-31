"""Create documents table

Revision ID: 0002_create_documents_table
Revises: 0001_create_users_table
Create Date: 2026-11-01 00:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002_create_documents_table'
down_revision: Union[str, None] = '0001_create_users_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        uuid_type = postgresql.UUID(as_uuid=True)
        json_type = postgresql.JSONB(astext_type=sa.Text())
    else:
        uuid_type = sa.CHAR(36)
        json_type = sa.JSON()

    op.create_table(
        'documents',
        sa.Column('id', uuid_type, primary_key=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False, server_default='Untitled Document'),
        sa.Column('content', json_type, nullable=False, server_default='{}'),
        sa.Column('owner_id', uuid_type, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
    op.create_index(op.f('ix_documents_title'), 'documents', ['title'], unique=False)
    op.create_index(op.f('ix_documents_owner_id'), 'documents', ['owner_id'], unique=False)
    op.create_index(op.f('ix_documents_is_deleted'), 'documents', ['is_deleted'], unique=False)
    op.create_index('ix_documents_owner_deleted_updated', 'documents', ['owner_id', 'is_deleted', 'updated_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_documents_owner_deleted_updated', table_name='documents')
    op.drop_index(op.f('ix_documents_is_deleted'), table_name='documents')
    op.drop_index(op.f('ix_documents_owner_id'), table_name='documents')
    op.drop_index(op.f('ix_documents_title'), table_name='documents')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
