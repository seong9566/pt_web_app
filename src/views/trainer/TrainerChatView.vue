<template>
  <div class="chat-view">
    <div class="chat-view__header">
      <h1 class="chat-view__title">채팅</h1>
    </div>
    <div class="chat-view__empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="chat-view__empty-text">채팅 기능이 곧 추가됩니다</p>
      <span class="chat-view__empty-hint">회원과의 소통을 더 편리하게 해드릴게요</span>
    </div>
    <div style="height: calc(var(--nav-height) + 16px);" />
  </div>
</template>

<script setup>
</script>

<style scoped>
.chat-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
}

.chat-view__header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px var(--side-margin);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
}

.chat-view__title {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
  margin: 0;
}

.chat-view__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-gray-600);
  padding: 0 var(--side-margin);
}

.chat-view__empty-text {
  font-size: var(--fs-body1);
  font-weight: var(--fw-body1-bold);
  color: var(--color-gray-900);
  margin: 8px 0 0;
}

.chat-view__empty-hint {
  font-size: var(--fs-body2);
  color: var(--color-gray-600);
}
</style>
