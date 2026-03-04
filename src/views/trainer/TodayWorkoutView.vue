<!-- [미구현] 오늘의 운동 페이지. 운동 루틴 리스트 + 세트/랩 구성 (준비 중) -->
<template>
  <div class="trainer-stub">
    <div class="trainer-stub__content">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
          fill="currentColor"/>
      </svg>
      <p class="trainer-stub__title">오늘의 운동</p>
      <p class="trainer-stub__desc">오늘의 운동 기능을 준비 중입니다</p>
    </div>
    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>

<script setup></script>

<style scoped>
.trainer-stub { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--color-white); }
.trainer-stub__content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; color: var(--color-gray-600); }
.trainer-stub__title { font-size: var(--fs-title); font-weight: var(--fw-title); color: var(--color-gray-900); margin: 0; }
.trainer-stub__desc { font-size: var(--fs-body2); color: var(--color-gray-600); margin: 0; }
</style>
