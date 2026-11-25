"""Create document_shares table for RBAC sharing

Revision ID: 0003_create_document_shares_table
Revises: 0002_create_documents_table
Create Date: 2026-11-01 00:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0003_create_document_shares_table'
down_revision: Union[str, None] = '0002_create_documents_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        uuid_type = postgresql.UUID(as_uuid=True)
    else:
        uuid_type = sa.CHAR(36)

    op.create_table(
        'document_shares',
        sa.Column('id', uuid_type, primary_key=True, nullable=False),
        sa.Column('document_id', uuid_type, sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', uuid_type, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='viewer'),
        sa.Column('shared_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('document_id', 'user_id', name='uq_document_shares_doc_user')
    )
    op.create_index(op.f('ix_document_shares_id'), 'document_shares', ['id'], unique=False)
    op.create_index(op.f('ix_document_shares_document_id'), 'document_shares', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_shares_user_id'), 'document_shares', ['user_id'], unique=False)
    op.create_index('ix_document_shares_user_role', 'document_shares', ['user_id', 'role'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_document_shares_user_role', table_name='document_shares')
    op.drop_index(op.f('ix_document_shares_user_id'), table_name='document_shares')
    op.drop_index(op.f('ix_document_shares_document_id'), table_name='document_shares')
    op.drop_index(op.f('ix_document_shares_id'), table_name='document_shares')
    op.drop_table('document_shares')

