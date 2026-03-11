import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('루트 경로가 로그인 페이지로 리다이렉트됨', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/.*login/)
  })

  test('이메일 로그인 페이지 URL 직접 접근 가능', async ({ page }) => {
    await page.goto('/email-login')

    await expect(page).toHaveURL(/.*email-login/)
    await expect(page.locator('.email-login')).toBeVisible()
  })

  test('/dev-login 접근 시 /email-login으로 리다이렉트됨', async ({ page }) => {
    await page.goto('/dev-login')

    await expect(page).toHaveURL(/.*email-login/)
  })

  test('비인증 상태에서 보호된 경로들이 로그인으로 리다이렉트됨', async ({ page }) => {
    const protectedPaths = ['/trainer/home', '/member/home', '/trainer/schedule', '/member/schedule']

    for (const path of protectedPaths) {
      await page.goto(path)
      await expect(page).toHaveURL(/.*login/)
    }
  })

  test('이메일 로그인 페이지에서 뒤로가기 버튼 존재 확인', async ({ page }) => {
    await page.goto('/email-login')

    const backButton = page.locator('.email-login__back')
    await expect(backButton).toBeVisible()
  })

  test('이메일 로그인 페이지에서 비밀번호 찾기 링크 확인', async ({ page }) => {
    await page.goto('/email-login')

    const forgotBtn = page.locator('.email-login__forgot')
    await expect(forgotBtn).toBeVisible()
    await expect(forgotBtn).toContainText('비밀번호를 잊으셨나요')
  })

  test('네비게이션 상태 스크린샷 캡처', async ({ page }) => {
    await page.goto('/email-login')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/screenshots/navigation-baseline.png' })
  })
})
