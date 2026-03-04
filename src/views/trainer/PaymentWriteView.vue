<!-- [미구현] 수납 작성 페이지. 결제 금액/날짜/방법 입력 (준비 중) -->
<template>
  <div class="trainer-stub">
    <div class="trainer-stub__content">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
        <path d="M2 10H22" stroke="currentColor" stroke-width="1.8"/>
        <path d="M6 15H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <p class="trainer-stub__title">수납 기록</p>
      <p class="trainer-stub__desc">수납 기록 기능을 준비 중입니다</p>
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
