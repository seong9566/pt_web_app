<!-- [미구현] 회원 운동 매뉴얼 목록 페이지. 트레이너 제공 매뉴얼 열람 (목 데이터) -->
<template>
  <div class="member-stub">
    <div class="member-stub__content">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#007AFF" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="#007AFF" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      <p class="member-stub__title">매뉴얼</p>
      <p class="member-stub__desc">준비 중입니다</p>
    </div>
    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>

<script setup></script>

<style scoped>
.member-stub { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--color-white); }
.member-stub__content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; }
.member-stub__title { font-size: var(--fs-title); font-weight: var(--fw-title); color: var(--color-gray-900); margin: 0; }
.member-stub__desc { font-size: var(--fs-body2); color: var(--color-gray-600); margin: 0; }
</style>
