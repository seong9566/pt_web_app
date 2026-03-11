<template>
  <div class="app-skeleton" aria-hidden="true">
    <span
      v-for="index in normalizedCount"
      :key="`${normalizedType}-${index}`"
      class="app-skeleton__item"
      :class="`app-skeleton--${normalizedType}`"
      :style="itemStyle"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const typeHeightMap = {
  line: '16px',
  circle: '48px',
  rect: '120px',
}

const typeRadiusMap = {
  line: 'var(--radius-small)',
  circle: '50%',
  rect: 'var(--radius-medium)',
}

const props = defineProps({
  type: {
    type: String,
    default: 'line',
    validator: value => ['line', 'circle', 'rect'].includes(value),
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '16px',
  },
  borderRadius: {
    type: String,
    default: '',
  },
  count: {
    type: Number,
    default: 1,
  },
})

const normalizedType = computed(() => (typeHeightMap[props.type] ? props.type : 'line'))

const normalizedCount = computed(() => {
  if (props.count < 1) {
    return 1
  }

  return Math.floor(props.count)
})

const resolvedHeight = computed(() => {
  if (normalizedType.value === 'line') {
    return props.height
  }

  if (props.height === typeHeightMap.line) {
    return typeHeightMap[normalizedType.value]
  }

  return props.height
})

const resolvedBorderRadius = computed(() => {
  if (props.borderRadius) {
    return props.borderRadius
  }

  return typeRadiusMap[normalizedType.value]
})

const itemStyle = computed(() => ({
  width: props.width,
  height: resolvedHeight.value,
  borderRadius: resolvedBorderRadius.value,
}))
</script>

<style scoped>
.app-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-item);
  width: 100%;
}

.app-skeleton__item {
  display: block;
  background-color: var(--color-gray-100);
  animation: pulse 1.2s ease-in-out infinite;
}

.app-skeleton--line {
  border-radius: var(--radius-small);
}

.app-skeleton--circle {
  border-radius: 50%;
}

.app-skeleton--rect {
  border-radius: var(--radius-medium);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 0.7;
  }
}
</style>
