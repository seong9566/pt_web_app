import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('이메일 로그인 페이지 접근 가능', async ({ page }) => {
    await page.goto('/email-login')

    await expect(page).toHaveURL(/.*email-login/)

    const container = page.locator('.email-login')
    await expect(container).toBeVisible()
  })

  test('이메일 입력 필드 존재 확인', async ({ page }) => {
    await page.goto('/email-login')

    const emailInput = page.locator('#email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('type', 'email')
    await expect(emailInput).toHaveAttribute('placeholder', 'example@email.com')
  })

  test('비밀번호 입력 필드 존재 확인', async ({ page }) => {
    await page.goto('/email-login')

    const passwordInput = page.locator('#password')
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('로그인 버튼 클릭 가능 확인', async ({ page }) => {
    await page.goto('/email-login')

    const submitBtn = page.locator('.email-login__btn--primary')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).not.toBeDisabled()
    await expect(submitBtn).toContainText('로그인')
  })

  test('탭 전환 기능 확인', async ({ page }) => {
    await page.goto('/email-login')

    const loginTab = page.locator('.email-login__tab').first()
    const signupTab = page.locator('.email-login__tab').last()

    await expect(loginTab).toHaveClass(/email-login__tab--active/)

    await signupTab.click()
    await expect(signupTab).toHaveClass(/email-login__tab--active/)
    await expect(loginTab).not.toHaveClass(/email-login__tab--active/)

    const submitBtn = page.locator('.email-login__btn--primary')
    await expect(submitBtn).toContainText('회원가입')
  })

  test('빈 폼 제출 시 유효성 검사 메시지 표시', async ({ page }) => {
    await page.goto('/email-login')

    const submitBtn = page.locator('.email-login__btn--primary')
    await submitBtn.click()

    const errorMsg = page.locator('.email-login__error')
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText('이메일과 비밀번호를 입력해주세요')
  })

  test('짧은 비밀번호 입력 시 유효성 검사 메시지 표시', async ({ page }) => {
    await page.goto('/email-login')

    await page.fill('#email', 'test@example.com')
    await page.fill('#password', '123')

    const submitBtn = page.locator('.email-login__btn--primary')
    await submitBtn.click()

    const errorMsg = page.locator('.email-login__error')
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText('6자 이상')
  })

  test('앱 브랜딩 확인', async ({ page }) => {
    await page.goto('/email-login')

    const appName = page.locator('.email-login__app-name')
    await expect(appName).toBeVisible()
    await expect(appName).toContainText('PT 매니저')
  })

  test('로그인 페이지 스크린샷 캡처', async ({ page }) => {
    await page.goto('/email-login')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/screenshots/login-flow-baseline.png' })
  })
})
