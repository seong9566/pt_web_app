<!-- 공통 Toast 컴포넌트. 화면 하단에 메시지를 잠시 표시 후 자동 사라짐 -->
<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div v-if="visible" class="app-toast" :class="typeClass">
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: String, default: '' },
  duration: { type: Number, default: 2000 },
  type: { type: String, default: 'default' }, // 'default' | 'success' | 'error'
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
let timer = null

const typeClass = computed(() => {
  if (props.type === 'success') return 'app-toast--success'
  if (props.type === 'error') return 'app-toast--error'
  return ''
})

watch(() => props.modelValue, (val) => {
  if (val) {
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
      emit('update:modelValue', false)
    }, props.duration)
  } else {
    visible.value = false
  }
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
  white-space: nowrap;
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
