import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const role = ref(null)
  const session = ref(null)
  const loading = ref(true)
  const error = ref(null)

  let _initialized = false
  let _initializePromise = null
  let _authSubscription = null

  function syncRoleFromProfile() {
    role.value = profile.value?.role ?? null
  }

  function resetAuthState() {
    session.value = null
    user.value = null
    profile.value = null
    role.value = null
  }

  function setProfile(nextProfile) {
    profile.value = nextProfile
    syncRoleFromProfile()
  }

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

  function clearRole() {
    if (profile.value) {
      profile.value = { ...profile.value, role: null }
    } else {
      profile.value = null
    }

    syncRoleFromProfile()
  }

  async function fetchProfile(userId = user.value?.id) {
    if (!userId) {
      setProfile(null)
      return null
    }

    error.value = null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        error.value = error.message
      }

      setProfile(null)
      return null
    }

    setProfile(data)
    return data
  }

  async function hydrateFromSession(nextSession) {
    session.value = nextSession ?? null
    user.value = nextSession?.user ?? null

    if (user.value) {
      await fetchProfile(user.value.id)
      return
    }

    setProfile(null)
  }

  function registerAuthListener() {
    if (_authSubscription) return

    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      loading.value = true
      error.value = null

      try {
        if (event === 'SIGNED_OUT') {
          resetAuthState()
          return
        }

        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION' ||
          event === 'USER_UPDATED'
        ) {
          await hydrateFromSession(nextSession)
        }
      } catch (e) {
        error.value = e?.message ?? 'Auth state change failed'
      } finally {
        loading.value = false
      }
    })

    _authSubscription = data.subscription
  }

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
    initialize,
    signOut,
  }
})
