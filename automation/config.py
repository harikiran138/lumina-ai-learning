"""
Lumina Automation — Shared Configuration
"""

# ── Service URLs ───────────────────────────────────────────────────────────────
BASE_URL      = "http://localhost:8000"
FRONTEND_URL  = "http://localhost:3000"
API           = f"{BASE_URL}/api"

# ── Demo Credentials ───────────────────────────────────────────────────────────
# Password meets complexity: 1 uppercase + 1 number
DEMO_PASSWORD = "Lumina@138800"

USERS = {
    "admin": {
        "email":     "admin@lumina.com",
        "password":  DEMO_PASSWORD,
        "full_name": "System Admin",
        "role":      "super_admin",  # used only in seeding
    },
    "hod": {
        "email":     "hod@lumina.com",
        "password":  DEMO_PASSWORD,
        "full_name": "Head of Department",
        "role":      "hod",
    },
    "teacher": {
        "email":     "teacher@lumina.com",
        "password":  DEMO_PASSWORD,
        "full_name": "Master Teacher",
        "role":      "teacher",
    },
    "student": {
        "email":     "student@lumina.com",
        "password":  DEMO_PASSWORD,
        "full_name": "Demo Student",
        "role":      "student",
    },
}

# ── Timeouts ───────────────────────────────────────────────────────────────────
SERVICE_STARTUP_TIMEOUT = 90   # seconds to wait for backend/frontend
HTTP_TIMEOUT            = 30   # seconds per HTTP request
SEED_SCRIPT_TIMEOUT     = 60   # seconds for setup_demo_users.py subprocess

# ── Files ──────────────────────────────────────────────────────────────────────
LOG_FILE    = "lumina_automation.log"
REPORT_FILE = "LUMINA_REPORT.md"
