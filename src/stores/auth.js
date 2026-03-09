/**
 * 인증 스토어 (Pinia)
 *
 * 앱 전체의 인증 상태를 관리하는 중앙 스토어.
 * Supabase Auth와 연동하여 세션 복원, 프로필 조회, 로그아웃을 처리.
 *
 * 상태: user(유저), profile(프로필), role(역할), session(세션), loading, error
 * 방어: 이중 초기화 방지 (_initialized, _initializePromise)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)      // Supabase auth.users 객체
  const profile = ref(null)   // profiles 테이블 데이터 (name, role, photo_url 등)
  const role = ref(null)      // 'trainer' | 'member' | null — profile.role에서 동기화
  const session = ref(null)   // Supabase 세션 객체 (access_token 포함)
  const loading = ref(true)   // 초기화/인증 진행 중 여부
  const error = ref(null)     // 마지막 에러 메시지

  let _initialized = false        // 초기화 완료 여부
  let _initializePromise = null   // 중복 초기화 방지용 Promise
  let _authSubscription = null    // onAuthStateChange 구독 해제용

  /** profile.role 값을 role ref에 동기화 */
  function syncRoleFromProfile() {
    role.value = profile.value?.role ?? null
  }

  /** 모든 인증 상태를 초기값으로 리셋 (로그아웃 시 사용) */
  function resetAuthState() {
    session.value = null
    user.value = null
    profile.value = null
    role.value = null
  }

  /** 프로필 데이터 설정 + role 동기화 */
  function setProfile(nextProfile) {
    profile.value = nextProfile
    syncRoleFromProfile()
  }

  /** 역할 설정 — 온보딩에서 역할 선택 시 호출 */
  function setRole(newRole) {
    if (!newRole) {
      clearRole()
      return
    }

    if (profile.value) {
      profile.value = { ...profile.value, role: newRole }
    } else {
      profile.value = {
        id: user.value?.id ?? null,
        role: newRole,
      }
    }

    syncRoleFromProfile()
  }

  /** 역할 초기화 — 역할 변경 시 프로필의 role도 null로 반영 */
  function clearRole() {
    if (profile.value) {
      profile.value = { ...profile.value, role: null }
    } else {
      profile.value = null
    }

    syncRoleFromProfile()
  }

  /**
   * profiles 테이블에서 사용자 프로필 조회
   * PGRST116(레코드 없음) 에러는 신규 사용자로 간주하고 무시
   */
  async function fetchProfile(userId = user.value?.id) {
    if (!userId) {
      console.warn('[AuthStore] userId가 없어서 프로필 조회를 건너뜁니다.')
      setProfile(null)
      return null
    }

    error.value = null
    const existingProfile = profile.value

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*, member_profiles(*), trainer_profiles(*)')
        .eq('id', userId)
        .maybeSingle()

      if (fetchError || !data) {
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[AuthStore] 프로필 조회 에러:', fetchError.message, fetchError)
          error.value = fetchError.message
        }

        if (!existingProfile) setProfile(null)
        return existingProfile || null
      }

      setProfile(data)
      return data
    } catch (e) {
      console.error('[AuthStore] fetchProfile 과정 중 예외 발생:', e)
      error.value = e.message

      if (!existingProfile) setProfile(null)
      return existingProfile || null
    }
  }

  /**
   * 세션에서 사용자 정보 복원 + 프로필 조회
   * onAuthStateChange 이벤트와 initialize()에서 호출
   */
  async function hydrateFromSession(nextSession) {
    session.value = nextSession ?? null
    user.value = nextSession?.user ?? null

    if (user.value) {
      // 이미 같은 유저의 프로필 데이터가 있다면, 불필요한 네트워크 통신(중복 조회) 방지
      if (profile.value?.id === user.value.id) {
        return
      }
      
      await fetchProfile(user.value.id)
      return
    }

    console.warn('[AuthStore] 세션 데이터에 user 정보가 없습니다. 프로필 초기화됨.')
    setProfile(null)
  }

  /**
   * Supabase onAuthStateChange 리스너 등록
   * SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT 등 이벤트 처리
   */
  function registerAuthListener() {
    if (_authSubscription) return

    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!_initialized) return

      if (event === 'PASSWORD_RECOVERY') {
        const { default: router } = await import('@/router')
        router.push('/password-update')
        return
      }

      loading.value = true
      error.value = null

      try {
        if (event === 'SIGNED_OUT') {
          resetAuthState()
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          session.value = nextSession ?? null
          user.value = nextSession?.user ?? null
          return
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await hydrateFromSession(nextSession)
        }
      } catch (e) {
        console.error('[AuthStore] Auth state change listener 에러:', e)
        error.value = e?.message ?? 'Auth state change failed'
      } finally {
        loading.value = false
      }
    })

    _authSubscription = data.subscription
  }

  /**
   * 인증 초기화 — 앱 시작 시 1회 호출
   * getSession()으로 기존 세션 확인 + 리스너 등록
   * 이중 호출 방지: _initialized + _initializePromise
   */
  async function initialize() {
    if (_initialized && !_initializePromise) return
    if (_initializePromise) return _initializePromise

    registerAuthListener()
    loading.value = true
    error.value = null

    _initializePromise = (async () => {
      try {
        const {
          data: { session: activeSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        await hydrateFromSession(activeSession)
        _initialized = true
      } catch (e) {
        error.value = e?.message ?? 'Auth initialization failed'
        resetAuthState()
      } finally {
        loading.value = false
        _initializePromise = null
      }
    })()

    return _initializePromise
  }

  /**
   * 로그아웃 — Supabase 세션 종료 + 상태 리셋
   */
  async function signOut() {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }
    } catch (e) {
      error.value = e?.message ?? 'Sign out failed'
    } finally {
      resetAuthState()
      loading.value = false
    }
  }

  return {
    user,
    profile,
    role,
    session,
    loading,
    error,
    setRole,
    clearRole,
    fetchProfile,
    hydrateFromSession,
    initialize,
    signOut,
  }
})
