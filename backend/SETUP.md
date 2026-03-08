# Backend Setup & Migrations

This guide explains how to set up the Supabase database for the Lumina AI Learning platform from scratch.

## Prerequisites

1.  A Supabase project (create one at supabase.com)
2.  Python 3.8+
3.  Redis (for caching, optional but highly recommended)

## 1. Environment Variables (`.env`)

Create a `.env` file in the `backend/` directory with the following keys:

```ini
# Supabase Configuration (Required)
SUPABASE_URL="https://<your-project-id>.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database Connection (Required for SQLAlchemy if used, otherwise Supabase Python client uses the URL/Keys)
DATABASE_URL="postgresql://postgres:<password>@db.<your-project-id>.supabase.co:5432/postgres"

# Authentication
SECRET_KEY="generate-a-secure-random-string-here"
ACCESS_TOKEN_EXPIRE_MINUTES="11520"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"
```

## 2. Supabase Tables required

You must create the following tables in your Supabase project (either via the SQL Editor or the Table UI). The app uses the Supabase Python client for primary CRUD operations.

### `users` table
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `email` (text, unique, not null)
- `name` (text, not null)
- `role` (text, not null, default 'student')
- `phone` (text)
- `profile_image` (text)
- `created_at` (timestamp, default `now()`)

### `courses` table
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `course_name` (text, not null)
- `course_code` (text, unique, not null)
- `description` (text)
- `teacher_id` (uuid, foreign key references `users.id`)
- `modules` (jsonb, default `[]`)
- `is_published` (boolean, default false)
- `created_at` (timestamp, default `now()`)

### `user_data` table
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `user_id` (uuid, foreign key references `users.id`)
- `progress` (jsonb, default `{}`)
- `quiz_history` (jsonb, default `[]`)
- `notes` (jsonb, default `[]`)
- `created_at` (timestamp, default `now()`)

### `community_messages` table
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `student_id` (uuid, foreign key references `users.id`)
- `content` (text, not null)
- `is_moderated` (boolean, default false)
- `created_at` (timestamp, default `now()`)

## 3. Row Level Security (RLS)

By default, the Python `supabase` client instantiated with the `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS for backend operations. If the frontend connects directly, ensure proper RLS policies are set in the Supabase Dashboard.

## 4. Run the Project

1. Install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

> Note: To verify the setup, run `pytest test_supabase.py -v`. It will automatically create, verify, and clean up test records in your Supabase DB.
