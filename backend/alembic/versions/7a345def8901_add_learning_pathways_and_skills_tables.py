"""add learning pathways and skills tables

Revision ID: 7a345def8901
Revises: 5b81afe1d49c
Create Date: 2023-10-23 14:30:15.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = '7a345def8901'
down_revision: Union[str, None] = '5b81afe1d49c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Wait for initial migration to complete
    op.execute('SELECT 1 FROM users LIMIT 1')
    
    # Skills table
    op.create_table(
        'skills',
        sa.Column('skill_id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('level', sa.String(50), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('skill_metadata', JSONB),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime),
        sa.Column('course_id', sa.String(36)),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.Index('idx_skills_category', 'category'),
        sa.Index('idx_skills_level', 'level')
    )

    # Skill prerequisites
    op.create_table(
        'skill_prerequisites',
        sa.Column('skill_id', sa.String(36), nullable=False),
        sa.Column('prerequisite_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id']),
        sa.ForeignKeyConstraint(['prerequisite_id'], ['skills.skill_id']),
        sa.PrimaryKeyConstraint('skill_id', 'prerequisite_id')
    )

    # Learning pathways
    op.create_table(
        'learning_pathways',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('student_id', sa.Integer, nullable=False),
        sa.Column('course_id', sa.String(50), nullable=False),
        sa.Column('pathway_data', JSONB, nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime),
        sa.Column('completed_at', sa.DateTime),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.Index('idx_pathways_student', 'student_id'),
        sa.Index('idx_pathways_course', 'course_id'),
        sa.Index('idx_pathways_status', 'status')
    )

    # Student skill levels
    op.create_table(
        'skill_levels',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('student_id', sa.Integer, nullable=False),
        sa.Column('skill_id', sa.String(36), nullable=False),
        sa.Column('level', sa.Float, nullable=False),
        sa.Column('confidence', sa.Float),
        sa.Column('last_assessed', sa.DateTime, nullable=False),
        sa.Column('assessment_history', JSONB),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id']),
        sa.UniqueConstraint('student_id', 'skill_id'),
        sa.Index('idx_skill_levels_student', 'student_id'),
        sa.Index('idx_skill_levels_skill', 'skill_id')
    )

    # Learning activities
    op.create_table(
        'learning_activities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('student_id', sa.Integer, nullable=False),
        sa.Column('course_id', sa.String(50), nullable=False),
        sa.Column('skill_id', sa.String(36)),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('content_id', sa.String(36)),
        sa.Column('performance_data', JSONB),
        sa.Column('duration_minutes', sa.Integer),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id']),
        sa.Index('idx_activities_student', 'student_id'),
        sa.Index('idx_activities_course', 'course_id'),
        sa.Index('idx_activities_type', 'activity_type'),
        sa.Index('idx_activities_created', 'created_at')
    )

    # Student preferences
    op.create_table(
        'student_preferences',
        sa.Column('student_id', sa.Integer, primary_key=True),
        sa.Column('learning_style', sa.String(50)),
        sa.Column('difficulty_preference', sa.String(50)),
        sa.Column('engagement_pattern', JSONB),
        sa.Column('ui_preferences', JSONB),
        sa.Column('notification_settings', JSONB),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'])
    )

    # Learning checkpoints
    op.create_table(
        'learning_checkpoints',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('pathway_id', sa.String(36), nullable=False),
        sa.Column('skill_id', sa.String(36), nullable=False),
        sa.Column('checkpoint_data', JSONB, nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('score', sa.Float),
        sa.Column('feedback', JSONB),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('completed_at', sa.DateTime),
        sa.ForeignKeyConstraint(['pathway_id'], ['learning_pathways.id']),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id']),
        sa.Index('idx_checkpoints_pathway', 'pathway_id'),
        sa.Index('idx_checkpoints_skill', 'skill_id'),
        sa.Index('idx_checkpoints_status', 'status')
    )


def downgrade() -> None:
    op.drop_table('learning_checkpoints')
    op.drop_table('student_preferences')
    op.drop_table('learning_activities')
    op.drop_table('skill_levels')
    op.drop_table('learning_pathways')
    op.drop_table('skill_prerequisites')
    op.drop_table('skills')