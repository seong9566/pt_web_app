<template>
  <div class="invite-manage">
    <div class="invite-manage__header">
      <button class="invite-manage__back" @click="router.back()">
        <img src="@/assets/icons/search.svg" alt="back" width="24" height="24" style="transform: rotate(180deg);" />
      </button>
      <h2 class="invite-manage__title">초대 코드 관리</h2>
      <div style="width: 40px;" />
    </div>
    <div class="invite-manage__content">
      <div class="invite-manage__qr-area">
        <div class="invite-manage__qr-box">
          <img src="@/assets/icons/qr.svg" alt="qr" width="56" height="56" />
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
            <img src="@/assets/icons/code_copy.svg" alt="copy" width="16" height="16" />
            코드 복사
          </button>
          <button class="invite-manage__btn invite-manage__btn--primary">
            <img src="@/assets/icons/link_invite.svg" alt="share" width="16" height="16" />
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
              <img src="@/assets/icons/person.svg" alt="member" width="24" height="24" />
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
<style src="./InviteManageView.css" scoped></style>
