<!-- 트레이너용 초대 코드 관리 페이지. 코드 생성/공유/복사, 최근 연결 회원 목록 표시 -->
<template>
  <div class="invite-manage">
    <div class="invite-manage__header">
      <button class="invite-manage__back" @click="router.back()" style="color: var(--color-gray-900);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
        <template v-if="loading && !inviteCode">
          <AppSkeleton type="line" width="88px" />
          <AppSkeleton type="line" width="180px" height="36px" />
          <AppSkeleton type="line" width="64px" height="4px" borderRadius="2px" />
          <AppSkeleton type="rect" height="44px" borderRadius="var(--radius-medium)" :count="2" />
        </template>
        <template v-else>
          <p class="invite-manage__code-label">나의 초대 코드</p>
          <p class="invite-manage__code">{{ inviteCode?.code || '생성 중...' }}</p>
          <div class="invite-manage__code-underline" />
          <div class="invite-manage__code-btns">
            <button class="invite-manage__btn invite-manage__btn--outline" @click="handleCopyCode">
              <img src="@/assets/icons/code_copy.svg" alt="copy" width="16" height="16" />
              코드 복사
            </button>
            <button class="invite-manage__btn invite-manage__btn--primary" @click="handleShareLink">
              <img src="@/assets/icons/link_invite.svg" alt="share" width="16" height="16" />
              링크 공유
            </button>
          </div>
        </template>
      </div>
       <button class="invite-manage__kakao-banner" style="color: #3C1E1E;">
         <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 4C8.477 4 4 7.806 4 12.5c0 3.03 1.85 5.69 4.65 7.24L7.6 23.5a.286.286 0 0 0 .424.31L13.2 21.1c.264.022.53.04.8.04 5.523 0 10-3.806 10-8.5S19.523 4 14 4z" fill="currentColor"/></svg>
         <div class="invite-manage__kakao-text">
           <span class="invite-manage__kakao-main">카카오톡으로 초대장 보내기</span>
           <span class="invite-manage__kakao-sub">간편하게 회원님을 초대해보세요</span>
         </div>
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </button>
      <div class="invite-manage__members">
        <div class="invite-manage__members-header">
          <h3 class="invite-manage__members-title">최근 연결된 회원</h3>
          <button class="invite-manage__view-all">전체보기</button>
        </div>
        <div class="invite-manage__member-list">
          <template v-if="loading && recentMembers.length === 0">
            <AppSkeleton type="rect" height="68px" borderRadius="var(--radius-medium)" :count="3" />
          </template>
          <div v-else-if="recentMembers.length === 0" class="invite-manage__empty">
            <p class="invite-manage__empty-text">아직 연결된 회원이 없습니다</p>
            <p class="invite-manage__empty-sub">초대 코드를 공유하여 회원을 초대해보세요</p>
          </div>
          <template v-else>
            <div v-for="member in recentMembers" :key="member.member_id" class="member-item">
              <div class="member-item__avatar">
                <img
                  v-if="member.profiles?.photo_url"
                  :src="member.profiles.photo_url"
                  alt="member"
                  class="member-item__avatar-img"
                />
                <img
                  v-else
                  :src="personIcon"
                  alt="member"
                  width="24"
                  height="24"
                />
              </div>
              <div class="member-item__info">
                <p class="member-item__name">{{ member.profiles?.name || '알 수 없음' }} 회원님</p>
                <p class="member-item__date">{{ formatDate(member.connected_at) }} 가입</p>
              </div>
               <!-- <button class="member-item__more" style="color: var(--color-gray-600);">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>
               </button> -->
            </div>
          </template>
        </div>
      </div>
      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>

  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInvite } from '@/composables/useInvite'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/AppSkeleton.vue'
import personIcon from '@/assets/icons/person.svg'

const router = useRouter()
const { inviteCode, recentMembers, loading, error, fetchInviteCode, generateInviteCode, fetchRecentMembers } = useInvite()
const { showToast } = useToast()

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function handleCopyCode() {
  if (inviteCode.value?.code) {
    navigator.clipboard.writeText(inviteCode.value.code)
    showToast('초대 코드가 복사되었습니다')
  }
}

function handleShareLink() {
  if (!inviteCode.value?.code) return
  const url = `${window.location.origin}/invite/enter?code=${inviteCode.value.code}`
  navigator.clipboard.writeText(url)
  showToast('초대 링크가 복사되었습니다')
}

onMounted(async () => {
  await fetchInviteCode()
  if (!inviteCode.value) {
    await generateInviteCode()
  }
  fetchRecentMembers()
})

watch(error, (e) => { if (e) showToast(e, 'error') })
</script>
<style src="./InviteManageView.css" scoped></style>
