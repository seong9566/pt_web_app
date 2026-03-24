<template>
  <Teleport to="body">
    <Transition name="realtime-banner">
      <div v-if="bannerStore.visible" class="realtime-banner">
        <span class="realtime-banner__message">{{ bannerStore.message }}</span>
        <button class="realtime-banner__btn" type="button" @click="handleConfirm">확인</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useRealtimeBannerStore } from '@/stores/realtimeBanner'

const router = useRouter()
const bannerStore = useRealtimeBannerStore()

function handleConfirm() {
  const route = bannerStore.targetRoute
  bannerStore.hideBanner()
  if (route) {
    router.push(route)
  }
}
</script>

<style>
.realtime-banner {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width, 480px);
  background-color: var(--color-blue-primary);
  color: var(--color-white);
  padding: calc(12px + env(safe-area-inset-top, 0px)) var(--side-margin, 20px) 12px; /* 노치/다이나믹 아일랜드 대응 */
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.realtime-banner__message {
  flex: 1;
  font-size: var(--fs-body2);
  font-weight: var(--fw-body1-bold);
}

.realtime-banner__btn {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  color: var(--color-white);
  padding: 6px 16px;
  border-radius: var(--radius-small);
  font-size: var(--fs-body2);
  font-weight: var(--fw-body1-bold);
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s;
}

.realtime-banner__btn:active {
  background: rgba(255, 255, 255, 0.35);
}

/* ── Transition ── */
.realtime-banner-enter-active,
.realtime-banner-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.realtime-banner-enter-from,
.realtime-banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-100%);
}
</style>
