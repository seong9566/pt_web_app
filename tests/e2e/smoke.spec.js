import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load email login page', async ({ page }) => {
    await page.goto('/email-login')
    
    const emailLoginContainer = page.locator('.email-login')
    await expect(emailLoginContainer).toBeVisible()
  })

  test('should display email and password input fields', async ({ page }) => {
    await page.goto('/email-login')
    
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should display login and signup tabs', async ({ page }) => {
    await page.goto('/email-login')
    
    const tabs = page.locator('.email-login__tab')
    await expect(tabs).toHaveCount(2)
    
    const loginTab = tabs.first()
    const signupTab = tabs.last()
    
    await expect(loginTab).toBeVisible()
    await expect(signupTab).toBeVisible()
  })

  test('should display submit button', async ({ page }) => {
    await page.goto('/email-login')
    
    const submitBtn = page.locator('.email-login__btn--primary')
    await expect(submitBtn).toBeVisible()
  })

  test('should capture baseline screenshot of email login page', async ({ page }) => {
    await page.goto('/email-login')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: 'tests/e2e/screenshots/email-login-baseline.png' })
  })

  test('should capture baseline screenshot of login tab', async ({ page }) => {
    await page.goto('/email-login')
    
    const emailLoginContainer = page.locator('.email-login')
    await emailLoginContainer.screenshot({ path: 'tests/e2e/screenshots/email-login-form-baseline.png' })
  })

  test('should switch between login and signup tabs', async ({ page }) => {
    await page.goto('/email-login')
    
    const loginTab = page.locator('.email-login__tab').first()
    const signupTab = page.locator('.email-login__tab').last()
    
    await expect(loginTab).toHaveClass(/email-login__tab--active/)
    
    await signupTab.click()
    await expect(signupTab).toHaveClass(/email-login__tab--active/)
    
    await loginTab.click()
    await expect(loginTab).toHaveClass(/email-login__tab--active/)
  })

  test('should display app branding', async ({ page }) => {
    await page.goto('/email-login')
    
    const appName = page.locator('.email-login__app-name')
    await expect(appName).toBeVisible()
    await expect(appName).toContainText('PT 매니저')
  })
})
