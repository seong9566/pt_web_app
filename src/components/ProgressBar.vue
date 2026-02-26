<template>
  <div class="progress-bar">
    <div
      v-for="step in totalSteps"
      :key="step"
      class="progress-bar__step"
      :class="{ 'progress-bar__step--active': step <= currentStep }"
    />
  </div>
</template>

<script setup>
defineProps({
  currentStep: {
    type: Number,
    default: 1,
  },
  totalSteps: {
    type: Number,
    default: 2,
  },
})
</script>

<style scoped>
.progress-bar {
  display: flex;
  gap: 6px;
  width: 100%;
}
.progress-bar__step {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-gray-200);
  transition: background-color 0.2s;
}
.progress-bar__step--active {
  background-color: var(--color-blue-primary);
}
</style>
