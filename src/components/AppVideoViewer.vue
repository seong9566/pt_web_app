<template>
  <!-- 전체화면 영상 뷰어 -->
  <Teleport to="body">
    <Transition name="video-viewer">
      <div
        v-if="modelValue"
        class="app-video-viewer__overlay"
        :style="overlayStyle"
        @click.self="close"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
      >
        <button class="app-video-viewer__close" @click="close" aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <video
          ref="videoRef"
          :src="src"
          controls
          autoplay
          playsinline
          class="app-video-viewer__video"
          :style="contentStyle"
          @click.stop
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  src: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])
const videoRef = ref(null)

// ── 스와이프 다운 닫기 ──
const touchStartY = ref(0)
const dragOffsetY = ref(0)
const isDragging = ref(false)
const CLOSE_THRESHOLD = 120

function onTouchStart(e) {
  touchStartY.value = e.touches[0].clientY
  dragOffsetY.value = 0
  isDragging.value = true
}

function onTouchMove(e) {
  if (!isDragging.value) return
  const deltaY = e.touches[0].clientY - touchStartY.value
  dragOffsetY.value = Math.max(0, deltaY)
}

function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  if (dragOffsetY.value >= CLOSE_THRESHOLD) {
    close()
  }
  dragOffsetY.value = 0
}

const overlayStyle = computed(() => {
  if (dragOffsetY.value <= 0) return {}
  const opacity = Math.max(0.2, 1 - dragOffsetY.value / 400)
  return { background: `rgba(0, 0, 0, ${opacity * 0.95})` }
})

const contentStyle = computed(() => {
  if (dragOffsetY.value <= 0) return {}
  const scale = Math.max(0.8, 1 - dragOffsetY.value / 1000)
  return {
    transform: `translateY(${dragOffsetY.value}px) scale(${scale})`,
    transition: 'none',
  }
})

function close() {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
  emit('update:modelValue', false)
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
    dragOffsetY.value = 0
    isDragging.value = false
    if (videoRef.value) {
      videoRef.value.pause()
      videoRef.value.currentTime = 0
    }
  }
})

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-video-viewer__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.app-video-viewer__close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--color-white);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.app-video-viewer__video {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  transition: transform 0.25s ease;
  will-change: transform;
}

/* ── Transition ── */
.video-viewer-enter-active,
.video-viewer-leave-active {
  transition: opacity 0.25s ease;
}

.video-viewer-enter-from,
.video-viewer-leave-to {
  opacity: 0;
}
</style>
