import { expect, test, type Page } from '@playwright/test'

function makeToken(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      role,
      onboardingCompleted: true,
    }),
  ).toString('base64url')

  return `${header}.${payload}.signature`
}

async function seedSession(page: Page, role: string) {
  await page.context().addCookies([
    {
      name: 'access_token',
      value: makeToken(role),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ])
}

test.describe('Role route aliases', () => {
  test.describe.configure({ mode: 'serial' })

  test('redirects teacher aliases to faculty routes', async ({ page }) => {
    await seedSession(page, 'teacher')
    await page.goto('/teacher/dashboard', { waitUntil: 'commit' }).catch(() => null)
    await page.waitForURL('**/faculty/dashboard')
    await expect(page).toHaveURL(/\/faculty\/dashboard$/)
  })

  test('redirects peer tutor aliases to underscore routes', async ({ page }) => {
    await seedSession(page, 'peer_tutor')
    await page.goto('/peer-tutor/dashboard', { waitUntil: 'commit' }).catch(() => null)
    await page.waitForURL('**/peer_tutor/dashboard')
    await expect(page).toHaveURL(/\/peer_tutor\/dashboard$/)
  })

  test('redirects legacy content creator homes to live dashboards', async ({ page }) => {
    await seedSession(page, 'content_creator')
    await page.goto('/content_creator/studio', { waitUntil: 'commit' }).catch(() => null)
    await page.waitForURL('**/content_creator/dashboard')
    await expect(page).toHaveURL(/\/content_creator\/dashboard$/)
  })

  test('redirects legacy researcher homes to live dashboards', async ({ page }) => {
    await seedSession(page, 'researcher')
    await page.goto('/researcher/portal', { waitUntil: 'commit' }).catch(() => null)
    await page.waitForURL('**/researcher/dashboard')
    await expect(page).toHaveURL(/\/researcher\/dashboard$/)
  })
})
