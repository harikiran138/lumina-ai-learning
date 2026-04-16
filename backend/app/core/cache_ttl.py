"""
CacheTTL — canonical TTL constants for all Redis cache writes.

Every cache write MUST use one of these constants (or a custom int).
NEVER call redis.set(key, value) without an expiry — it causes unbounded growth.
"""


class CacheTTL:
    # Auth
    SESSION = 86_400          # 24 h  — JWT session / token cache

    # Academic data
    COURSE_CONTENT = 7_200    # 2 h   — course metadata, modules
    STUDENT_PROFILE = 1_800   # 30 min — learner profile, BKT state
    QUIZ_RESULT = 3_600       # 1 h   — quiz score, spaced repetition result
    LEADERBOARD = 300         # 5 min — leaderboard (updates frequently)
    TEACHER_CLASSES = 600     # 10 min — teacher assignment list

    # AI Queue
    AI_ANSWER_QUEUE = 604_800 # 7 days — TILA queue items (faculty approval window)
    AI_DRAFT = 3_600          # 1 h   — cached AI draft before teacher review

    # Analytics
    ANALYTICS_SUMMARY = 900   # 15 min — dashboard summary stats
    INTERVENTION = 600        # 10 min — at-risk intervention list

    # Generic fallback
    DEFAULT = 3_600           # 1 h
    SHORT = 300               # 5 min
    LONG = 86_400             # 24 h
