"""
Collaborative Learning Service
Manages study groups, peer learning recommendations, and collaborative features.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from loguru import logger
import numpy as np

from .base import AnalyticsSubscriber
from .ml_skill_grouper import MLSkillGrouper
from .advanced_analytics import AdvancedAnalyticsService
from db import get_db

# Support both production and test models
import sys
def get_models():
    """Detect whether we are running in test mode and import appropriate models"""
    if any('pytest' in arg for arg in sys.argv) or 'test_' in __name__:
        from tests.models import (
            TestUser as User,
            TestCourse as Course,
            TestLearningPathway as LearningPathway,
            TestSkillLevel as SkillLevel,
            TestSkill as Skill,
            TestStudentProgress as StudentProgress,
            TestStudyGroup as StudyGroup,
            TestGroupMember as GroupMember
        )
    else:
        from models import (
            User, Course, LearningPathway, SkillLevel, Skill, StudentProgress,
            StudyGroup, GroupMember
        )
    return User, Course, LearningPathway, SkillLevel, Skill, StudentProgress, StudyGroup, GroupMember

# Get the appropriate models
User, Course, LearningPathway, SkillLevel, Skill, StudentProgress, StudyGroup, GroupMember = get_models()


class CollaborativeLearningService(AnalyticsSubscriber):
    """
    Service for managing collaborative learning features including
    study groups, peer recommendations, and group activities.
    """

    def __init__(self, ml_grouper: MLSkillGrouper, analytics: AdvancedAnalyticsService):
        super().__init__()
        self.ml_grouper = ml_grouper
        self.analytics = analytics
        self.group_cache = {}
        self.recommendation_cache = {}
        self.cache_ttl = 1800  # 30 minutes

    async def create_study_group(
        self,
        course_id: str,
        skill_focus: str = None,
        group_criteria: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create an optimal study group based on student profiles and learning goals.

        Args:
            course_id: The course ID
            skill_focus: Specific skill to focus on (optional)
            group_criteria: Criteria for group formation

        Returns:
            Created study group information
        """
        try:
            criteria = group_criteria or self._get_default_group_criteria()

            # Get potential group members
            potential_members = await self._find_potential_members(course_id, skill_focus, criteria)

            if len(potential_members) < criteria.get('min_size', 2):
                return {
                    'success': False,
                    'error': 'Insufficient potential members',
                    'available_members': len(potential_members)
                }

            # Select optimal group members
            selected_members = await self._select_optimal_members(
                potential_members, criteria
            )

            # Create group in database
            group = await self._create_group_record(
                course_id, skill_focus, selected_members, criteria
            )

            # Send invitations
            await self._send_group_invitations(group, selected_members)

            result = {
                'success': True,
                'group_id': group.id,
                'group_name': group.name,
                'members': selected_members,
                'skill_focus': skill_focus,
                'created_at': group.created_at.isoformat(),
                'criteria_used': criteria
            }

            # Cache group info
            self.group_cache[group.id] = result

            logger.info(f"Created study group {group.id} with {len(selected_members)} members")
            return result

        except Exception as e:
            logger.error(f"Error creating study group: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def get_peer_recommendations(
        self,
        student_id: str,
        criteria: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Get personalized peer learning recommendations.

        Args:
            student_id: The student's ID
            criteria: Recommendation criteria

        Returns:
            List of peer recommendations
        """
        try:
            cache_key = f"peers_{student_id}_{hash(str(criteria))}"
            if cache_key in self.recommendation_cache:
                cached = self.recommendation_cache[cache_key]
                if (datetime.utcnow() - cached['timestamp']).seconds < self.cache_ttl:
                    return cached['recommendations']

            criteria = criteria or {'limit': 5}

            # Get student's profile
            student_profile = await self._get_student_profile(student_id)

            # Find potential peers
            potential_peers = await self._find_potential_peers(student_id, student_profile)

            # Score and rank peers
            scored_peers = await self._score_peers(
                student_id, student_profile, potential_peers, criteria
            )

            # Sort by score and limit
            recommendations = sorted(
                scored_peers,
                key=lambda x: x['compatibility_score'],
                reverse=True
            )[:criteria.get('limit', 5)]

            # Cache results
            self.recommendation_cache[cache_key] = {
                'recommendations': recommendations,
                'timestamp': datetime.utcnow()
            }

            return recommendations

        except Exception as e:
            logger.error(f"Error getting peer recommendations: {str(e)}")
            return []

    async def get_study_groups(
        self,
        student_id: str = None,
        course_id: str = None,
        status: str = 'active'
    ) -> List[Dict[str, Any]]:
        """
        Get study groups based on filters.

        Args:
            student_id: Filter by student membership
            course_id: Filter by course
            status: Group status filter

        Returns:
            List of study groups
        """
        try:
            db = next(get_db())

            query = db.query(StudyGroup)

            if course_id:
                query = query.filter(StudyGroup.course_id == course_id)

            if status:
                query = query.filter(StudyGroup.status == status)

            groups = query.all()

            result = []
            for group in groups:
                # Get member info
                members = await self._get_group_members(group.id)

                # Check if student is member
                is_member = student_id in [m['student_id'] for m in members] if student_id else False

                group_info = {
                    'id': group.id,
                    'name': group.name,
                    'course_id': group.course_id,
                    'skill_focus': group.skill_focus,
                    'status': group.status,
                    'member_count': len(members),
                    'members': members if not student_id else [],  # Don't include full member list for privacy
                    'is_member': is_member,
                    'created_at': group.created_at.isoformat(),
                    'description': group.description
                }
                result.append(group_info)

            return result

        except Exception as e:
            logger.error(f"Error getting study groups: {str(e)}")
            return []

    async def join_study_group(self, student_id: str, group_id: str) -> Dict[str, Any]:
        """
        Join an existing study group.

        Args:
            student_id: The student's ID
            group_id: The group ID

        Returns:
            Join result
        """
        try:
            db = next(get_db())

            # Check if group exists and is open
            group = db.query(StudyGroup).filter(
                StudyGroup.id == group_id,
                StudyGroup.status == 'active'
            ).first()

            if not group:
                return {'success': False, 'error': 'Group not found or not active'}

            # Check if student is already a member
            existing_member = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.student_id == student_id
            ).first()

            if existing_member:
                return {'success': False, 'error': 'Already a member of this group'}

            # Check group size limit
            current_members = db.query(GroupMember).filter(
                GroupMember.group_id == group_id
            ).count()

            if current_members >= group.max_size:
                return {'success': False, 'error': 'Group is full'}

            # Add member
            member = GroupMember(
                group_id=group_id,
                student_id=student_id,
                joined_at=datetime.utcnow(),
                status='active'
            )
            db.add(member)
            db.commit()

            # Notify group members
            await self._notify_group_members(group_id, student_id, 'joined')

            return {
                'success': True,
                'group_id': group_id,
                'group_name': group.name,
                'joined_at': member.joined_at.isoformat()
            }

        except Exception as e:
            logger.error(f"Error joining study group: {str(e)}")
            db.rollback()
            return {'success': False, 'error': str(e)}

    async def leave_study_group(self, student_id: str, group_id: str) -> Dict[str, Any]:
        """
        Leave a study group.

        Args:
            student_id: The student's ID
            group_id: The group ID

        Returns:
            Leave result
        """
        try:
            db = next(get_db())

            # Find membership
            member = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.student_id == student_id,
                GroupMember.status == 'active'
            ).first()

            if not member:
                return {'success': False, 'error': 'Not a member of this group'}

            # Update status
            member.status = 'left'
            member.left_at = datetime.utcnow()
            db.commit()

            # Notify group members
            await self._notify_group_members(group_id, student_id, 'left')

            # Check if group should be disbanded
            await self._check_group_health(group_id)

            return {'success': True, 'left_at': member.left_at.isoformat()}

        except Exception as e:
            logger.error(f"Error leaving study group: {str(e)}")
            db.rollback()
            return {'success': False, 'error': str(e)}

    async def get_group_activities(
        self,
        group_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent activities for a study group.

        Args:
            group_id: The group ID
            limit: Maximum number of activities to return

        Returns:
            List of group activities
        """
        try:
            # This would typically query an activities table
            # For now, return mock activities
            activities = [
                {
                    'id': f'activity_{i}',
                    'type': 'member_joined',
                    'description': 'Member joined the group',
                    'timestamp': (datetime.utcnow() - timedelta(hours=i)).isoformat(),
                    'actor': f'student_{i}'
                }
                for i in range(min(limit, 5))
            ]

            return activities

        except Exception as e:
            logger.error(f"Error getting group activities: {str(e)}")
            return []

    async def _find_potential_members(
        self,
        course_id: str,
        skill_focus: str,
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Find potential members for a study group."""
        try:
            db = next(get_db())

            # Get students enrolled in the course
            pathways = db.query(LearningPathway).filter(
                LearningPathway.course_id == course_id,
                LearningPathway.status == 'active'
            ).all()

            potential_members = []
            for pathway in pathways:
                student_id = pathway.student_id

                # Get student profile
                profile = await self._get_student_profile(student_id)

                # Check if student matches criteria
                if await self._matches_group_criteria(profile, skill_focus, criteria):
                    potential_members.append({
                        'student_id': student_id,
                        'profile': profile,
                        'pathway_id': pathway.id
                    })

            return potential_members

        except Exception as e:
            logger.error(f"Error finding potential members: {str(e)}")
            return []

    async def _select_optimal_members(
        self,
        potential_members: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Select optimal members for the group."""
        try:
            target_size = criteria.get('size', 3)

            if len(potential_members) <= target_size:
                return potential_members

            # Use ML to select diverse but compatible members
            selected = []
            remaining = potential_members.copy()

            # Start with a random member
            import random
            first_member = random.choice(remaining)
            selected.append(first_member)
            remaining.remove(first_member)

            # Add members that complement the group
            while len(selected) < min(target_size, len(potential_members)) and remaining:
                best_match = await self._find_best_group_match(selected, remaining)
                if best_match:
                    selected.append(best_match)
                    remaining.remove(best_match)
                else:
                    break

            return selected

        except Exception as e:
            logger.error(f"Error selecting optimal members: {str(e)}")
            return potential_members[:criteria.get('size', 3)]

    async def _find_best_group_match(
        self,
        current_members: List[Dict[str, Any]],
        candidates: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Find the best candidate to add to the group."""
        try:
            best_candidate = None
            best_score = -1

            for candidate in candidates:
                # Calculate compatibility with current group
                compatibility_scores = []
                for member in current_members:
                    score = await self._calculate_peer_compatibility(
                        candidate['profile'], member['profile']
                    )
                    compatibility_scores.append(score)

                # Average compatibility
                avg_compatibility = np.mean(compatibility_scores)

                # Diversity bonus (prefer different learning styles)
                diversity_score = await self._calculate_group_diversity(
                    current_members + [candidate]
                )

                # Combined score
                total_score = 0.7 * avg_compatibility + 0.3 * diversity_score

                if total_score > best_score:
                    best_score = total_score
                    best_candidate = candidate

            return best_candidate

        except Exception as e:
            logger.error(f"Error finding best group match: {str(e)}")
            return candidates[0] if candidates else None

    async def _calculate_peer_compatibility(
        self,
        profile1: Dict[str, Any],
        profile2: Dict[str, Any]
    ) -> float:
        """Calculate compatibility between two student profiles."""
        try:
            compatibility = 0.0

            # Skill level compatibility (similar levels work well together)
            level1 = profile1.get('avg_skill_level', 0.5)
            level2 = profile2.get('avg_skill_level', 0.5)
            level_diff = abs(level1 - level2)

            if level_diff < 0.2:
                compatibility += 0.4  # Similar levels
            elif level_diff < 0.4:
                compatibility += 0.2  # Can help each other

            # Learning style compatibility
            style1 = profile1.get('learning_style', 'visual')
            style2 = profile2.get('learning_style', 'visual')

            if style1 == style2:
                compatibility += 0.3  # Same style - can share strategies
            else:
                compatibility += 0.2  # Different styles - can learn from each other

            # Progress rate compatibility
            rate1 = profile1.get('progress_rate', 1.0)
            rate2 = profile2.get('progress_rate', 1.0)
            rate_ratio = min(rate1, rate2) / max(rate1, rate2)

            compatibility += 0.3 * rate_ratio  # Similar progress rates

            return min(compatibility, 1.0)

        except Exception as e:
            logger.error(f"Error calculating peer compatibility: {str(e)}")
            return 0.5

    async def _calculate_group_diversity(self, members: List[Dict[str, Any]]) -> float:
        """Calculate diversity score for a group."""
        try:
            if len(members) < 2:
                return 0.5

            # Learning style diversity
            styles = [m['profile'].get('learning_style', 'visual') for m in members]
            unique_styles = len(set(styles))
            style_diversity = unique_styles / len(members)

            # Skill level diversity
            levels = [m['profile'].get('avg_skill_level', 0.5) for m in members]
            level_std = np.std(levels)
            level_diversity = min(level_std * 2, 1.0)  # Normalize

            # Combined diversity score
            return 0.6 * style_diversity + 0.4 * level_diversity

        except Exception as e:
            logger.error(f"Error calculating group diversity: {str(e)}")
            return 0.5

    async def _get_student_profile(self, student_id: str) -> Dict[str, Any]:
        """Get comprehensive student profile."""
        try:
            db = next(get_db())

            # Get skill levels
            skill_levels = db.query(SkillLevel).filter(
                SkillLevel.student_id == student_id
            ).all()

            # Get progress
            progress_entries = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id
            ).all()

            # Calculate profile metrics
            avg_skill_level = np.mean([s.level for s in skill_levels]) if skill_levels else 0.5
            total_attempts = len(progress_entries)
            avg_score = np.mean([p.score for p in progress_entries]) if progress_entries else 0

            # Estimate learning style (simplified)
            learning_style = await self._estimate_learning_style(progress_entries)

            # Calculate progress rate
            if progress_entries:
                date_range = (max(p.completed_at for p in progress_entries) -
                            min(p.completed_at for p in progress_entries)).days
                progress_rate = total_attempts / max(date_range, 1)
            else:
                progress_rate = 0

            return {
                'student_id': student_id,
                'avg_skill_level': float(avg_skill_level),
                'total_attempts': total_attempts,
                'avg_score': float(avg_score),
                'learning_style': learning_style,
                'progress_rate': float(progress_rate),
                'skill_count': len(skill_levels)
            }

        except Exception as e:
            logger.error(f"Error getting student profile: {str(e)}")
            return {}

    async def _estimate_learning_style(self, progress_entries: List) -> str:
        """Estimate student's learning style based on progress patterns."""
        # Simplified estimation - in practice would use more sophisticated analysis
        if not progress_entries:
            return 'visual'

        # Mock learning style estimation
        styles = ['visual', 'auditory', 'kinesthetic', 'reading']
        return np.random.choice(styles)

    async def _matches_group_criteria(
        self,
        profile: Dict[str, Any],
        skill_focus: str,
        criteria: Dict[str, Any]
    ) -> bool:
        """Check if student matches group criteria."""
        try:
            # Check skill level range
            skill_level = profile.get('avg_skill_level', 0.5)
            min_level = criteria.get('min_skill_level', 0)
            max_level = criteria.get('max_skill_level', 1)

            if not (min_level <= skill_level <= max_level):
                return False

            # Check activity level
            total_attempts = profile.get('total_attempts', 0)
            min_activity = criteria.get('min_activity', 0)

            if total_attempts < min_activity:
                return False

            return True

        except Exception as e:
            logger.error(f"Error checking group criteria: {str(e)}")
            return False

    async def _find_potential_peers(
        self,
        student_id: str,
        student_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Find potential peers for recommendations."""
        try:
            db = next(get_db())

            # Get all students (simplified - would filter by course/enrollment)
            all_students = db.query(User).filter(User.role == 'student').all()

            potential_peers = []
            for student in all_students:
                if student.id == student_id:
                    continue

                peer_profile = await self._get_student_profile(student.id)
                potential_peers.append({
                    'student_id': student.id,
                    'profile': peer_profile
                })

            return potential_peers

        except Exception as e:
            logger.error(f"Error finding potential peers: {str(e)}")
            return []

    async def _score_peers(
        self,
        student_id: str,
        student_profile: Dict[str, Any],
        potential_peers: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Score potential peers for compatibility."""
        try:
            scored_peers = []

            for peer in potential_peers:
                compatibility_score = await self._calculate_peer_compatibility(
                    student_profile, peer['profile']
                )

                # Additional scoring factors
                skill_complementarity = await self._calculate_skill_complementarity(
                    student_profile, peer['profile']
                )

                learning_style_match = 1.0 if student_profile.get('learning_style') == peer['profile'].get('learning_style') else 0.5

                # Combined score
                final_score = (
                    0.5 * compatibility_score +
                    0.3 * skill_complementarity +
                    0.2 * learning_style_match
                )

                scored_peers.append({
                    'student_id': peer['student_id'],
                    'compatibility_score': float(final_score),
                    'compatibility_breakdown': {
                        'overall_compatibility': compatibility_score,
                        'skill_complementarity': skill_complementarity,
                        'learning_style_match': learning_style_match
                    },
                    'profile': peer['profile']
                })

            return scored_peers

        except Exception as e:
            logger.error(f"Error scoring peers: {str(e)}")
            return []

    async def _calculate_skill_complementarity(
        self,
        profile1: Dict[str, Any],
        profile2: Dict[str, Any]
    ) -> float:
        """Calculate how well students' skills complement each other."""
        try:
            level1 = profile1.get('avg_skill_level', 0.5)
            level2 = profile2.get('avg_skill_level', 0.5)

            # Students with different skill levels can help each other
            level_diff = abs(level1 - level2)

            if level_diff > 0.3:
                return 0.8  # Good complementarity
            elif level_diff > 0.1:
                return 0.6  # Moderate complementarity
            else:
                return 0.4  # Similar levels - less complementarity

        except Exception as e:
            logger.error(f"Error calculating skill complementarity: {str(e)}")
            return 0.5

    async def _create_group_record(
        self,
        course_id: str,
        skill_focus: str,
        members: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> Any:
        """Create study group record in database."""
        try:
            db = next(get_db())

            # Generate group name
            group_name = f"Study Group - {skill_focus or 'General'} ({len(members)} members)"

            # Create group
            group = StudyGroup(
                course_id=course_id,
                name=group_name,
                skill_focus=skill_focus,
                description=f"Collaborative study group for {skill_focus or 'course topics'}",
                max_size=criteria.get('max_size', 5),
                created_by=members[0]['student_id'],  # First member as creator
                status='active',
                created_at=datetime.utcnow()
            )

            db.add(group)
            db.flush()  # Get group ID

            # Add members
            for member in members:
                group_member = GroupMember(
                    group_id=group.id,
                    student_id=member['student_id'],
                    joined_at=datetime.utcnow(),
                    status='active'
                )
                db.add(group_member)

            db.commit()
            return group

        except Exception as e:
            logger.error(f"Error creating group record: {str(e)}")
            db.rollback()
            raise

    async def _send_group_invitations(
        self,
        group: Any,
        members: List[Dict[str, Any]]
    ):
        """Send invitations to group members."""
        try:
            # This would integrate with notification system
            # For now, just log
            logger.info(f"Sent invitations for group {group.id} to {len(members)} members")

        except Exception as e:
            logger.error(f"Error sending group invitations: {str(e)}")

    async def _notify_group_members(
        self,
        group_id: str,
        student_id: str,
        action: str
    ):
        """Notify group members of changes."""
        try:
            # This would send WebSocket notifications
            logger.info(f"Notified group {group_id} members of {student_id} {action}")

        except Exception as e:
            logger.error(f"Error notifying group members: {str(e)}")

    async def _check_group_health(self, group_id: str):
        """Check if group should be disbanded or modified."""
        try:
            db = next(get_db())

            # Count active members
            active_members = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.status == 'active'
            ).count()

            if active_members < 2:
                # Disband group
                group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
                if group:
                    group.status = 'disbanded'
                    db.commit()
                    logger.info(f"Disbanded group {group_id} due to insufficient members")

        except Exception as e:
            logger.error(f"Error checking group health: {str(e)}")

    async def _get_group_members(self, group_id: str) -> List[Dict[str, Any]]:
        """Get members of a study group."""
        try:
            db = next(get_db())

            members = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.status == 'active'
            ).all()

            member_info = []
            for member in members:
                profile = await self._get_student_profile(member.student_id)
                member_info.append({
                    'student_id': member.student_id,
                    'joined_at': member.joined_at.isoformat(),
                    'profile': profile
                })

            return member_info

        except Exception as e:
            logger.error(f"Error getting group members: {str(e)}")
            return []

    def _get_default_group_criteria(self) -> Dict[str, Any]:
        """Get default criteria for group formation."""
        return {
            'size': 3,
            'max_size': 5,
            'min_size': 2,
            'min_skill_level': 0.2,
            'max_skill_level': 0.9,
            'min_activity': 5,
            'optimize_diversity': True
        }


# Global instance
collaborative_learning = CollaborativeLearningService(None, None)  # Will be initialized with services
