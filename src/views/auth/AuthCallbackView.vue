<template>
  <div class="auth-callback">
    <p class="auth-callback__text">로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      router.replace('/login')
      return
    }

    auth.user = session.user

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (error || !profile) {
      router.replace('/onboarding/role')
      return
    }

    auth.setRole(profile.role)

    if (profile.role === 'trainer') {
      router.replace('/trainer/home')
    } else {
      router.replace('/home')
    }
  } catch (e) {
    console.error('Auth callback error:', e)
    router.replace('/login')
  }
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-white);
}

.auth-callback__text {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-reg);
  color: var(--color-gray-600);
}
</style>
