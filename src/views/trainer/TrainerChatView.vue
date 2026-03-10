<!-- 트레이너 채팅 페이지 — 대화 목록 ↔ 채팅방 (Supabase Realtime) -->
<template>
  <div class="trainer-chat">
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

    <div v-else-if="hasActiveConnection === null" style="display:flex;align-items:center;justify-content:center;padding:60px 20px;">
      <p style="color:var(--color-gray-600);font-size:var(--fs-body2);">불러오는 중...</p>
    </div>

    <template v-else>

    <!-- ══ 대화 목록 패널 ══ -->
    <div v-if="!selectedPartnerId" class="trainer-chat__list-panel">

      <!-- 헤더 -->
      <div class="trainer-chat__header">
        <h1 class="trainer-chat__title">채팅</h1>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="trainer-chat__loading">
        대화 목록을 불러오는 중...
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="conversations.length === 0" class="trainer-chat__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
        <p>대화 내역이 없습니다</p>
      </div>

      <!-- 대화 목록 -->
      <div v-else class="trainer-chat__conversations">
        <div
          v-for="conv in conversations"
          :key="conv.partnerId"
          class="trainer-chat__conv-card"
          @click="openChat(conv)"
        >
          <!-- 아바타 -->
          <div class="trainer-chat__avatar">
            <img v-if="conv.partnerPhoto" :src="conv.partnerPhoto" :alt="conv.partnerName" />
            <span v-else class="trainer-chat__avatar-initial">{{ conv.partnerName?.[0] ?? '?' }}</span>
          </div>

          <!-- 대화 정보 -->
          <div class="trainer-chat__conv-info">
            <div class="trainer-chat__conv-top">
              <span class="trainer-chat__conv-name">{{ conv.partnerName }}</span>
              <span class="trainer-chat__conv-time">{{ formatRelativeTime(conv.lastMessageTime) }}</span>
            </div>
            <div class="trainer-chat__conv-bottom">
              <span class="trainer-chat__conv-preview">{{ conv.lastMessage }}</span>
              <span v-if="conv.unreadCount > 0" class="trainer-chat__unread-badge">
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 네비 스페이서 -->
      <div style="height: calc(var(--nav-height) + 16px);" />
    </div>

    <!-- ══ 채팅방 패널 ══ -->
    <div v-else class="trainer-chat__room-panel">

      <!-- 채팅방 헤더 -->
      <div class="trainer-chat__room-header">
        <button class="trainer-chat__back-btn" @click="closeChat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h2 class="trainer-chat__room-title">{{ partnerName }}</h2>
        <button v-if="!isSearchMode" class="trainer-chat__search-btn" @click="openSearchMode">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M20 20L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button v-else class="trainer-chat__search-close-btn" @click="closeSearchMode">X</button>
      </div>

      <div v-if="isSearchMode" class="trainer-chat__search-bar">
        <input
          v-model="searchQuery"
          class="trainer-chat__search-input"
          type="text"
          placeholder="메시지 검색"
          @input="handleSearchInput"
        />
      </div>

      <!-- 메시지 목록 -->
      <div ref="messageListRef" class="trainer-chat__messages">
        <template v-if="isSearchMode">
          <div class="trainer-chat__search-meta">
            <span v-if="searchLoading">검색 중...</span>
            <span v-else>{{ searchResults.length }}개 결과</span>
          </div>
          <div v-if="searchLoading" class="trainer-chat__msg-loading">메시지를 검색하는 중...</div>
          <div v-else-if="searchResults.length === 0" class="trainer-chat__msg-empty">검색 결과가 없습니다</div>
          <div
            v-for="msg in searchResults"
            :key="msg.id"
            class="trainer-chat__message"
            :class="msg.sender_id === auth.user?.id ? 'trainer-chat__message--mine' : 'trainer-chat__message--theirs'"
          >
            <div class="trainer-chat__bubble">
              <template v-if="msg.file_url">
                <img
                  v-if="msg.file_type?.startsWith('image/')"
                  :src="msg.file_url"
                  :alt="msg.file_name"
                  class="trainer-chat__file-img"
                  @click="openImageViewer(msg.file_url)"
                />
                <a v-else :href="msg.file_url" target="_blank" class="trainer-chat__file-link">
                  {{ msg.file_name ?? '파일 보기' }}
                </a>
              </template>
              <span v-if="msg.content">{{ msg.content }}</span>
            </div>
            <span v-if="msg.sender_id === auth.user?.id && !msg.is_read" class="trainer-chat__read-indicator">1</span>
            <span class="trainer-chat__msg-time">{{ formatMsgTime(msg.created_at) }}</span>
          </div>
        </template>
        <template v-else>
          <div v-if="loading && messages.length === 0" class="trainer-chat__msg-loading">
            메시지를 불러오는 중...
          </div>
          <div v-else-if="messages.length === 0" class="trainer-chat__msg-empty">
            첫 메시지를 보내보세요
          </div>
          <div v-else class="trainer-chat__load-more">
            <div v-if="loadingOlder" class="trainer-chat__load-spinner">불러오는 중...</div>
            <p v-else-if="hasMore === false" class="trainer-chat__load-end">모든 메시지를 불러왔습니다</p>
          </div>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="trainer-chat__message"
            :class="msg.sender_id === auth.user?.id ? 'trainer-chat__message--mine' : 'trainer-chat__message--theirs'"
          >
            <div class="trainer-chat__bubble">
              <!-- 파일 메시지 -->
              <template v-if="msg.file_url">
                <img
                  v-if="msg.file_type?.startsWith('image/')"
                  :src="msg.file_url"
                  :alt="msg.file_name"
                  class="trainer-chat__file-img"
                  @click="openImageViewer(msg.file_url)"
                />
                <a v-else :href="msg.file_url" target="_blank" class="trainer-chat__file-link">
                  {{ msg.file_name ?? '파일 보기' }}
                </a>
              </template>
              <!-- 텍스트 메시지 -->
              <span v-if="msg.content">{{ msg.content }}</span>
            </div>
            <span v-if="msg.sender_id === auth.user?.id && !msg.is_read" class="trainer-chat__read-indicator">1</span>
            <span class="trainer-chat__msg-time">{{ formatMsgTime(msg.created_at) }}</span>
          </div>
        </template>
      </div>

      <!-- 입력 영역 -->
      <div class="trainer-chat__input-area">
        <input
          ref="fileInputRef"
          type="file"
          class="trainer-chat__file-input"
          :accept="fileAccept"
          @change="handleFileChange"
        />
        <button class="trainer-chat__file-btn" @click="showFileMenu = !showFileMenu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
        <input
          v-model="inputText"
          class="trainer-chat__text-input"
          type="text"
          placeholder="메시지를 입력하세요"
          @keyup.enter="handleSend"
        />
        <button
          class="trainer-chat__send-btn"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div v-if="showFileMenu" class="trainer-chat__file-panel">
        <button class="trainer-chat__file-panel-item" @click="selectFileType('image')">
          <div class="trainer-chat__file-panel-icon trainer-chat__file-panel-icon--image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span>사진</span>
        </button>
        <button class="trainer-chat__file-panel-item" @click="selectFileType('video')">
          <div class="trainer-chat__file-panel-icon trainer-chat__file-panel-icon--video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="15" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M17 9L22 6V18L17 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span>영상</span>
        </button>
        <button class="trainer-chat__file-panel-item" @click="selectFileType('file')">
          <div class="trainer-chat__file-panel-icon trainer-chat__file-panel-icon--file">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span>파일</span>
        </button>
      </div>
    </div>

    <AppToast v-model="showToast" :message="toastMessage" :type="toastType" />
    <AppImageViewer v-model="showImageViewer" :src="viewerImageSrc" />
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isActiveConnection } from '@/composables/useConnection'
import { useAuthStore } from '@/stores/auth'
import { useChat } from '@/composables/useChat'
import { useToast } from '@/composables/useToast'
import AppToast from '@/components/AppToast.vue'
import AppImageViewer from '@/components/AppImageViewer.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const {
  conversations,
  messages,
  loading,
  searchLoading,
  error,
  hasMore,
  fetchConversations,
  fetchMessages,
  fetchOlderMessages,
  searchResults,
  searchMessages,
  sendMessage,
  markAsRead,
  subscribeToMessages,
  subscribeToReadReceipts,
  subscribeToConversations,
  unsubscribe,
} = useChat()

const { showToast, toastMessage, toastType, showError } = useToast()

// ── 상태 ──
const selectedPartnerId = ref(null)
const partnerName = ref('')
const inputText = ref('')
const messageListRef = ref(null)
const fileInputRef = ref(null)
const showFileMenu = ref(false)
const fileAccept = ref('')
const hasActiveConnection = ref(null)
const loadingOlder = ref(false)
const skipAutoScroll = ref(false)
const showImageViewer = ref(false)
const viewerImageSrc = ref('')
const isSearchMode = ref(false)
const searchQuery = ref('')
let searchDebounceTimer = null

function openImageViewer(src) {
  viewerImageSrc.value = src
  showImageViewer.value = true
}

// ── 시간 포맷: 상대 시간 (대화 목록용) ──
function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  return `${Math.floor(diffHour / 24)}일 전`
}

// ── 시간 포맷: 오전/오후 HH:MM (메시지 버블용) ──
function formatMsgTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  return `${ampm} ${h % 12 || 12}:${m}`
}

// ── 메시지 목록 맨 아래로 스크롤 ──
async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// ── 채팅방 열기 ──
async function openChat(conv) {
  closeSearchMode()
  hasActiveConnection.value = null
  hasActiveConnection.value = await isActiveConnection(auth.user?.id, conv.partnerId)
  if (!hasActiveConnection.value) {
    selectedPartnerId.value = null
    partnerName.value = ''
    return
  }
  partnerName.value = conv.partnerName ?? '채팅'
  selectedPartnerId.value = conv.partnerId
  await fetchMessages(conv.partnerId)
  await markAsRead(conv.partnerId)
  subscribeToMessages(conv.partnerId)
  subscribeToReadReceipts(conv.partnerId)
  scrollToBottom()
}

function openSearchMode() {
  isSearchMode.value = true
  searchQuery.value = ''
  searchResults.value = []
}

function closeSearchMode() {
  isSearchMode.value = false
  searchQuery.value = ''
  searchResults.value = []
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
}

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    if (!selectedPartnerId.value) return
    searchMessages(selectedPartnerId.value, searchQuery.value)
  }, 300)
}

function addMessageScrollListener() {
  messageListRef.value?.addEventListener('scroll', handleScroll)
}

function removeMessageScrollListener() {
  messageListRef.value?.removeEventListener('scroll', handleScroll)
}

async function handleScroll() {
  const listEl = messageListRef.value
  if (!listEl || !selectedPartnerId.value || loadingOlder.value || !hasMore.value) return
  if (listEl.scrollTop >= 50) return

  loadingOlder.value = true
  skipAutoScroll.value = true

  const previousHeight = listEl.scrollHeight
  await fetchOlderMessages(selectedPartnerId.value)
  await nextTick()

  const currentHeight = listEl.scrollHeight
  listEl.scrollTop += currentHeight - previousHeight

  skipAutoScroll.value = false
  loadingOlder.value = false
}

// ── 채팅방 닫기 ──
function closeChat() {
  unsubscribe()
  closeSearchMode()
  selectedPartnerId.value = null
  partnerName.value = ''
  inputText.value = ''
  hasActiveConnection.value = true
  fetchConversations()
  subscribeToConversations()
}

// ── 메시지 전송 ──
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || !selectedPartnerId.value) return
  inputText.value = ''
  await sendMessage(selectedPartnerId.value, text, null)
  scrollToBottom()
}

// ── 파일 유형 선택 ──
function selectFileType(type) {
  if (type === 'image') {
    fileAccept.value = 'image/*'
  } else if (type === 'video') {
    fileAccept.value = 'video/*'
  } else {
    fileAccept.value = ''
  }
  showFileMenu.value = false
  nextTick(() => {
    fileInputRef.value?.click()
  })
}

// ── 파일 선택 → 바로 전송 ──
async function handleFileChange(e) {
  showFileMenu.value = false
  const file = e.target.files?.[0]
  if (!file || !selectedPartnerId.value) return
  if (fileInputRef.value) fileInputRef.value.value = ''
  await sendMessage(selectedPartnerId.value, '', file)
  scrollToBottom()
}

// ── 새 메시지 수신 시 자동 스크롤 ──
watch(messages, () => {
  if (selectedPartnerId.value && !skipAutoScroll.value) scrollToBottom()
}, { deep: true })

watch(selectedPartnerId, async (value) => {
  removeMessageScrollListener()
  if (!value) return
  await nextTick()
  addMessageScrollListener()
})

watch(error, (val) => {
  if (val) showError(val)
})

onMounted(async () => {
  await fetchConversations()
  subscribeToConversations()
  const partnerId = route.query.partnerId || route.params.partnerId || route.params.memberId
  if (!partnerId || !auth.user?.id) {
    hasActiveConnection.value = true
    return
  }
  hasActiveConnection.value = await isActiveConnection(auth.user.id, partnerId)
  if (!hasActiveConnection.value) return
  const targetConversation = conversations.value.find(conv => conv.partnerId === partnerId)
  if (targetConversation) {
    await openChat(targetConversation)
    return
  }
  selectedPartnerId.value = partnerId
  closeSearchMode()
  partnerName.value = '채팅'
  await fetchMessages(partnerId)
  await markAsRead(partnerId)
  subscribeToMessages(partnerId)
  subscribeToReadReceipts(partnerId)
  scrollToBottom()
  addMessageScrollListener()
})

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  removeMessageScrollListener()
  unsubscribe()
})
</script>

<style src="./TrainerChatView.css" scoped></style>
