import { test, expect } from '@playwright/test'

test.describe('Accessibility E2E', () => {
  test('login form inputs have accessible labels', async ({ page }) => {
    await page.goto('/login')
    // Email and password inputs should be reachable by their label text
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('login page has no elements with empty aria-label', async ({ page }) => {
    await page.goto('/login')
    const emptyAriaLabels = await page.$$('[aria-label=""]')
    expect(emptyAriaLabels).toHaveLength(0)
  })

  test('interactive buttons are keyboard-focusable on login page', async ({ page }) => {
    await page.goto('/login')
    // Tab to first focusable element
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    // The focused element should be a form element or a button
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused)
  })
})
