# Vercel Deployment Setup Guide

This guide will help you set up Vercel deployment credentials for your GitHub Actions workflow.

## Problem

Your GitHub Actions workflow is failing with:
```
Error: No existing credentials found. Please run vercel login or pass "--token"
```

## Solution

You need to add three secrets to your GitHub repository:

### Required Secrets

1. **VERCEL_TOKEN** - Your Vercel authentication token
2. **VERCEL_ORG_ID** - Your Vercel organization/team ID
3. **VERCEL_PROJECT_ID** - Your Vercel project ID

---

## Step-by-Step Setup

### Step 1: Get Your Vercel Token

1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Give it a name (e.g., "GitHub Actions")
4. Set the scope to **"Full Account"** (or limit to specific projects if preferred)
5. Click **"Create"**
6. **Copy the token immediately** (you won't be able to see it again!)

### Step 2: Get Your Vercel Organization ID

**Option A: From Vercel Dashboard**
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile/team in the top right
3. Go to **Settings** → **General**
4. Find **"Team ID"** or **"Organization ID"**
5. Copy the ID

**Option B: Using Vercel CLI**
```bash
cd frontend
npx vercel link
# Follow the prompts to link your project
# Then check the .vercel/project.json file
cat .vercel/project.json
```

The `orgId` field is your Organization ID.

### Step 3: Get Your Vercel Project ID

**Option A: From project.json (after linking)**
```bash
cd frontend
cat .vercel/project.json
```

Look for the `projectId` field.

**Option B: From Vercel Dashboard**
1. Go to your project on Vercel
2. Click **Settings**
3. Scroll to **"Project ID"**
4. Copy the ID

### Step 4: Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/harikiran138/lumina-ai-learning`
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"**
5. Add each secret:

   **Secret 1:**
   - Name: `VERCEL_TOKEN`
   - Value: [paste your Vercel token]
   - Click **"Add secret"**

   **Secret 2:**
   - Name: `VERCEL_ORG_ID`
   - Value: [paste your organization ID]
   - Click **"Add secret"**

   **Secret 3:**
   - Name: `VERCEL_PROJECT_ID`
   - Value: [paste your project ID]
   - Click **"Add secret"**

### Step 5: Verify Setup

After adding all three secrets:

1. Make a small change to your frontend code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test Vercel deployment"
   git push origin main
   ```
3. Go to **Actions** tab in your GitHub repository
4. Watch the deployment workflow run
5. It should now authenticate successfully!

---

## Troubleshooting

### Issue: "Project not found"
**Solution**: Make sure your `VERCEL_PROJECT_ID` is correct. Re-link your project:
```bash
cd frontend
npx vercel link
```

### Issue: "Unauthorized"
**Solution**: 
- Check that your `VERCEL_TOKEN` is valid
- Ensure the token has the correct permissions
- Generate a new token if needed

### Issue: Workflow still failing
**Solution**:
1. Check the GitHub Actions logs for specific error messages
2. Verify all three secrets are added correctly (no extra spaces)
3. Ensure your Vercel project exists and is accessible

---

## Quick Reference

### Your Workflow File
Location: `.github/workflows/deploy-frontend.yml`

The workflow is already correctly configured to use these secrets:
```yaml
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Useful Commands

**Link project to Vercel:**
```bash
cd frontend
npx vercel link
```

**Deploy manually (for testing):**
```bash
cd frontend
npx vercel --prod --token=YOUR_TOKEN
```

**Check deployment status:**
```bash
npx vercel ls
```

---

## Security Notes

- ⚠️ **Never commit tokens to your repository**
- ✅ Always use GitHub Secrets for sensitive data
- 🔒 Tokens should be treated like passwords
- 🔄 Rotate tokens periodically for security

---

## Next Steps

Once deployment succeeds:
1. Your app will be live on Vercel
2. Check the deployment URL in the GitHub Actions logs
3. Test your deployed application
4. Monitor for any errors in Vercel dashboard

## Support

If you continue to have issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [GitHub Actions logs](https://github.com/harikiran138/lumina-ai-learning/actions)
- Contact Vercel support if needed
