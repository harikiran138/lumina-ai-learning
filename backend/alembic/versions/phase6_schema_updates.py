"""Phase 6 Schema Updates

Revision ID: phase6_001
Revises: 7a345def8901
Create Date: 2024-01-15

Add tables and columns for Phase 6 features:
- Real-time pathway adaptations
- Study groups and collaborative learning
- Enhanced analytics tracking
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'phase6_001'
down_revision = '7a345def8901'
branch_labels = None
depends_on = None


def upgrade():
    # Create realtime_adaptations table
    op.create_table('realtime_adaptations',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('student_id', sa.String(50), nullable=False),
        sa.Column('pathway_id', sa.String(36), nullable=False),
        sa.Column('adaptation_type', sa.String(50), nullable=False),
        sa.Column('trigger_data', sa.Text(), nullable=True),
        sa.Column('applied_changes', sa.Text(), nullable=True),
        sa.Column('effectiveness_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['pathway_id'], ['learning_pathways.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create study_groups table
    op.create_table('study_groups',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('course_id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('skill_focus', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('max_size', sa.Integer(), nullable=False, default=5),
        sa.Column('created_by', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create group_members table
    op.create_table('group_members',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('group_id', sa.String(36), nullable=False),
        sa.Column('student_id', sa.String(50), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('left_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='active'),
        sa.Column('role', sa.String(50), nullable=False, default='member'),
        sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], ),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'student_id', name='unique_group_student')
    )

    # Create group_activities table
    op.create_table('group_activities',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('group_id', sa.String(36), nullable=False),
        sa.Column('student_id', sa.String(50), nullable=False),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('activity_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], ),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create predictive_analytics table
    op.create_table('predictive_analytics',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('student_id', sa.String(50), nullable=False),
        sa.Column('course_id', sa.String(50), nullable=False),
        sa.Column('prediction_type', sa.String(50), nullable=False),
        sa.Column('prediction_value', sa.Float(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('feature_importance', sa.Text(), nullable=True),  # JSON
        sa.Column('prediction_horizon', sa.Integer(), nullable=True),  # days
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create ml_model_versions table
    op.create_table('ml_model_versions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('model_name', sa.String(100), nullable=False),
        sa.Column('version', sa.String(20), nullable=False),
        sa.Column('algorithm', sa.String(50), nullable=False),
        sa.Column('parameters', sa.Text(), nullable=True),  # JSON
        sa.Column('performance_metrics', sa.Text(), nullable=True),  # JSON
        sa.Column('training_data_size', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('model_name', 'version', name='unique_model_version')
    )

    # Add indexes for performance
    op.create_index('ix_realtime_adaptations_student_id', 'realtime_adaptations', ['student_id'])
    op.create_index('ix_realtime_adaptations_pathway_id', 'realtime_adaptations', ['pathway_id'])
    op.create_index('ix_realtime_adaptations_created_at', 'realtime_adaptations', ['created_at'])

    op.create_index('ix_study_groups_course_id', 'study_groups', ['course_id'])
    op.create_index('ix_study_groups_status', 'study_groups', ['status'])
    op.create_index('ix_study_groups_created_at', 'study_groups', ['created_at'])

    op.create_index('ix_group_members_group_id', 'group_members', ['group_id'])
    op.create_index('ix_group_members_student_id', 'group_members', ['student_id'])
    op.create_index('ix_group_members_status', 'group_members', ['status'])

    op.create_index('ix_group_activities_group_id', 'group_activities', ['group_id'])
    op.create_index('ix_group_activities_created_at', 'group_activities', ['created_at'])

    op.create_index('ix_predictive_analytics_student_id', 'predictive_analytics', ['student_id'])
    op.create_index('ix_predictive_analytics_course_id', 'predictive_analytics', ['course_id'])
    op.create_index('ix_predictive_analytics_created_at', 'predictive_analytics', ['created_at'])

    op.create_index('ix_ml_model_versions_model_name', 'ml_model_versions', ['model_name'])
    op.create_index('ix_ml_model_versions_is_active', 'ml_model_versions', ['is_active'])

    # Add new columns to existing tables
    op.add_column('learning_pathways', sa.Column('adaptation_enabled', sa.Boolean(), nullable=False, default=True))
    op.add_column('learning_pathways', sa.Column('last_adapted', sa.DateTime(), nullable=True))
    op.add_column('learning_pathways', sa.Column('adaptation_history', sa.Text(), nullable=True))  # JSON

    op.add_column('student_progress', sa.Column('adaptation_triggered', sa.Boolean(), nullable=False, default=False))
    op.add_column('student_progress', sa.Column('learning_session_id', sa.String(36), nullable=True))

    op.add_column('skill_levels', sa.Column('last_adapted', sa.DateTime(), nullable=True))
    op.add_column('skill_levels', sa.Column('adaptation_count', sa.Integer(), nullable=False, default=0))

    # Add learning_style to users table if it doesn't exist
    op.add_column('users', sa.Column('learning_style', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('collaboration_preference', sa.String(20), nullable=True, default='moderate'))


def downgrade():
    # Remove added columns
    op.drop_column('users', 'collaboration_preference')
    op.drop_column('users', 'learning_style')

    op.drop_column('skill_levels', 'adaptation_count')
    op.drop_column('skill_levels', 'last_adapted')

    op.drop_column('student_progress', 'learning_session_id')
    op.drop_column('student_progress', 'adaptation_triggered')

    op.drop_column('learning_pathways', 'adaptation_history')
    op.drop_column('learning_pathways', 'last_adapted')
    op.drop_column('learning_pathways', 'adaptation_enabled')

    # Drop indexes
    op.drop_index('ix_ml_model_versions_is_active')
    op.drop_index('ix_ml_model_versions_model_name')
    op.drop_index('ix_predictive_analytics_created_at')
    op.drop_index('ix_predictive_analytics_course_id')
    op.drop_index('ix_predictive_analytics_student_id')
    op.drop_index('ix_group_activities_created_at')
    op.drop_index('ix_group_activities_group_id')
    op.drop_index('ix_group_members_status')
    op.drop_index('ix_group_members_student_id')
    op.drop_index('ix_group_members_group_id')
    op.drop_index('ix_study_groups_created_at')
    op.drop_index('ix_study_groups_status')
    op.drop_index('ix_study_groups_course_id')
    op.drop_index('ix_realtime_adaptations_created_at')
    op.drop_index('ix_realtime_adaptations_pathway_id')
    op.drop_index('ix_realtime_adaptations_student_id')

    # Drop tables
    op.drop_table('ml_model_versions')
    op.drop_table('predictive_analytics')
    op.drop_table('group_activities')
    op.drop_table('group_members')
    op.drop_table('study_groups')
    op.drop_table('realtime_adaptations')
