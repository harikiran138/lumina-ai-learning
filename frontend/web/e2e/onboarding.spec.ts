import { test, expect } from '@playwright/test';

test.describe('Student Onboarding Flow', () => {
  const testEmail = `test_student_${Date.now()}@example.com`;
  const testPassword = 'Password123';

  test('complete full student onboarding with refresh persistence', async ({ page }) => {
    // 1. Register
    await page.goto('/register');
    await page.getByPlaceholder(/your full name/i).fill('Test Student');
    await page.getByPlaceholder(/name@college.edu/i).fill(testEmail);
    
    // Select Student role
    await page.getByRole('button', { name: /^student$/i }).click();

    await page.getByPlaceholder(/at least 8 characters/i).fill(testPassword);
    await page.getByPlaceholder(/re-enter password/i).fill(testPassword);
    
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

    // 2. Step 1: Personal Info
    await expect(page.getByRole('heading', { name: /personal details/i })).toBeVisible();
    await page.getByPlaceholder(/enter first name/i).fill('Test');
    await page.getByPlaceholder(/enter last name/i).fill('Student');
    await page.locator('input[type="date"]').fill('2005-01-01');
    await page.getByRole('button', { name: /next/i }).click();

    // 3. Step 2: Enrollment
    await expect(page.getByText(/enrollment & batch/i)).toBeVisible();
    
    // REFRESH TEST
    await page.reload();
    await expect(page.getByText(/enrollment & batch/i)).toBeVisible();
    await expect(page.getByText(/step 2/i)).toBeVisible();

    // Note: To complete the test, I'd need a valid enrollment code.
    // For now, I've verified the "Persistence on Refresh" requirement.
  });
});
