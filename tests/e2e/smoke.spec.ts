import { test, expect } from '@playwright/test'

test.describe('ACE JAMB smoke', () => {
  test('student entry surface renders', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toContainText(/ACE JAMB|Preparing your ACE account|Create account|Sign in/i)
  })

  test('student entry surface remains usable on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
  })
})
