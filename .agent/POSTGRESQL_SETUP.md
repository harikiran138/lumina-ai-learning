# 🔧 PostgreSQL Setup Guide for Lumina

## Step 1: Install PostgreSQL

### macOS (using Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows:
Download from: https://www.postgresql.org/download/windows/

---

## Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt, create database:
CREATE DATABASE lumina_dev;

# Create user (optional but recommended):
CREATE USER lumina_user WITH PASSWORD 'lumina_password_123';

# Grant privileges:
GRANT ALL PRIVILEGES ON DATABASE lumina_dev TO lumina_user;

# Exit PostgreSQL:
\q
```

---

## Step 3: Configure Connection

Create `.env.local` file in your project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```bash
# If using default postgres user:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumina_dev?schema=public"

# Or if using lumina_user:
DATABASE_URL="postgresql://lumina_user:lumina_password_123@localhost:5432/lumina_dev?schema=public"

# Other required variables:
JWT_SECRET="your-secret-key-at-least-32-characters-long"
NEXTAUTH_SECRET="another-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:1234"
OPENAI_API_KEY="sk-your-openai-key-if-you-have-one"
```

---

## Step 4: Setup Database Schema

```bash
# Push Prisma schema to database:
npm run db:push

# Expected output:
# 🚀 Your database is now in sync with your Prisma schema
# ✔ Generated Prisma Client
```

---

## Step 5: Seed with Active Data

```bash
# Seed the database with realistic data:
npm run db:seed

# Expected output:
# 🌱 Starting database seeding...
# 👤 Creating users...
# ✅ Created 10 users
# 🤖 Creating AI agents...
# ✅ Created 6 agents
# 📁 Creating projects...
# ✅ Created 5 projects
# 📋 Creating tasks...
# ✅ Created 20 tasks
# 💬 Creating chat logs...
# ✅ Created 30 chat logs
# 🎉 Database seeding completed successfully!
```

---

## Step 6: Verify Database Connection

```bash
# Start the development server:
npm run dev

# Then visit:
http://localhost:1234/api/db/test

# You should see:
{
  "status": "connected",
  "message": "Database connection successful",
  "stats": {
    "users": 10,
    "agents": 6,
    "tasks": 20,
    "chatLogs": 30
  }
}
```

---

## Step 7: Explore Database (Optional)

```bash
# Open Prisma Studio (Database GUI):
npm run db:studio

# Opens at: http://localhost:5555
```

---

## Troubleshooting

### Error: "Connection refused"
```bash
# Check if PostgreSQL is running:
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# If not running, start it:
brew services start postgresql@14  # macOS
sudo systemctl start postgresql  # Linux
```

### Error: "Database does not exist"
```bash
# Recreate database:
psql -U postgres
CREATE DATABASE lumina_dev;
\q
```

### Error: "Authentication failed"
```bash
# Reset postgres password (macOS):
brew services stop postgresql@14
rm /opt/homebrew/var/postgresql@14/postmaster.pid
brew services start postgresql@14

# Then reconnect and set password:
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
\q
```

### Reset Everything
```bash
# ⚠️ WARNING: This deletes all data!
npm run db:reset

# Then setup again:
npm run db:push
npm run db:seed
```

---

## Default Credentials (After Seeding)

```
Admin:     admin@lumina.ai / password123
Teacher:   teacher@lumina.ai / password123
Student:   student@lumina.ai / password123

And 7 more users with active data!
```

---

## Database Schema Overview

Your database now has:
- ✅ Users (10 active users)
- ✅ Sessions (for JWT auth)
- ✅ Agents (6 AI agents)  
- ✅ Tasks (20 active tasks)
- ✅ Projects (5 projects)
- ✅ ChatLogs (30 conversations)
- ✅ ContextMemory (shared agent data)
- ✅ Notifications (recent alerts)

---

## Next Steps

1. Start development server: `npm run dev`
2. Visit landing page: http://localhost:1234
3. Test database: http://localhost:1234/api/db/test
4. View agents: http://localhost:1234/api/agents
5. Try logging in with default credentials

**Your database is now connected and filled with active, realistic data! 🎉**
