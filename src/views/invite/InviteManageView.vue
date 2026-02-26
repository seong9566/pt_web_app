<template>
  <div class="invite-manage">
    <div class="invite-manage__header">
      <button class="invite-manage__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="invite-manage__title">초대 코드 관리</h2>
      <div style="width: 40px;" />
    </div>
    <div class="invite-manage__content">
      <div class="invite-manage__qr-area">
        <div class="invite-manage__qr-box">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><rect x="4" y="4" width="20" height="20" rx="2" stroke="#007AFF" stroke-width="2.5"/><rect x="9" y="9" width="10" height="10" fill="#007AFF"/><rect x="32" y="4" width="20" height="20" rx="2" stroke="#007AFF" stroke-width="2.5"/><rect x="37" y="9" width="10" height="10" fill="#007AFF"/><rect x="4" y="32" width="20" height="20" rx="2" stroke="#007AFF" stroke-width="2.5"/><rect x="9" y="37" width="10" height="10" fill="#007AFF"/><rect x="32" y="32" width="6" height="6" fill="#007AFF"/><rect x="42" y="32" width="6" height="6" fill="#007AFF"/><rect x="32" y="42" width="6" height="6" fill="#007AFF"/><rect x="42" y="42" width="6" height="6" fill="#007AFF"/></svg>
        </div>
        <p class="invite-manage__qr-text">회원을 초대하고 관리를 시작해보세요</p>
        <p class="invite-manage__qr-sub">코드를 공유하면 회원이 가입 시 자동으로 연결됩니다.</p>
      </div>
      <div class="invite-manage__code-card">
        <p class="invite-manage__code-label">나의 초대 코드</p>
        <p class="invite-manage__code">PT24K9</p>
        <div class="invite-manage__code-underline" />
        <div class="invite-manage__code-btns">
          <button class="invite-manage__btn invite-manage__btn--outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M15 9V6C15 4.89543 14.1046 4 13 4H6C4.89543 4 4 4.89543 4 6V13C4 14.1046 4.89543 15 6 15H9" stroke="currentColor" stroke-width="1.8"/></svg>
            코드 복사
          </button>
          <button class="invite-manage__btn invite-manage__btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="1.8"/></svg>
            링크 공유
          </button>
        </div>
      </div>
      <button class="invite-manage__kakao-banner">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 4C8.477 4 4 7.806 4 12.5c0 3.03 1.85 5.69 4.65 7.24L7.6 23.5a.286.286 0 0 0 .424.31L13.2 21.1c.264.022.53.04.8.04 5.523 0 10-3.806 10-8.5S19.523 4 14 4z" fill="#3C1E1E"/></svg>
        <div class="invite-manage__kakao-text">
          <span class="invite-manage__kakao-main">카카오톡으로 초대장 보내기</span>
          <span class="invite-manage__kakao-sub">간편하게 회원님을 초대해보세요</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="#3C1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="invite-manage__members">
        <div class="invite-manage__members-header">
          <h3 class="invite-manage__members-title">최근 연결된 회원</h3>
          <button class="invite-manage__view-all">전체보기</button>
        </div>
        <div class="invite-manage__member-list">
          <div v-for="member in recentMembers" :key="member.id" class="member-item">
            <div class="member-item__avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#CCCCCC"/><path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="#CCCCCC" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
            <div class="member-item__info">
              <p class="member-item__name">{{ member.name }}</p>
              <p class="member-item__date">{{ member.joinDate }} 가입</p>
            </div>
            <button class="member-item__more">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="#666666"/><circle cx="12" cy="12" r="1.5" fill="#666666"/><circle cx="12" cy="19" r="1.5" fill="#666666"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const recentMembers = [
  { id: 1, name: '김민지 회원님', joinDate: '2023.10.24' },
  { id: 2, name: '이준호 회원님', joinDate: '2023.10.18' },
  { id: 3, name: '박서연 회원님', joinDate: '2023.10.05' },
]
</script>
<style scoped>
.invite-manage { min-height: 100vh; background-color: var(--color-gray-100); display: flex; flex-direction: column; }
.invite-manage__header { display: flex; align-items: center; justify-content: space-between; padding: 16px var(--side-margin); background-color: var(--color-white); border-bottom: 1px solid var(--color-gray-200); }
.invite-manage__back { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; border-radius: 50%; }
.invite-manage__back:active { background-color: var(--color-gray-100); }
.invite-manage__title { font-size: var(--fs-title); font-weight: var(--fw-title); color: var(--color-gray-900); margin: 0; }
.invite-manage__content { flex: 1; padding: 20px var(--side-margin); display: flex; flex-direction: column; gap: 16px; }
.invite-manage__qr-area { background-color: var(--color-white); border-radius: var(--radius-large); padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; box-shadow: var(--shadow-card); }
.invite-manage__qr-box { width: 88px; height: 88px; background-color: var(--color-blue-light); border-radius: var(--radius-medium); display: flex; align-items: center; justify-content: center; }
.invite-manage__qr-text { font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); text-align: center; margin: 0; }
.invite-manage__qr-sub { font-size: var(--fs-body2); color: var(--color-gray-600); text-align: center; margin: 0; line-height: 1.5; }
.invite-manage__code-card { background-color: var(--color-white); border-radius: var(--radius-large); padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: var(--shadow-card); }
.invite-manage__code-label { font-size: var(--fs-caption); color: var(--color-gray-600); margin: 0; }
.invite-manage__code { font-size: 36px; font-weight: 700; color: var(--color-gray-900); letter-spacing: 4px; margin: 0; }
.invite-manage__code-underline { width: 60px; height: 3px; background-color: var(--color-blue-primary); border-radius: 2px; margin-bottom: 8px; }
.invite-manage__code-btns { display: flex; gap: 10px; width: 100%; }
.invite-manage__btn { flex: 1; height: 44px; border-radius: var(--radius-medium); font-size: var(--fs-body2); font-weight: var(--fw-body1-bold); display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; font-family: inherit; }
.invite-manage__btn--outline { background-color: var(--color-white); color: var(--color-gray-900); border: 1.5px solid var(--color-gray-200); }
.invite-manage__btn--primary { background-color: var(--color-blue-primary); color: var(--color-white); border: none; }
.invite-manage__kakao-banner { background-color: #FEE500; border-radius: var(--radius-medium); padding: 16px; display: flex; align-items: center; gap: 12px; width: 100%; border: none; cursor: pointer; font-family: inherit; }
.invite-manage__kakao-text { flex: 1; display: flex; flex-direction: column; gap: 2px; text-align: left; }
.invite-manage__kakao-main { font-size: var(--fs-body2); font-weight: var(--fw-body1-bold); color: #3C1E1E; }
.invite-manage__kakao-sub { font-size: var(--fs-caption); color: #3C1E1E; }
.invite-manage__members { background-color: var(--color-white); border-radius: var(--radius-large); padding: 20px; box-shadow: var(--shadow-card); }
.invite-manage__members-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.invite-manage__members-title { font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); margin: 0; }
.invite-manage__view-all { font-size: var(--fs-body2); color: var(--color-blue-primary); background: none; border: none; cursor: pointer; font-family: inherit; }
.invite-manage__member-list { display: flex; flex-direction: column; }
.member-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-gray-200); }
.member-item:last-child { border-bottom: none; }
.member-item__avatar { width: 44px; height: 44px; border-radius: 50%; background-color: var(--color-gray-100); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.member-item__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.member-item__name { font-size: var(--fs-body2); font-weight: var(--fw-body1-bold); color: var(--color-gray-900); margin: 0; }
.member-item__date { font-size: var(--fs-caption); color: var(--color-gray-600); margin: 0; }
.member-item__more { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; }
</style>
