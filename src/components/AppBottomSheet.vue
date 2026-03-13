<template>
  <Teleport to="body">
    <Transition name="app-bottom-sheet">
      <div v-if="modelValue" class="app-bottom-sheet__overlay" @click.self="close">
        <div class="app-bottom-sheet__panel">
          <div class="app-bottom-sheet__handle" />
          <div v-if="title" class="app-bottom-sheet__header">
            <h3 class="app-bottom-sheet__title">{{ title }}</h3>
          </div>
          <div class="app-bottom-sheet__content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
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
}

.app-bottom-sheet__panel {
  width: 100%;
  max-width: var(--app-max-width);
  background: var(--color-white);
  border-radius: var(--radius-large) var(--radius-large) 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
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
  padding: 24px var(--side-margin) 32px;
  overflow-y: auto;
}

/* ── Transition ── */
.app-bottom-sheet-enter-active,
.app-bottom-sheet-leave-active {
  transition: opacity 0.25s;
}

.app-bottom-sheet-enter-active .app-bottom-sheet__panel,
.app-bottom-sheet-leave-active .app-bottom-sheet__panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
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
