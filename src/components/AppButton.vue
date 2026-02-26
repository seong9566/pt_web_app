<template>
  <button
    class="app-btn"
    :class="[`app-btn--${variant}`, { 'app-btn--full': fullWidth }]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary', // 'primary' | 'secondary' | 'outline'
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.app-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--btn-height);
  padding: 0 var(--btn-padding-h);
  border-radius: var(--radius-medium);
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  font-family: inherit;
}
.app-btn--full {
  width: 100%;
}
.app-btn--primary {
  background-color: var(--color-blue-primary);
  color: var(--color-white);
}
.app-btn--secondary {
  background-color: var(--color-gray-100);
  color: var(--color-gray-900);
}
.app-btn--outline {
  background-color: var(--color-white);
  color: var(--color-gray-900);
  border: 1.5px solid var(--color-gray-200);
}
.app-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.app-btn:active:not(:disabled) {
  opacity: 0.8;
}
</style>
