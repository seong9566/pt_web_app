<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div v-if="toastStore.visible" class="app-toast" :class="typeClass">
        {{ toastStore.message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const typeClass = computed(() => {
  if (toastStore.type === 'success') return 'app-toast--success'
  if (toastStore.type === 'error') return 'app-toast--error'
  return ''
})
</script>

<style>
.app-toast {
  position: fixed;
  bottom: calc(var(--nav-height, 68px) + 24px);
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-gray-900);
  color: var(--color-white);
  padding: 12px 24px;
  border-radius: var(--radius-medium);
  font-size: var(--fs-body2);
  font-weight: var(--fw-body1-bold);
  z-index: 9999;
  pointer-events: none;
  white-space: normal;
  max-width: calc(var(--app-max-width, 480px) - 40px);
  text-align: center;
}

.app-toast--success {
  background-color: var(--color-green);
}

.app-toast--error {
  background-color: var(--color-red);
}

/* ── Transition ── */
.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
