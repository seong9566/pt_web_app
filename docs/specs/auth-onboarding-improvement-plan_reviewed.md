# 로그인/온보딩 플로우 개선 계획서 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec) + Claude Opus 4.6 코드 대조
> 원본 파일: docs/specs/auth-onboarding-improvement-plan.md
> 참조한 소스 파일: src/stores/auth.js, src/router/index.js, src/views/auth/AuthCallbackView.vue, src/views/onboarding/RoleSelectView.vue, src/views/onboarding/MemberProfileView.vue, src/views/login/EmailLoginView.vue, src/views/invite/InviteEnterView.vue, src/composables/useInvite.js, src/composables/useProfile.js, src/utils/validators.js, src/App.vue, src/main.js, supabase/schema.sql

---

## 리뷰 요약

### 강점
- Phase별 우선순위 분류가 명확하고, 심각도 기준이 합리적
- 작업 의존관계 다이어그램으로 병렬/순차 작업이 잘 구분됨
- 테스트 전략 섹션이 구체적이고 실행 가능
- `connect_via_invite` RPC가 `SECURITY DEFINER`인지 확인 필요하다는 리스크 인식이 정확

### 개선 필요 항목
1. **[Critical] 2.1 RLS 정책 수정이 `validateInviteCode()`를 깨뜨림** — 계획서에서 영향 분석이 불완전
2. **[High] 2.3 Auth 리스너 cleanup에서 `_initialized` 리셋 누락** — `signOut()` 후 재로그인 시 리스너 미등록
3. **[High] 3.1 딥링크가 AuthCallbackView/EmailLoginView의 자체 리다이렉트와 충돌**
4. **[Medium] 3.2 `safeBack()`의 `window.history.length > 1` 체크가 부정확** — SPA에서 항상 1 이상
5. **[Medium] 2.2 sessionStorage 변경 시 DevLoginView.vue 누락**
6. **[Low] 4.1 온보딩 완료 판단에서 `trainer_profiles`가 배열일 수 있음**

### 누락된 항목 / 코드와의 불일치
- DevLoginView.vue에서도 `pending_invite_code`를 처리하지만 계획서 대상 파일에 미포함
- `signOut()` 후 `_initialized = false` 리셋이 없어 `initialize()`가 다시 호출되지 않는 버그
- 딥링크 `redirectAfterLogin` 로직이 라우터 가드에만 있으면, AuthCallbackView/EmailLoginView의 직접 `router.replace()` 호출에 의해 무시됨
- `connect_via_invite` RPC가 `SECURITY DEFINER` (schema.sql:529 확인 완료) → RLS 변경해도 RPC는 안전하지만, `validateInviteCode()`는 직접 SELECT라 영향받음

---

## 개선된 계획 내용

## 1. 배경 및 목적

3개 관점(기능, 보안, UX 플로우) 리뷰 결과, 로그인/온보딩 플로우에서 **보안 취약점 11건, 기능 이슈 9건, 플로우 이슈 9건**이 발견됨. 본 계획서는 심각도 기준 우선순위별 개선 작업을 정의한다.

**범위**: 로그인 → OAuth 콜백 → 온보딩(역할 선택, 프로필 입력) → 홈 진입까지의 전체 인증 플로우
**대상 파일**: `src/stores/auth.js`, `src/router/index.js`, `src/views/auth/AuthCallbackView.vue`, `src/views/onboarding/*.vue`, `src/views/login/*.vue`, `src/views/invite/*.vue`, `src/composables/useInvite.js`, `supabase/schema.sql`

---

## 2. Phase 1: Critical/High 보안 수정 (즉시)

### 2.1 invite_codes RLS 정책 수정 + validateInviteCode RPC 전환
- **문제**: `using (true)` → 모든 인증 사용자가 전체 초대 코드 목록 조회 가능
- **파일**: `supabase/schema.sql:304-309`, `src/composables/useInvite.js:137-167`

> **[리뷰 수정] 원본 계획의 치명적 오류**: 단순히 RLS를 `auth.uid() = trainer_id`로 변경하면 **`useInvite.js:142-147`의 `validateInviteCode()`가 깨집니다.** 이 함수는 회원이 코드 입력 후 트레이너 정보를 확인하기 위해 `invite_codes` 테이블을 직접 SELECT하므로, 회원의 uid는 trainer_id와 일치하지 않아 항상 빈 결과를 반환합니다.
>
> `connect_via_invite` RPC는 `SECURITY DEFINER` (schema.sql:529)로 확인 → RPC 내부의 SELECT는 RLS를 우회하므로 안전합니다.

- **수정 내용 (2단계)**:

  **Step A: RLS 정책 변경**
  ```sql
  -- 기존
  create policy "Invite codes are readable by authenticated users"
  on public.invite_codes for select to authenticated
  using (true);

  -- 변경: 트레이너 본인의 코드만 직접 조회 가능
  create policy "Invite codes are readable by owner"
  on public.invite_codes for select to authenticated
  using (auth.uid() = trainer_id);
  ```

  **Step B: validateInviteCode를 RPC로 전환 (필수 — Step A와 동시 적용)**
  ```sql
  -- 새 RPC 함수 추가 (SECURITY DEFINER)
  create or replace function public.validate_invite_code(p_code text)
  returns json
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    v_result json;
  begin
    select json_build_object(
      'trainer_id', ic.trainer_id,
      'trainer_name', coalesce(p.name, '트레이너'),
      'trainer_photo', p.photo_url
    ) into v_result
    from public.invite_codes ic
    left join public.profiles p on p.id = ic.trainer_id
    where ic.code = p_code
      and ic.is_active = true;

    return v_result;  -- null이면 유효하지 않은 코드
  end;
  $$;

  grant execute on function public.validate_invite_code(text) to authenticated;
  ```

  ```javascript
  // src/composables/useInvite.js — validateInviteCode 수정
  async function validateInviteCode(code) {
    loading.value = true
    error.value = null

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invite_code', {
        p_code: code,
      })

      if (rpcError) throw rpcError

      if (!data) {
        error.value = '유효하지 않은 초대 코드입니다.'
        return null
      }

      return {
        trainerId: data.trainer_id,
        trainerName: data.trainer_name,
        trainerPhoto: data.trainer_photo,
      }
    } catch (e) {
      error.value = e?.message ?? '코드 확인에 실패했습니다'
      return null
    } finally {
      loading.value = false
    }
  }
  ```

- **영향 분석 (수정됨)**:
  - `redeemInviteCode()`: RPC(`connect_via_invite`) 사용 → `SECURITY DEFINER` → 영향 없음 (확인 완료)
  - `validateInviteCode()`: RPC로 전환 필수 → Step B에서 해결
  - `fetchInviteCode()`: 트레이너 본인 코드 조회 (`eq('trainer_id', auth.user.id)`) → RLS 변경 후에도 정상 동작
  - `InviteManageView.vue`: 트레이너 본인 코드만 표시 → 영향 없음

### 2.2 초대 코드 저장 방식 변경 (localStorage → sessionStorage)
- **문제**: localStorage의 `pending_invite_code`가 XSS 공격 시 탈취 가능, 또한 세션 종료 후에도 잔존
- **대상 파일** (6곳에서 일괄 수정):
  - `src/views/invite/InviteEnterView.vue:168` — `localStorage.setItem` → `sessionStorage.setItem`
  - `src/views/auth/AuthCallbackView.vue:75, 90` — `localStorage.getItem/removeItem` → `sessionStorage`
  - `src/views/onboarding/RoleSelectView.vue:81` — `localStorage.getItem` → `sessionStorage.getItem`
  - `src/views/login/EmailLoginView.vue:183, 190, 226` — `localStorage` → `sessionStorage`
  - `src/views/onboarding/MemberProfileView.vue:287, 291` — `localStorage.getItem/removeItem` → `sessionStorage`

> **[리뷰 추가]** `src/views/login/DevLoginView.vue`에도 `pending_invite_code` 사용 여부 확인이 필요합니다. 현재 DevLoginView에는 `pending_invite_code` 관련 코드가 없으나, `router.replace('/trainer/home')` (라인 103) 등 직접 리다이렉트가 있어 딥링크(3.1)와의 정합성 확인 필요.

- **수정 내용**: 전체 파일에서 `pending_invite_code` 키 관련 `localStorage` → `sessionStorage` 일괄 변경

> **[GPT 리뷰 보완]** `sessionStorage`로 변경해도 XSS가 있으면 둘 다 탈취됩니다. 목적은 "XSS 방어"가 아니라 **"임시 상태의 수명 단축"**입니다. 트레이너 로그인 시 pending code를 무시하고 홈으로 보내면서 코드가 남아있는 문제도 해결됩니다.

- **고려사항**:
  - sessionStorage는 탭 종료 시 삭제됨 → OAuth 리다이렉트 후 같은 탭에서 돌아오므로 유지됨
  - 새 탭에서 열면 코드가 사라지지만, 임시 상태의 수명 단축으로 더 안전한 동작
- **clear 정책**:
  - 성공 사용: `redeemInviteCode()` 성공 시 즉시 삭제
  - 역할 불일치: 트레이너로 로그인 시 `sessionStorage.removeItem('pending_invite_code')` (AuthCallbackView, EmailLoginView)
  - 세션 종료: sessionStorage이므로 탭 종료 시 자동 삭제

### 2.3 Auth 리스너 메모리 누수 해결 + _initialized 리셋
- **문제**: `_authSubscription`이 `signOut` 시에만 해제되고, 앱 언마운트 시 해제되지 않음
- **파일**: `src/stores/auth.js`, `src/App.vue`

> **[리뷰 추가 — codex 발견]** `signOut()` (auth.js:229-248)에서 `_authSubscription`을 해제하지만 **`_initialized = false`와 `_initializePromise = null`을 리셋하지 않습니다.** 같은 SPA 세션에서 로그아웃 후 다시 로그인하면 `initialize()`가 `_initialized` 플래그 때문에 조기 리턴하여, `registerAuthListener()`가 호출되지 않아 auth 이벤트를 더 이상 수신하지 못합니다.

- **수정 내용 (원본 + 추가)**:
  ```javascript
  // auth.js — cleanup 함수 추가 및 export
  function cleanup() {
    _authSubscription?.unsubscribe()
    _authSubscription = null
  }

  // signOut 함수 수정 — _initialized 리셋 추가
  async function signOut() {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
    } catch (e) {
      error.value = e?.message ?? 'Sign out failed'
    } finally {
      cleanup()                    // 기존: _authSubscription 해제
      _initialized = false         // [추가] 재로그인 시 initialize() 재실행 가능하게
      _initializePromise = null    // [추가] Promise도 리셋
      resetAuthState()
      loading.value = false
    }
  }

  return { ..., cleanup }
  ```
  ```javascript
  // App.vue — onBeforeUnmount에서 cleanup 호출
  import { onBeforeUnmount } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const auth = useAuthStore()
  onBeforeUnmount(() => { auth.cleanup() })
  ```
- **추가**: `registerAuthListener()` 호출 전 기존 구독이 있으면 먼저 해제하는 방어 로직 추가
  ```javascript
  function registerAuthListener() {
    if (_authSubscription) {
      _authSubscription.unsubscribe()  // 기존 구독 정리 후 재등록
    }
    // ... 기존 로직
  }
  ```

---

## 3. Phase 2: 플로우 안정성 개선

### 3.1 딥링크 지원 (로그인 후 원래 URL 복귀)
- **문제**: 비로그인 상태에서 보호된 경로 접근 → `/login` 리다이렉트 → 로그인 후 항상 홈으로만 이동
- **파일**: `src/router/index.js`, `src/views/auth/AuthCallbackView.vue`, `src/views/login/EmailLoginView.vue`

> **[리뷰 수정]** 원본 계획은 라우터 가드에서만 `redirectAfterLogin`을 처리하지만, **AuthCallbackView.vue (라인 81-92)와 EmailLoginView.vue (라인 185-194)에서 직접 `router.replace()`를 호출**하므로, 라우터 가드의 딥링크 로직이 무시됩니다. 이 두 파일도 수정해야 합니다.

- **수정 내용**:

  **라우터 가드 (router/index.js):**
  ```javascript
  // beforeEach 가드에서 미인증 리다이렉트 시 원래 경로 저장
  if (!isAuthenticated && !isPublic) {
    sessionStorage.setItem('redirectAfterLogin', to.fullPath)
    return '/login'
  }

  // 인증 완료 후 /login 접근 시 복귀
  if (isAuthenticated && to.path === '/login') {
    const redirect = sessionStorage.getItem('redirectAfterLogin')
    sessionStorage.removeItem('redirectAfterLogin')

    if (redirect && redirect !== '/login' && redirect !== '/auth/callback') {
      // 온보딩 미완료 사용자는 딥링크 무시 → 온보딩으로
      if (!auth.role || !auth.profile?.name) {
        return auth.role ? getProfileRoute(auth.role) : '/onboarding/role'
      }
      return redirect
    }

    if (auth.role === 'trainer') return '/trainer/home'
    if (auth.role === 'member') return '/member/home'
    return '/onboarding/role'
  }
  ```

  **공통 헬퍼 함수 추출 (router/index.js 또는 utils/navigation.js):**
  ```javascript
  function resolvePostAuthRedirect(auth) {
    const redirect = sessionStorage.getItem('redirectAfterLogin')
    sessionStorage.removeItem('redirectAfterLogin')

    // 온보딩 미완료 → 온보딩 우선
    if (!auth.role) return '/onboarding/role'
    if (!auth.profile?.name) {
      return auth.role === 'trainer' ? '/trainer/profile' : '/onboarding/member-profile'
    }

    // 유효한 딥링크가 있으면 복귀
    if (redirect && redirect !== '/login' && redirect !== '/auth/callback') {
      return redirect
    }

    // 기본 홈
    return auth.role === 'trainer' ? '/trainer/home' : '/member/home'
  }
  ```

  **AuthCallbackView.vue — handleRedirect 내 수정:**
  ```javascript
  // 기존 직접 router.replace() 대신 resolvePostAuthRedirect 사용
  import { resolvePostAuthRedirect } from '@/utils/navigation'

  // 역할별 분기 로직의 최종 리다이렉트 부분에서:
  if (!auth.role) {
    if (pendingCode) { /* 기존 로직 유지 */ }
    else { router.replace(resolvePostAuthRedirect(auth)) }
  } else {
    // ... 기존 초대 코드 처리 ...
    router.replace(resolvePostAuthRedirect(auth))
  }
  ```

  **EmailLoginView.vue — handleSubmit 내 수정:**
  ```javascript
  // 로그인 성공 후 마지막 리다이렉트에서 동일하게 적용
  import { resolvePostAuthRedirect } from '@/utils/navigation'

  // 기존: router.replace('/trainer/home') 등
  // 변경: router.replace(resolvePostAuthRedirect(auth))
  ```

### 3.2 뒤로가기(Back Navigation) 안정화
- **문제**: `router.back()` 사용 시 히스토리 없으면 빈 페이지로 이동
- **대상 파일**: `RoleSelectView.vue`, `MemberProfileView.vue`, `TrainerProfileView.vue`, `InviteEnterView.vue`, `EmailLoginView.vue` 등

> **[리뷰 수정]** `window.history.length > 1` 체크는 SPA에서 신뢰할 수 없습니다. 브라우저가 최초 로드 시 이미 `length = 1`이고, 어떤 브라우저는 외부 사이트에서 온 경우에도 이전 히스토리를 포함합니다. 대신 **내부 네비게이션 추적** 방식을 사용합니다.

- **수정 내용**: 라우터 레벨에서 내부 네비게이션 여부 추적
  ```javascript
  // src/utils/navigation.js (신규)
  import router from '@/router'

  const FALLBACK_ROUTES = {
    '/onboarding/role': '/login',
    '/onboarding/member-profile': '/onboarding/role',
    '/trainer/profile': '/onboarding/role',
    '/invite/enter': '/login',
    '/email-login': '/login',
  }

  let hasInternalNavigation = false

  // router/index.js의 afterEach에서 호출
  export function markInternalNavigation() {
    hasInternalNavigation = true
  }

  export function safeBack(currentPath) {
    if (hasInternalNavigation) {
      router.back()
    } else {
      router.replace(FALLBACK_ROUTES[currentPath] || '/login')
    }
  }
  ```

  ```javascript
  // router/index.js에 추가
  import { markInternalNavigation } from '@/utils/navigation'

  router.afterEach(() => {
    markInternalNavigation()
  })
  ```

- **각 뷰에서**: `@click="router.back()"` → `@click="safeBack(route.path)"`
- **적용 대상 (Grep 결과 기반)**: RoleSelectView, MemberProfileView, TrainerProfileView, InviteEnterView, EmailLoginView, InviteManageView 등 총 17곳

### 3.3 초대 코드 에러 피드백 + saveRole 실패 처리 전체 보강
- **문제**: 초대 코드 인증 실패 시 피드백 없이 홈으로 이동. `saveRole()` 실패 시 에러 없이 진행하는 곳이 3곳 존재.

> **[GPT 리뷰 보완]** 원본 계획은 `RoleSelectView`만 다루지만, **`AuthCallbackView.vue:78-81`과 `EmailLoginView.vue:226-230`에서도 `saveRole()` 반환값을 확인하지 않고 `auth.setRole('member')`와 라우팅을 진행합니다.** 또한 `saveRole()` 자체가 `name: '', phone: ''`을 함께 upsert하므로 기존 프로필이 있는 사용자의 데이터를 덮어쓸 위험이 있습니다.

- **파일 및 수정 내용**:

  **MemberProfileView.vue:286-301 — 초대 코드 실패 피드백:**
  ```javascript
  redeemInviteCode(pendingCode).then((result) => {
    if (result) {
      sessionStorage.removeItem('pending_invite_code')
      reservationsStore.invalidate()
      ptSessionsStore.invalidate()
      chatBadgeStore.loadUnreadCount(true)
      showToast('트레이너와 연결되었습니다!', 'success')
    } else {
      showToast('초대 코드 연결에 실패했습니다. 설정에서 다시 시도해주세요.', 'error')
    }
    router.replace('/member/home')
  })
  ```

  **RoleSelectView.vue:80-89 — saveRole 실패 처리:**
  ```javascript
  onMounted(async () => {
    const pendingCode = sessionStorage.getItem('pending_invite_code')
    if (pendingCode) {
      const success = await saveRole(auth.user.id, 'member')
      if (success) {
        auth.setRole('member')
        router.replace('/onboarding/member-profile')
      } else {
        errorMsg.value = roleError.value || '역할 저장에 실패했습니다. 다시 시도해주세요.'
      }
    }
  })
  ```

  **AuthCallbackView.vue:77-81 — saveRole 실패 처리 추가:**
  ```javascript
  if (!auth.role) {
    if (pendingCode) {
      const success = await saveRole(auth.user.id, 'member')
      if (!success) {
        failAuth('역할 저장에 실패했습니다. 다시 시도해주세요.')
        return
      }
      auth.setRole('member')
      router.replace('/onboarding/member-profile')
    } else {
      router.replace('/onboarding/role')
    }
  }
  ```

  **EmailLoginView.vue:226-230 — saveRole 실패 처리 추가:**
  ```javascript
  const pendingCode = sessionStorage.getItem('pending_invite_code')
  if (pendingCode) {
    const success = await saveRole(auth.user.id, 'member')
    if (!success) {
      errorMsg.value = '역할 저장에 실패했습니다. 다시 시도해주세요.'
      return
    }
    auth.setRole('member')
    router.replace('/onboarding/member-profile')
  } else {
    router.replace('/onboarding/role')
  }
  ```

  **pending_invite_code clear 정책 (GPT 보완):**
  - 성공 사용: `redeemInviteCode()` 성공 시 즉시 삭제
  - 역할 불일치: 트레이너로 로그인 시 `sessionStorage.removeItem('pending_invite_code')` 호출
  - 세션 종료: sessionStorage이므로 탭 종료 시 자동 삭제

### 3.4 토큰 갱신 실패 처리
- **문제**: `TOKEN_REFRESHED` 이벤트에서 세션이 null일 때 처리 없음
- **파일**: `src/stores/auth.js:167-171`
- **수정 내용**:
  ```javascript
  if (event === 'TOKEN_REFRESHED') {
    if (!nextSession) {
      // 토큰 갱신 실패 → 세션 만료로 처리
      console.warn('[AuthStore] 토큰 갱신 실패 — 세션 만료 처리')
      resetAuthState()
      const { default: router } = await import('@/router')
      router.push('/login')
      return
    }
    session.value = nextSession
    user.value = nextSession.user
    return
  }
  ```

---

## 4. Phase 3: UX 개선

### 4.1 온보딩 완료 판단 로직 강화 + 보호 라우트 접근 차단
- **문제**: `auth.profile?.name`만 확인 → 불완전 프로필로 통과 가능
- **파일**: `src/router/index.js:332-339`

> **[리뷰 주의]** `fetchProfile()` (auth.js:92-96)에서 `profiles` 테이블을 `.select('*, member_profiles(*), trainer_profiles(*)')` 으로 조회하므로, `member_profiles`와 `trainer_profiles`는 **1:1 관계라면 객체, 1:N이면 배열**로 반환됩니다. 배열/객체 모두 처리하는 방어적 코드 적용.

> **[GPT 리뷰 보완]** 원본 계획은 온보딩 페이지 재진입 차단만 다루지만, `role`만 저장되고 `trainer_profiles`/`member_profiles`가 없는 사용자가 `/trainer/home`, `/member/home` 등 보호 라우트에 직접 접근하는 문제는 그대로 남습니다. 온보딩 미완료 사용자의 보호 페이지 접근 차단도 포함해야 합니다.

- **수정 내용**:
  ```javascript
  // 온보딩 완료 판단 헬퍼 함수
  function isOnboardingComplete(auth) {
    if (!auth.role || !auth.profile?.name) return false

    if (auth.role === 'trainer') {
      const tp = auth.profile.trainer_profiles
      return Array.isArray(tp) ? tp.length > 0 : !!tp
    }
    if (auth.role === 'member') {
      const mp = auth.profile.member_profiles
      return Array.isArray(mp) ? mp.length > 0 : !!mp
    }
    return false
  }

  // 온보딩 미완료 시 해당 단계로 강제 이동
  function getRequiredOnboardingRoute(auth) {
    if (!auth.role) return '/onboarding/role'
    if (auth.role === 'trainer' && !auth.profile?.name) return '/trainer/profile'
    if (auth.role === 'member' && !auth.profile?.name) return '/onboarding/member-profile'

    const tp = auth.profile?.trainer_profiles
    const mp = auth.profile?.member_profiles
    if (auth.role === 'trainer' && !(Array.isArray(tp) ? tp.length > 0 : !!tp)) return '/trainer/profile'
    if (auth.role === 'member' && !(Array.isArray(mp) ? mp.length > 0 : !!mp)) return '/onboarding/member-profile'

    return null  // 온보딩 완료
  }

  // 라우터 가드에서 사용 — 온보딩 재진입 차단
  if (isOnboardingOrTrainerProfile) {
    if (isAuthenticated && isOnboardingComplete(auth)) {
      return auth.role === 'trainer' ? '/trainer/home' : '/member/home'
    }
    return
  }

  // [GPT 보완] 보호 라우트 접근 시 온보딩 미완료면 강제 이동
  if (isAuthenticated && auth.role && !isPublic && !isOnboarding) {
    const requiredRoute = getRequiredOnboardingRoute(auth)
    if (requiredRoute) return requiredRoute
  }
  ```

### 4.2 AuthCallbackView 타임아웃 개선
- **문제**: 15초 하드코딩 — 느린 네트워크에서 불필요한 실패
- **파일**: `src/views/auth/AuthCallbackView.vue:154-160`
- **수정 내용**: 타임아웃 25초로 증가 + 상수 추출
  ```javascript
  const AUTH_CALLBACK_TIMEOUT = 25000  // 25초

  timeoutId = window.setTimeout(() => {
    // ... 기존 로직
  }, AUTH_CALLBACK_TIMEOUT)
  ```

### 4.3 로딩 상태 세분화
- **문제**: OAuth 콜백 중 "로그인 처리 중..." 한 줄만 표시
- **파일**: `src/views/auth/AuthCallbackView.vue`
- **수정 내용**: 진행 단계별 메시지 표시
  ```javascript
  const loadingMessage = ref('로그인 처리 중...')

  // handleRedirect 내부에서 단계별 업데이트
  loadingMessage.value = '인증 확인 중...'
  // ... session 획득 후
  loadingMessage.value = '프로필 불러오는 중...'
  // ... 프로필 조회 후
  loadingMessage.value = '화면 준비 중...'
  ```
  ```html
  <!-- 템플릿 수정 -->
  <p v-else-if="loading" class="auth-callback__text">{{ loadingMessage }}</p>
  ```

---

## 5. Phase 4: 보안 강화 (장기)

### 5.1 CSP(Content-Security-Policy) 헤더 설정
- **목적**: XSS 공격 표면 축소
- **위치**: 배포 환경의 서버 설정 (Nginx/Vercel/Netlify)
- **내용**: `script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' *.supabase.co`

### 5.2 Supabase API Rate Limiting
- **목적**: anon key 남용 방지
- **위치**: Supabase 대시보드 → API Settings
- **내용**: 요청 제한 설정 (예: 1000 req/min)

### 5.3 이메일 검증 정규식 개선
- **파일**: `src/utils/validators.js:29-31`
- **수정**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` + 길이 제한 254자
  ```javascript
  export function isValidEmail(value) {
    if (!value || value.length > 254) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
  }
  ```

---

## 6. 작업 순서 및 의존관계 (수정됨)

```
Phase 1 (즉시 — 보안)
  ├─ 2.1 RLS 정책 수정 + validateInviteCode RPC 전환 ─── 동시 적용 필수! (DB + useInvite.js)
  ├─ 2.2 sessionStorage 변경 ──── 독립 (6개 파일 일괄 수정)
  └─ 2.3 Auth 리스너 cleanup + _initialized 리셋 ──── 독립 (auth.js + App.vue)

Phase 2 (플로우 안정성)
  ├─ 3.1 딥링크 지원 ────────────── 독립이지만 AuthCallbackView + EmailLoginView도 수정 필요
  ├─ 3.2 뒤로가기 안정화 ────────── 독립 (navigation.js + afterEach + 17개 뷰)
  ├─ 3.3 초대 코드 에러 피드백 ─── Phase 1의 2.2 이후 (sessionStorage 변경 반영)
  └─ 3.4 토큰 갱신 실패 처리 ──── Phase 1의 2.3 이후 (auth.js 수정 반영)

Phase 3 (UX 개선)
  ├─ 4.1 온보딩 완료 판단 강화 ─── 독립 (배열/객체 타입 확인 후 적용)
  ├─ 4.2 콜백 타임아웃 개선 ────── 독립 (AuthCallbackView)
  └─ 4.3 로딩 상태 세분화 ──────── 독립 (AuthCallbackView)

Phase 4 (장기 — 인프라)
  ├─ 5.1 CSP 헤더 ─────────────── 배포 환경 설정
  ├─ 5.2 Rate Limiting ──────────── Supabase 대시보드
  └─ 5.3 이메일 검증 개선 ──────── 독립 (validators.js)
```

---

## 7. 테스트 전략

### 수동 테스트 시나리오
1. **카카오 OAuth 전체 플로우**: 로그인 → 콜백 → 온보딩 → 홈 도달
2. **초대 코드 플로우**: 코드 입력 → 로그인 필요 → OAuth → 자동 member 설정 → 프로필 입력 → 홈
3. **세션 만료**: 토큰 만료 시뮬레이션 → 자동 갱신 → 실패 시 로그인 페이지 이동
4. **딥링크**: 비로그인 상태에서 `/member/schedule` 접근 → 로그인 → 원래 페이지 도달
5. **뒤로가기**: 온보딩 각 단계에서 뒤로가기 → 이전 단계 또는 로그인으로 안전하게 이동
6. **역할 불일치**: 트레이너가 `/member/home` 접근 → `/trainer/home` 리다이렉트 확인
7. **이메일 로그인**: 회원가입 → 자동 로그인 → 온보딩 진입
8. **[추가] 로그아웃 후 재로그인**: signOut → 로그인 → auth 리스너 정상 등록 확인
9. **[추가] 초대 코드 RPC 검증**: 회원으로 로그인 → InviteEnterView에서 코드 입력 → 트레이너 정보 정상 표시 확인

### RLS 정책 테스트
```sql
-- 회원으로 로그인 후 invite_codes 직접 조회 시도
-- 결과: 빈 배열 반환 확인 (기존: 전체 코드 노출)
select * from invite_codes;  -- 회원은 결과 없음

-- 트레이너로 로그인 후 본인 코드만 반환 확인
select * from invite_codes;  -- 본인 코드만 반환

-- validate_invite_code RPC 테스트 (회원으로)
select validate_invite_code('ABC123');  -- SECURITY DEFINER로 정상 동작
```

---

## 8. 리스크 및 주의사항 (수정됨)

| 항목 | 리스크 | 완화 방안 |
|------|--------|----------|
| RLS 정책 변경 | ~~`redeemInviteCode` RPC 실패 가능~~ RPC는 안전 (`SECURITY DEFINER` 확인), **`validateInviteCode` 직접 SELECT가 깨짐** | **반드시 RPC 전환과 동시 배포** |
| sessionStorage 변경 | OAuth 리다이렉트 시 새 탭이 열리면 코드 유실 | 카카오 OAuth는 같은 탭에서 리다이렉트하므로 안전 |
| Auth 리스너 변경 | ~~기존 이벤트 처리 로직에 영향~~ + **_initialized 리셋 누락 시 재로그인 버그** | signOut에서 `_initialized = false` 반드시 포함 |
| 딥링크 추가 | 온보딩 미완료 사용자가 보호 페이지로 직접 리다이렉트될 수 있음 | `resolvePostAuthRedirect()`에서 온보딩 상태 우선 확인 |
| [추가] 온보딩 완료 판단 | `member_profiles`가 배열/객체 중 어떤 형태인지 확인 필요 | 배열/객체 모두 처리하는 방어적 코드 적용 |
| [추가] 딥링크 + 직접 리다이렉트 충돌 | AuthCallbackView/EmailLoginView의 `router.replace()`가 라우터 가드의 딥링크 로직을 우회 | 공통 헬퍼 함수 `resolvePostAuthRedirect()` 통일 사용 |
