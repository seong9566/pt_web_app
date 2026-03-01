import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // 'trainer' | 'member' | null
  const role = ref(null)
  const user = ref(null)
  const loading = ref(true)

  let _initialized = false

  function setRole(newRole) {
    role.value = newRole
  }

  function clearRole() {
    role.value = null
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) {
      role.value = null
      return null
    }

    role.value = data.role
    return data
  }

  async function initialize() {
    if (_initialized) return

    _initialized = true
    loading.value = true

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        user.value = session.user
        await fetchProfile(session.user.id)
      }
    } catch (e) {
      console.error('Auth initialization error:', e)
    } finally {
      loading.value = false
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        user.value = session.user
        await fetchProfile(session.user.id)
      } else {
        user.value = null
        role.value = null
      }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    role.value = null
  }

  return { role, user, loading, setRole, clearRole, fetchProfile, initialize, signOut }
})
