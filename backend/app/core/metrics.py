from prometheus_client import Counter, Histogram, Gauge
import time

# --- AI Metrics ---
AI_REQUESTS = Counter(
    "lumina_ai_requests_total", "Total number of AI requests", ["provider", "model", "status"]
)

AI_LATENCY = Histogram(
    "lumina_ai_latency_seconds", "Latency of AI requests in seconds", ["provider", "model"]
)

AI_TOKENS_USED = Counter(
    "lumina_ai_tokens_total",
    "Total tokens used by AI",
    ["provider", "model", "type"],  # type="prompt" or "completion"
)

# --- Database Metrics ---
DB_OPERATIONS = Counter(
    "lumina_db_operations_total",
    "Total number of database operations",
    ["store", "operation", "status"],
)

DB_LATENCY = Histogram(
    "lumina_db_latency_seconds", "Latency of database operations", ["store", "operation"]
)

# --- Business Metrics ---
COURSE_CREATION = Counter("lumina_course_creation_total", "Total courses created", ["subject"])

STUDENT_SUBMISSIONS = Counter(
    "lumina_student_submissions_total", "Total student submissions graded", ["status"]
)
