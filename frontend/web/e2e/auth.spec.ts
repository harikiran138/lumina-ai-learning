import { test, expect } from '@playwright/test'

test.describe('Authentication E2E', () => {
  test('login page loads and shows sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in|welcome|lumina/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('shows validation error for invalid email on submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('bad-email')
    await page.getByLabel(/password/i).fill('Password1')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible({ timeout: 5000 })
  })

  test('unauthenticated access to /student redirects to /login', async ({ page }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies()
    await page.goto('/student/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 })
  })
})
