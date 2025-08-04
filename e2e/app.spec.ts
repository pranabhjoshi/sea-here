import { test, expect } from '@playwright/test'

test('app loads and displays title', async ({ page }) => {
  await page.goto('/')
  
  // Check that the page title contains Sea Here
  await expect(page).toHaveTitle(/Sea Here/)
  
  // Check that the main heading is visible
  await expect(page.getByRole('heading', { name: 'Sea Here' })).toBeVisible()
})
