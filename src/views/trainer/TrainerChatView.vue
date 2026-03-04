<!-- [미구현] 트레이너 채팅 페이지. 회원과의 메시지 기능 (준비 중) -->
<template>
  <div class="trainer-stub">
    <div class="trainer-stub__content">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="trainer-stub__title">채팅</p>
      <p class="trainer-stub__desc">채팅 기능을 준비 중입니다</p>
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
