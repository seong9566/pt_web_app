<template>
  <Teleport to="body">
    <Transition name="app-bottom-sheet">
      <div v-if="modelValue" class="app-bottom-sheet__overlay" @click.self="close">
        <div class="app-bottom-sheet__panel">
          <div class="app-bottom-sheet__handle" />
          <div v-if="title" class="app-bottom-sheet__header">
            <h3 class="app-bottom-sheet__title">{{ title }}</h3>
          </div>
          <div class="app-bottom-sheet__content" @touchmove.stop>
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

// 다중 바텀시트 중첩 시 스크롤 잠금을 안전하게 관리하는 reference counting
// 모듈 스코프 — 모든 AppBottomSheet 인스턴스가 공유
if (!window.__bottomSheetLockCount) window.__bottomSheetLockCount = 0

function lockBodyScroll() {
  window.__bottomSheetLockCount++
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  window.__bottomSheetLockCount = Math.max(0, window.__bottomSheetLockCount - 1)
  if (window.__bottomSheetLockCount === 0) {
    document.body.style.overflow = ''
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
})

onUnmounted(() => {
  // 열린 상태에서 unmount되면 카운트 감소
  if (props.modelValue) {
    unlockBodyScroll()
  }
})
</script>

<style scoped>
.app-bottom-sheet__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overscroll-behavior: contain;
}

.app-bottom-sheet__panel {
  width: 100%;
  max-width: var(--app-max-width);
  background: var(--color-white);
  border-radius: var(--radius-large) var(--radius-large) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  max-height: calc(100vh - 12px);
  max-height: calc(100dvh - 12px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-bottom-sheet__handle {
  width: 36px;
  height: 4px;
  background: var(--color-gray-200);
  border-radius: 2px;
  margin: 12px auto 0;
}

.app-bottom-sheet__header {
  padding: 16px var(--side-margin) 0;
}

.app-bottom-sheet__title {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
  margin: 0;
}

.app-bottom-sheet__content {
  padding: 16px var(--side-margin) 32px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* ── Transition ── */
.app-bottom-sheet-enter-active,
.app-bottom-sheet-leave-active {
  transition: opacity 0.28s ease-out;
}

.app-bottom-sheet-enter-active .app-bottom-sheet__panel,
.app-bottom-sheet-leave-active .app-bottom-sheet__panel {
  transition: transform 0.34s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}

.app-bottom-sheet-enter-from,
.app-bottom-sheet-leave-to {
  opacity: 0;
}

.app-bottom-sheet-enter-from .app-bottom-sheet__panel,
.app-bottom-sheet-leave-to .app-bottom-sheet__panel {
  transform: translateY(100%);
}
</style>
