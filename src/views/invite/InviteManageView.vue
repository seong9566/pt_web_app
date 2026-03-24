<!-- 트레이너용 초대 코드 관리 페이지. 코드 생성/공유/복사, 최근 연결 회원 목록 표시 -->
<template>
  <div class="invite-manage">
    <div class="invite-manage__header">
      <button class="invite-manage__back" @click="safeBack(route.path)" style="color: var(--color-gray-900);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="invite-manage__title">초대 코드 관리</h2>
      <div style="width: 40px;" />
    </div>
    <div class="invite-manage__content">
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
        <button class="invite-manage__share-btn" @click="handleShare">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <div class="invite-manage__share-text">
            <span class="invite-manage__share-main">초대 링크 공유</span>
            <span class="invite-manage__share-sub">회원님을 초대해보세요</span>
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
                <span v-else class="member-item__avatar-initial">{{ (member.profiles?.name || '회')[0] }}</span>
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
      <div class="nav-spacer" />
    </div>

  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { safeBack } from '@/utils/navigation'
import { useInvite } from '@/composables/useInvite'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/AppSkeleton.vue'


const router = useRouter()
const route = useRoute()
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

function handleShare() {
  if (!inviteCode.value?.code) return
  const url = `${window.location.origin}/invite/enter?code=${inviteCode.value.code}`
  const shareData = {
    title: 'PT 매니저 초대',
    text: `초대 코드: ${inviteCode.value.code}`,
    url: url
  }

  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      // 사용자가 공유를 취소한 경우 무시
    })
  } else {
    // Web Share API 미지원 시 클립보드에 복사
    navigator.clipboard.writeText(url)
    showToast('초대 링크가 복사되었습니다')
  }
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
