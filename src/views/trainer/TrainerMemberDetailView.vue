<!-- 회원 상세 페이지. 회원 프로필 정보 + 메모 목록 표시 -->
<template>
  <div class="mem-detail">
    <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 16px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="var(--color-gray-600)" stroke-width="1.6"/>
        <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16 4L20 8M20 4L16 8" stroke="var(--color-gray-600)" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">연결되지 않은 회원입니다</p>
      <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">회원 목록에서 연결된 회원을 선택해주세요</p>
      <button style="margin-top: 8px; padding: 14px 32px; background: var(--color-blue-primary); color: white; border: none; border-radius: var(--radius-medium); font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); cursor: pointer;" @click="router.back()">뒤로가기</button>
    </div>

    <div v-else-if="hasActiveConnection === null" class="mem-detail__loading-shell">
      <AppSkeleton type="circle" width="64px" height="64px" />
      <AppSkeleton type="line" :count="3" />
    </div>

    <template v-else>

    <!-- ── Header ── -->
    <div class="mem-detail__header">
      <button class="mem-detail__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-gray-900)">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="mem-detail__title">{{ member?.name || '' }}님 운동 메모</h1>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="mem-detail__error">{{ error }}</div>

    <div v-if="loading" class="mem-detail__body mem-detail__body--loading">
      <AppSkeleton type="circle" width="64px" height="64px" />
      <AppSkeleton type="line" :count="3" />
    </div>

    <div v-else-if="!member" class="mem-detail__body" style="display:flex;align-items:center;justify-content:center;padding:60px 20px;">
      <p style="color:var(--color-gray-600);font-size:var(--fs-body2);">회원 정보를 불러올 수 없습니다.</p>
    </div>

    <div v-else class="mem-detail__body">

      <!-- ── 회원 요약 ── -->
      <section class="summary-section">
        <h2 class="section-title">회원 요약</h2>

        <!-- 신체 정보 -->
        <div v-if="member?.age || member?.height || member?.weight || member?.gender" class="summary-body-stats">
          <div v-if="member.gender" class="summary-body-stat">
            <span class="summary-body-stat__label">성별</span>
            <span class="summary-body-stat__value">{{ member.gender }}</span>
          </div>
          <div v-if="member.age" class="summary-body-stat">
            <span class="summary-body-stat__label">나이</span>
            <span class="summary-body-stat__value">{{ member.age }}세</span>
          </div>
          <div v-if="member.height" class="summary-body-stat">
            <span class="summary-body-stat__label">키</span>
            <span class="summary-body-stat__value">{{ member.height }}cm</span>
          </div>
          <div v-if="member.weight" class="summary-body-stat">
            <span class="summary-body-stat__label">몸무게</span>
            <span class="summary-body-stat__value">{{ member.weight }}kg</span>
          </div>
        </div>

        <!-- 운동 목표 -->
        <div class="summary-notice">
          <div class="summary-notice__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: var(--color-blue-primary)">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 8v1M12 12v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="summary-notice__text">{{ member?.summary || '목표가 아직 설정되지 않았습니다' }}</p>
        </div>

        <!-- Stat mini cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-blue-primary)">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 12L8 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M12 7v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M12 12 C12 12 7 8 5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.3"/>
              </svg>
            </div>
            <span class="summary-card__label">최근 방문</span>
            <span class="summary-card__value">{{ member?.lastVisit || '-' }}</span>
          </div>
          <div class="summary-card">
            <div class="summary-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--color-blue-primary)">
                <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
                <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8 3V7M16 3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M7.5 14.5L10 17L16.5 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="summary-card__label">다음 예약</span>
            <span class="summary-card__value">{{ member?.nextSession || '-' }}</span>
          </div>
        </div>

        <!-- PT 잔여 횟수 -->
        <div class="pt-count-card">
          <div class="pt-count-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6.5 9.5V14.5M17.5 9.5V14.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M4 10.5V13.5M20 10.5V13.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <path d="M6.5 12H17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="pt-count-card__info">
            <span class="pt-count-card__label">PT 잔여 횟수</span>
            <span class="pt-count-card__value">{{ ptLoading || ptError ? '-' : remainingCount + '회' }}</span>
          </div>
        </div>
      </section>

      <!-- ── 바로가기 ── -->
      <section class="quick-actions">
        <button class="quick-action" @click="goPayment">
          <div class="quick-action__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
              <path d="M2 10H22" stroke="currentColor" stroke-width="1.8"/>
              <path d="M6 15H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="quick-action__label">수납 기록</span>
          <svg class="quick-action__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="quick-action" @click="goChat">
          <div class="quick-action__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="quick-action__label">채팅하기</span>
          <svg class="quick-action__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="quick-action" @click="goPtCount">
          <div class="quick-action__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M8 6h10M8 12h10M8 18h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="4" cy="6" r="1.2" fill="currentColor"/>
              <circle cx="4" cy="12" r="1.2" fill="currentColor"/>
              <circle cx="4" cy="18" r="1.2" fill="currentColor"/>
            </svg>
          </div>
          <span class="quick-action__label">PT 횟수 관리</span>
          <svg class="quick-action__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="quick-action quick-action--danger" @click="showDisconnectSheet = true">
          <div class="quick-action__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M10 17L15 12M15 12L10 7M15 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="quick-action__label">연결 해제</span>
          <svg class="quick-action__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>

      <!-- ── 메모 기록 ── -->
      <section class="memo-section">
        <div class="memo-section__header">
          <h2 class="section-title">메모 기록</h2>
          <button class="memo-section__all">전체보기</button>
        </div>

        <div class="memo-list">
          <div v-if="memos.length === 0" class="memo-list__empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>작성된 메모가 없습니다.</p>
          </div>
          <div
            v-for="memo in memos"
            :key="memo.id"
            class="memo-card"
          >
            <!-- Date row -->
            <div class="memo-card__top">
              <div class="memo-card__date-wrap">
                <span class="memo-card__dot" :class="`memo-card__dot--${memo.dotColor}`" />
                <span class="memo-card__date">{{ memo.date }}</span>
              </div>
              <div class="memo-card__actions">
                <span class="memo-card__time">{{ memo.time }}</span>
                <button class="memo-card__edit-btn" @click="handleEditMemo(memo)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="memo-card__delete-btn" @click="handleDeleteMemo(memo)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="memo.tags && memo.tags.length" class="memo-card__tags">
              <span v-for="tag in memo.tags" :key="tag" class="memo-tag">{{ tag }}</span>
            </div>

            <!-- Content -->
            <p class="memo-card__text">{{ memo.content }}</p>
          </div>
        </div>
      </section>

    </div>

    <!-- FAB -->
    <button class="mem-detail__fab" @click="handleAddMemo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </button>

    <div style="height: calc(var(--nav-height) + 32px);" />
  <AppBottomSheet v-model="showDisconnectSheet" title="회원 연결 해제">
    <p class="mem-detail__sheet-desc">정말 연결을 해제하시겠습니까?</p>
    <div class="mem-detail__sheet-actions">
      <button class="mem-detail__sheet-btn mem-detail__sheet-btn--cancel" @click="showDisconnectSheet = false">취소</button>
      <button class="mem-detail__sheet-btn mem-detail__sheet-btn--confirm" @click="handleDisconnect">확인</button>
    </div>
  </AppBottomSheet>

  <AppBottomSheet v-model="showDeleteMemoSheet" title="메모 삭제">
    <p class="mem-detail__sheet-desc">이 메모를 삭제하시겠습니까?</p>
    <div class="mem-detail__sheet-actions">
      <button class="mem-detail__sheet-btn mem-detail__sheet-btn--cancel" @click="showDeleteMemoSheet = false">취소</button>
      <button class="mem-detail__sheet-btn mem-detail__sheet-btn--confirm" @click="confirmDeleteMemo">삭제</button>
    </div>
  </AppBottomSheet>
    </template>
  </div>
</template>

<script setup>
defineOptions({ name: 'TrainerMemberDetailView' })
import { onMounted, onActivated, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMemos } from '@/composables/useMemos'
import { useProfile } from '@/composables/useProfile'
import { usePtSessions } from '@/composables/usePtSessions'
import { isActiveConnection } from '@/composables/useConnection'
import { useAuthStore } from '@/stores/auth'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { member, memos, loading, error, fetchMemberDetail, fetchMemos, deleteMemo } = useMemos()
const { disconnectMember } = useProfile()
const { remainingCount, loading: ptLoading, error: ptError, fetchPtHistory } = usePtSessions()

const showDisconnectSheet = ref(false)
const showDeleteMemoSheet = ref(false)
const deleteMemoTarget = ref(null)
const initialLoaded = ref(false)
const hasActiveConnection = ref(null)

onMounted(async () => {
  const memberId = route.params.id
  if (!memberId || !auth.user?.id) {
    hasActiveConnection.value = false
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, memberId)
  if (!hasActiveConnection.value) return
  await fetchMemberDetail(memberId)
  await fetchMemos(memberId)
  await fetchPtHistory(memberId)
  initialLoaded.value = true
})

/** keep-alive 복귀 시: PT 횟수/수납 변경 반영을 위해 경량 재조회 */
onActivated(async () => {
  if (!initialLoaded.value || hasActiveConnection.value !== true) return
  const memberId = route.params.id
  if (memberId) {
    await fetchPtHistory(memberId)
  }
})

function handleAddMemo() {
  router.push({ name: 'trainer-memo-write', params: { id: route.params.id } })
}

function goPayment() {
  router.push({ name: 'trainer-member-payment', params: { id: route.params.id } })
}

function goChat() {
  router.push({ name: 'trainer-chat', query: { partnerId: route.params.id } })
}

function goPtCount() {
  router.push({ name: 'trainer-pt-count', params: { id: route.params.id } })
}

async function handleDisconnect() {
  const ok = await disconnectMember(route.params.id)
  if (ok) {
    showDisconnectSheet.value = false
    router.push({ name: 'trainer-members' })
  }
}

function handleDeleteMemo(memo) {
  deleteMemoTarget.value = memo
  showDeleteMemoSheet.value = true
}

function handleEditMemo(memo) {
  router.push({ name: 'trainer-memo-edit', params: { id: route.params.id, memoId: memo.id } })
}

async function confirmDeleteMemo() {
  if (deleteMemoTarget.value) {
    await deleteMemo(deleteMemoTarget.value.id)
    showDeleteMemoSheet.value = false
    deleteMemoTarget.value = null
  }
}
</script>

<style src="./TrainerMemberDetailView.css" scoped></style>
