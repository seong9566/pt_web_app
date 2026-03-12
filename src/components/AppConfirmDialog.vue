<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="confirmStore.visible" class="app-confirm__overlay" @click.self="confirmStore.cancel">
        <div class="app-confirm__card">
          <p class="app-confirm__message">{{ confirmStore.message }}</p>
          <div class="app-confirm__actions">
            <button class="app-confirm__btn app-confirm__btn--cancel" @click="confirmStore.cancel">
              취소
            </button>
            <button class="app-confirm__btn app-confirm__btn--confirm" @click="confirmStore.confirm">
              확인
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useConfirmStore } from '@/stores/confirm'

const confirmStore = useConfirmStore()
</script>

<style scoped>
.app-confirm__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--side-margin);
}

.app-confirm__card {
  width: 100%;
  max-width: calc(var(--app-max-width) - 80px);
  background: var(--color-white);
  border-radius: var(--radius-large);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.app-confirm__message {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-reg);
  color: var(--color-gray-900);
  text-align: center;
  line-height: var(--lh-body);
  margin: 0;
  word-break: keep-all;
}

.app-confirm__actions {
  display: flex;
  gap: 8px;
}

.app-confirm__btn {
  flex: 1;
  height: var(--btn-height);
  border: none;
  border-radius: var(--radius-medium);
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.app-confirm__btn:active {
  opacity: 0.75;
}

.app-confirm__btn--cancel {
  background-color: var(--color-gray-100);
  color: var(--color-gray-900);
}

.app-confirm__btn--confirm {
  background-color: var(--color-blue-primary);
  color: var(--color-white);
}

/* ── Transition ── */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-active .app-confirm__card,
.confirm-fade-leave-active .app-confirm__card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .app-confirm__card,
.confirm-fade-leave-to .app-confirm__card {
  transform: scale(0.95);
  opacity: 0;
}
</style>
