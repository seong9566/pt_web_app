import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 'trainer' | 'member' | null
  const role = ref(null)

  function setRole(newRole) {
    role.value = newRole
  }

  function clearRole() {
    role.value = null
  }

  return { role, setRole, clearRole }
})
