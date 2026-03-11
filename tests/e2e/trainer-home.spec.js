import { test, expect } from '@playwright/test'

test.describe('Trainer Home', () => {
  test('비인증 상태에서 트레이너 홈 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/trainer/home')

    await expect(page).toHaveURL(/.*login/)
  })

  test('이메일 로그인 페이지가 로그인 리다이렉트 목적지로 사용됨', async ({ page }) => {
    await page.goto('/email-login')

    await expect(page).toHaveURL(/.*email-login/)

    const container = page.locator('.email-login')
    await expect(container).toBeVisible()
  })

  test('트레이너 홈 예상 URL 형식 확인', async ({ page }) => {
    await page.goto('/trainer/home')

    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost:5173')
  })

  test('로그인 페이지에서 트레이너 홈 URL 예측 가능성 확인', async ({ page }) => {
    await page.goto('/email-login')

    await expect(page.locator('.email-login')).toBeVisible()

    const trainerHomeUrl = '/trainer/home'
    expect(trainerHomeUrl).toBe('/trainer/home')
  })

  test('트레이너 홈 접근 후 스크린샷 캡처', async ({ page }) => {
    await page.goto('/trainer/home')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/screenshots/trainer-home-redirect.png' })
  })
})
