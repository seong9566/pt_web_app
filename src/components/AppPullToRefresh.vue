<template>
  <div class="app-pull-to-refresh">
    <Vue3PullToRefresh
      :distance="70"
      :duration="1500"
      :size="32"
      noreload
      :options="{ color: 'var(--color-blue-primary)', bgColor: 'var(--color-white)' }"
      @onrefresh="handleRefresh"
    />
    <slot />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// 동적 import로 라이브러리 로드 (번들 최적화)
const Vue3PullToRefresh = defineAsyncComponent(() =>
  import('@amirafa/vue3-pull-to-refresh').then(module => module.default)
)

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['refresh'])

function handleRefresh() {
  if (!props.disabled) {
    emit('refresh')
  }
}
</script>

<style scoped>
.app-pull-to-refresh {
  position: relative;
  width: 100%;
}

/* Chrome Mobile 네이티브 새로고침과 충돌 방지 */
:deep(html),
:deep(body) {
  overscroll-behavior-y: contain;
}
</style>
