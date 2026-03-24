<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div v-if="toastStore.visible" class="app-toast" :class="[typeClass, { 'app-toast--has-action': !!toastStore.action }]">
        <span class="app-toast__message">{{ toastStore.message }}</span>
        <button
          v-if="toastStore.action"
          class="app-toast__action"
          type="button"
          @click="handleAction"
        >{{ toastStore.action.label }}</button>
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

function handleAction() {
  const handler = toastStore.action?.handler
  toastStore.hideToast()
  handler?.()
}
</script>

<style>
.app-toast {
  position: fixed;
  bottom: calc(var(--nav-height, 68px) + 24px + env(safe-area-inset-bottom, 0px));
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

/* action 버튼이 있을 때 터치 가능 + 가로 배치 */
.app-toast--has-action {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.app-toast__message {
  flex: 1;
}

.app-toast__action {
  flex-shrink: 0;
  background: none;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  color: var(--color-white);
  padding: 6px 12px;
  border-radius: var(--radius-small);
  font-size: var(--fs-caption);
  font-weight: var(--fw-body1-bold);
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s;
}

.app-toast__action:active {
  background-color: rgba(255, 255, 255, 0.15);
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
