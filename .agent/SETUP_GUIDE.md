# 🚀 Lumina Production System - Complete Setup Guide

This guide walks you through setting up the Lumina AI Learning Platform from scratch to deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** 18.0 or higher
- ✅ **npm** 9.0 or higher
- ✅ **PostgreSQL** 14+ (local or cloud)
- ✅ **Git** installed
- ✅ **OpenAI API Key** (for multi-agent system)
- ✅ **Vercel Account** (for deployment)

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Check PostgreSQL (if installed locally)
psql --version  # Should be 14.0 or higher

# Check Git
git --version
```

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/harikiran138/lumina-ai-learning.git
cd lumina-ai-learning
```

### Step 2: Install Dependencies

```bash
npm install
```

This will:
- Install all required packages
- Automatically run `prisma generate` (postinstall hook)
- Set up Prisma Client

**Expected Output:**
```
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client
added 372 packages in 40s
```

### Step 3: Verify Installation

```bash
# Check if Prisma is installed
npx prisma --version

# Verify TypeScript
npx tsc --version
```

---

## Database Configuration

You have two options for database setup:

### Option A: Local PostgreSQL

1. **Install PostgreSQL** (if not installed):
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   sudo service postgresql start

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE lumina_dev;

   # Create user (optional)
   CREATE USER lumina_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE lumina_dev TO lumina_user;

   # Exit
   \q
   ```

3. **Connection String**:
   ```
   postgresql://postgres:postgres@localhost:5432/lumina_dev?schema=public
   ```

### Option B: Vercel Postgres (Cloud)

1. **Visit**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Create Storage** → **Postgres**
3. **Copy the connection strings** (you'll need them)

---

## Environment Variables

### Step 1: Create .env.local File

```bash
cp .env.example .env.local
```

### Step 2: Edit .env.local

```bash
nano .env.local  # or use your preferred editor
```

### Step 3: Fill in the Variables

#### Minimal Configuration (Local Development):

```env
# Database (use your actual connection string)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumina_dev?schema=public"

# Authentication (change these for production!)
NEXTAUTH_SECRET="lumina-dev-secret-change-this-12345"
NEXTAUTH_URL="http://localhost:1234"
JWT_SECRET="lumina-jwt-secret-change-this-67890"

# OpenAI (required for multi-agent system)
OPENAI_API_KEY="sk-your-actual-openai-api-key-here"
```

#### Full Configuration (All Options):

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumina_dev?schema=public"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:1234"
JWT_SECRET="your-jwt-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-your-openai-key"
OPENAI_ORG_ID=""  # Optional

# Agent Configuration
AGENT_CONCURRENT_LIMIT="5"
AGENT_TIMEOUT_MS="300000"
AGENT_RETRY_ATTEMPTS="3"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="Lumina AI Learning"
NEXT_PUBLIC_APP_URL="http://localhost:1234"
```

### Step 4: Secure Your Secrets

**Generate Strong Secrets:**
```bash
# Generate a random secret (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the output for `NEXTAUTH_SECRET` and `JWT_SECRET`.

---

## Running the Application

### Step 1: Setup Database Schema

```bash
# Push schema to database
npm run db:push
```

**Expected Output:**
```
🚀 Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

### Step 2: Seed the Database

```bash
npm run db:seed
```

**Expected Output:**
```
🌱 Starting database seeding...
👤 Creating users...
✅ Created 3 users
🤖 Creating AI agents...
✅ Created 6 agents
📁 Creating sample project...
✅ Created sample project
🎉 Database seeding completed successfully!
```

### Step 3: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.21
- Local:        http://localhost:1234
- Network:      http://192.168.1.x:1234

✓ Ready in 2.5s
```

### Step 4: Verify the Application

Open your browser and visit:

1. **Landing Page**: http://localhost:1234
2. **Database Test**: http://localhost:1234/api/db/test
3. **Agents API**: http://localhost:1234/api/agents

---

## Testing

### Test Database Connection

```bash
curl http://localhost:1234/api/db/test
```

**Expected Response:**
```json
{
  "status": "connected",
  "message": "Database connection successful",
  "stats": {
    "users": 3,
    "agents": 6,
    "tasks": 3,
    "chatLogs": 2
  }
}
```

### Test Authentication

#### Register a User:
```bash
curl -X POST http://localhost:1234/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User",
    "role": "STUDENT"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:1234/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

#### Get User Info (with token):
```bash
curl http://localhost:1234/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Agents

#### List All Agents:
```bash
curl http://localhost:1234/api/agents
```

#### Assign a Task:
```bash
curl -X POST http://localhost:1234/api/agents/AGENT_ID/assign \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "priority": 5
  }'
```

---

## Production Deployment

### Step 1: Prepare for Deployment

1. **Verify Build Success**:
   ```bash
   npm run build
   ```

2. **Type Check**:
   ```bash
   npm run type-check
   ```

3. **Commit All Changes**:
   ```bash
   git add .
   git commit -m "Production-ready Lumina v2.0"
   git push origin main
   ```

### Step 2: Vercel Setup

1. **Go to**: [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository**:
   - Select your GitHub repository
   - Choose the `main` branch

3. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Install Command: `npm install` (default)

### Step 3: Setup Vercel Postgres

1. **In Vercel Dashboard**:
   - Go to **Storage** tab
   - Click **Create Database**
   - Select **Postgres**
   - Choose region (closest to your users)
   - Create database

2. **Get Connection Strings**:
   - Vercel will show 3 connection strings:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL` ← Use this for DATABASE_URL
     - `POSTGRES_URL_NON_POOLING`

### Step 4: Configure Environment Variables

In Vercel → Project Settings → Environment Variables, add:

```env
# Database (from Vercel Postgres)
DATABASE_URL=<POSTGRES_PRISMA_URL value>

# Authentication (generate new secrets!)
NEXTAUTH_SECRET=<generate-new-32-char-secret>
NEXTAUTH_URL=https://your-app.vercel.app
JWT_SECRET=<generate-new-32-char-secret>

# OpenAI
OPENAI_API_KEY=sk-your-key

# App
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Lumina AI Learning
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 5: Deploy

Click **Deploy** button. Vercel will:
1. Clone your repository
2. Install dependencies
3. Run `prisma generate` (automatic)
4. Build Next.js application
5. Deploy to production

### Step 6: Setup Database Schema (Production)

After first deployment, you need to push the schema to production database:

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.production

# Push schema
DATABASE_URL="<your-production-url>" npx prisma db push
```

**Option B: Using Prisma Studio**
```bash
# Connect to production database locally
DATABASE_URL="<production-url>" npx prisma studio
```

### Step 7: Seed Production Database

```bash
DATABASE_URL="<production-url>" npm run db:seed
```

---

## Post-Deployment

### Verification Checklist

- [ ] Application loads at production URL
- [ ] Database connection works (`/api/db/test`)
- [ ] Can register new user
- [ ] Can login
- [ ] Agents are listed (`/api/agents`)
- [ ] Landing page displays correctly
- [ ] No console errors in browser
- [ ] Analytics tracking works

### Test Production API

```bash
# Replace YOUR_DOMAIN with your actual domain
DOMAIN="https://your-app.vercel.app"

# Test database
curl $DOMAIN/api/db/test

# Test agents
curl $DOMAIN/api/agents

# Register user
curl -X POST $DOMAIN/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"User"}'
```

### Monitor Deployment

1. **Vercel Dashboard** → Your Project → Deployments
2. Check **Functions** tab for API route logs
3. Monitor **Analytics** for traffic

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
```bash
# 1. Verify DATABASE_URL is correct
echo $DATABASE_URL  # or check .env.local

# 2. Test connection directly
npx prisma db execute --stdin <<< "SELECT 1"

# 3. Regenerate Prisma Client
npm run db:generate
```

### Issue: "Prisma Client not found"

**Solution:**
```bash
npm run db:generate
# or
npx prisma generate
```

### Issue: "Build fails on Vercel"

**Solution:**
1. Check **Deployment Logs** in Vercel
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Prisma schema errors

3. Fix locally first:
   ```bash
   npm run build          # Test build
   npm run type-check     # Check types
   ```

### Issue: "Authentication not working"

**Solution:**
1. Verify JWT_SECRET and NEXTAUTH_SECRET are set
2. Check token format in requests:
   ```
   Authorization: Bearer <token>
   ```
3. Verify session exists in database:
   ```bash
   npx prisma studio
   # Check Sessions table
   ```

### Issue: "Agents not working"

**Solution:**
1. Verify OPENAI_API_KEY is valid
2. Check agent status in database
3. View logs for errors
4. Test with simple task:
   ```bash
   curl -X POST http://localhost:1234/api/agents/AGENT_ID/assign \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","description":"Test task"}'
   ```

### Issue: "Module not found" errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run dev
```

### Database Reset (Development Only)

```bash
# WARNING: This deletes all data!
npm run db:reset

# Then re-seed
npm run db:seed
```

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma Client
npm run db:push         # Push schema to database
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio GUI
npm run db:migrate      # Create migration
npm run db:reset        # Reset database (⚠️ deletes data)

# Utilities
npm run lint            # Run linter
npm run type-check      # TypeScript type checking
npm run clean           # Clean build artifacts

# Legacy (for reference)
npm run legacy:start    # Run old Express server
```

---

## Next Steps

1. **Customize the UI**: Edit components in `/src/app/`
2. **Add Features**: Create new API routes or pages
3. **Configure Agents**: Modify agent prompts in database
4. **Setup Analytics**: Configure Vercel Analytics
5. **Add Tests**: Create test files with Vitest
6. **Setup CI/CD**: Configure GitHub Actions

---

## Support & Resources

- **Documentation**: Check `.agent/` folder for detailed docs
- **Architecture**: See `ARCHITECTURE.md`
- **API Docs**: See README.md
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

---

## Success Indicators

You'll know everything is working when:

✅ `npm run dev` starts without errors  
✅ http://localhost:1234 loads the landing page  
✅ `/api/db/test` returns database stats  
✅ `/api/agents` lists 6 agents  
✅ Can register and login users  
✅ `npm run build` completes successfully  
✅ Production deployment is green on Vercel  
✅ Production URL loads correctly  

---

**🎉 Congratulations! Your Lumina AI platform is now running!**
