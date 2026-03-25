import { test, expect } from '@playwright/test'

test.describe('Navigation E2E', () => {
  test('login page title is visible', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/lumina/i)
  })

  test('/ redirects or loads without crashing', async ({ page }) => {
    const response = await page.goto('/')
    // Either a 200 or a 3xx redirect — both acceptable
    expect([200, 301, 302, 307, 308]).toContain(response?.status())
  })

  test('login page has search engine friendly meta/title tag', async ({ page }) => {
    await page.goto('/login')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})
