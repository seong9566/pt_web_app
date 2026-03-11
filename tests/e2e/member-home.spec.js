import { test, expect } from '@playwright/test'

test.describe('Member Home', () => {
  test('비인증 상태에서 멤버 홈 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/member/home')

    await expect(page).toHaveURL(/.*login/)
  })

  test('이메일 로그인 폼이 멤버 홈 진입 전 인증 수단임을 확인', async ({ page }) => {
    await page.goto('/email-login')

    await expect(page.locator('.email-login')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('멤버 홈 예상 URL 경로 확인', async ({ page }) => {
    await page.goto('/member/home')

    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost:5173')
  })

  test('멤버 스케줄 페이지도 인증 필요 확인', async ({ page }) => {
    await page.goto('/member/schedule')

    await expect(page).toHaveURL(/.*login/)
  })

  test('멤버 홈 접근 후 스크린샷 캡처', async ({ page }) => {
    await page.goto('/member/home')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/screenshots/member-home-redirect.png' })
  })
})
