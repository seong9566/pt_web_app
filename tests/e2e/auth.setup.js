/**
 * E2E 인증 헬퍼
 * 
 * EmailLoginView (/email-login)를 사용한 테스트 인증 플로우
 * 실제 Supabase credentials 없이도 페이지 구조 검증 가능
 */

import { test as setup } from '@playwright/test'

/**
 * 이메일 로그인 페이지 로드 확인
 * 실제 로그인 없이 페이지 구조만 검증
 */
setup('verify email login page loads', async ({ page }) => {
  await page.goto('/email-login')
  
  // 페이지 기본 요소 확인
  await page.waitForSelector('.email-login')
  
  // 이메일/비밀번호 입력 필드 존재 확인
  const emailInput = page.locator('#email')
  const passwordInput = page.locator('#password')
  
  await emailInput.waitFor({ state: 'visible' })
  await passwordInput.waitFor({ state: 'visible' })
})

/**
 * 로그인 폼 요소 검증
 */
setup('verify login form elements', async ({ page }) => {
  await page.goto('/email-login')
  
  // 탭 버튼 확인
  const loginTab = page.locator('.email-login__tab').first()
  const signupTab = page.locator('.email-login__tab').last()
  
  await loginTab.waitFor({ state: 'visible' })
  await signupTab.waitFor({ state: 'visible' })
  
  // 제출 버튼 확인
  const submitBtn = page.locator('.email-login__btn--primary')
  await submitBtn.waitFor({ state: 'visible' })
})
