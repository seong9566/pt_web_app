<!-- 단순 홈 페이지 (단순 레이아웃) -->
<template>
  <div class="home">
    <div class="home__content">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="color: var(--color-blue-primary)">
        <path
          d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M9 22V12H15V22"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <h1 class="home__title">홈 화면</h1>
      <p class="home__desc">개발 중인 화면입니다.</p>
    </div>
    <div class="home__footer">
      <AppButton @click="router.push('/login')" variant="outline"
        >로그아웃</AppButton
      >
    </div>
  </div>
</template>

<script setup>
/** 라우터 가져오기 */
import { useRouter } from "vue-router";
import AppButton from "@/components/AppButton.vue";
const router = useRouter();
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
}

.home__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
}

.home__title {
  font-size: var(--fs-title);
  font-weight: var(--fw-title);
  color: var(--color-gray-900);
  margin: 0;
}

.home__desc {
  font-size: var(--fs-body1);
  color: var(--color-gray-600);
  margin: 0;
}

.home__footer {
  padding: 16px var(--side-margin);
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
</style>
