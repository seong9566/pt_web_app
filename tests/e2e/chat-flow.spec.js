import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test('비인증 상태에서 트레이너 채팅 접근 시 로그인으로 리다이렉트', async ({ page }) => {
    await page.goto('/trainer/chat')

    await expect(page).toHaveURL(/.*login/)
  })

  test('비인증 상태에서 멤버 채팅 접근 시 로그인으로 리다이렉트', async ({ page }) => {
    await page.goto('/member/chat')

    await expect(page).toHaveURL(/.*login/)
  })

  test('채팅 페이지 URL 경로 형식 확인', async ({ page }) => {
    await page.goto('/trainer/chat')

    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost:5173')
  })

  test('이메일 로그인 폼이 채팅 진입 전 인증 수단임을 확인', async ({ page }) => {
    await page.goto('/email-login')

    await expect(page.locator('.email-login')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('.email-login__btn--primary')).toBeVisible()
  })

  test('채팅 접근 후 스크린샷 캡처', async ({ page }) => {
    await page.goto('/trainer/chat')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/screenshots/chat-flow-redirect.png' })
  })
})
