<!-- 회원 채팅 페이지 — 대화 목록 ↔ 채팅방 (Supabase Realtime) -->
<template>
  <div class="member-chat">

    <div v-if="hasActiveConnection === false" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; gap: 8px;">
      <p style="font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); color: var(--color-gray-900);">트레이너와 연결되지 않았습니다</p>
      <p style="font-size: var(--fs-body2); color: var(--color-gray-600);">트레이너를 찾아 연결해보세요</p>
    </div>

    <div v-else-if="hasActiveConnection === null" style="padding: 60px 20px;">
      <AppSkeleton type="line" :count="5" />
    </div>

    <template v-else>

    <!-- ══ 대화 목록 패널 ══ -->
    <div v-if="!selectedPartnerId" class="member-chat__list-panel">

      <!-- 헤더 -->
      <div class="member-chat__header">
        <h1 class="member-chat__title">채팅</h1>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="member-chat__loading">
        <AppSkeleton type="line" :count="5" />
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="conversations.length === 0" class="member-chat__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
        <p>대화 내역이 없습니다</p>
      </div>

      <!-- 대화 목록 -->
      <div v-else class="member-chat__conversations">
        <div
          v-for="conv in conversations"
          :key="conv.partnerId"
          class="member-chat__conv-card"
          @click="openChat(conv)"
        >
          <!-- 아바타 -->
          <div class="member-chat__avatar">
            <img v-if="conv.partnerPhoto" :src="conv.partnerPhoto" :alt="conv.partnerName" />
            <span v-else class="member-chat__avatar-initial">{{ conv.partnerName?.[0] ?? '?' }}</span>
          </div>

          <!-- 대화 정보 -->
          <div class="member-chat__conv-info">
            <div class="member-chat__conv-top">
              <span class="member-chat__conv-name">{{ conv.partnerName }}</span>
              <span class="member-chat__conv-time">{{ formatRelativeTime(conv.lastMessageTime) }}</span>
            </div>
            <div class="member-chat__conv-bottom">
              <span class="member-chat__conv-preview">{{ conv.lastMessage }}</span>
              <span v-if="conv.unreadCount > 0" class="member-chat__unread-badge">
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
    <div v-else class="member-chat__room-panel">

      <!-- 채팅방 헤더 -->
      <div class="member-chat__room-header">
        <button class="member-chat__back-btn" @click="closeChat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h2 class="member-chat__room-title">{{ partnerName }}</h2>
        <!-- <button v-if="!isSearchMode" class="member-chat__search-btn" @click="openSearchMode">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M20 20L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button v-else class="member-chat__search-close-btn" @click="closeSearchMode">X</button> -->
      </div>

      <div v-if="isSearchMode" class="member-chat__search-bar">
        <input
          v-model="searchQuery"
          class="member-chat__search-input"
          type="text"
          placeholder="메시지 검색"
          @input="handleSearchInput"
        />
      </div>

      <!-- 메시지 목록 -->
      <div ref="messageListRef" class="member-chat__messages">
        <template v-if="isSearchMode">
          <div class="member-chat__search-meta">
            <span v-if="searchLoading">검색 중...</span>
            <span v-else>{{ searchResults.length }}개 결과</span>
          </div>
          <div v-if="searchLoading" class="member-chat__msg-loading">메시지를 검색하는 중...</div>
          <div v-else-if="searchResults.length === 0" class="member-chat__msg-empty">검색 결과가 없습니다</div>
          <div
            v-for="msg in searchResults"
            :key="msg.id"
            class="member-chat__message"
            :class="msg.sender_id === auth.user?.id ? 'member-chat__message--mine' : 'member-chat__message--theirs'"
          >
            <div class="member-chat__bubble">
              <template v-if="msg.file_url">
                <img
                  v-if="msg.file_type?.startsWith('image/')"
                  :src="msg.file_url"
                  :alt="msg.file_name"
                  class="member-chat__file-img"
                  @click="openImageViewer(msg.file_url)"
                />
                <div
                  v-else-if="msg.file_type?.startsWith('video/')"
                  class="member-chat__video-thumb"
                  @click="openVideoViewer(msg.file_url)"
                >
                  <video :src="msg.file_url" preload="metadata" class="member-chat__video-thumb-el" />
                  <div class="member-chat__video-play-btn">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.5)"/>
                      <path d="M16 11L28 20L16 29V11Z" fill="white"/>
                    </svg>
                  </div>
                </div>
                <a v-else :href="msg.file_url" target="_blank" class="member-chat__file-link">
                  {{ msg.file_name ?? '파일 보기' }}
                </a>
              </template>
              <span v-if="msg.content">{{ msg.content }}</span>
            </div>
            <span v-if="msg.sender_id === auth.user?.id && !msg.is_read" class="member-chat__read-indicator">1</span>
            <span class="member-chat__msg-time">{{ formatMsgTime(msg.created_at) }}</span>
          </div>
        </template>
        <template v-else>
          <div v-if="loading && messages.length === 0" class="member-chat__msg-loading">
            <AppSkeleton type="line" :count="5" />
          </div>
          <div v-else-if="messages.length === 0" class="member-chat__msg-empty">
            첫 메시지를 보내보세요
          </div>
          <div v-else class="member-chat__load-more">
            <div v-if="loadingOlder" class="member-chat__load-spinner">
              <AppSkeleton type="line" :count="2" />
            </div>
            <p v-else-if="hasMore === false" class="member-chat__load-end">모든 메시지를 불러왔습니다</p>
          </div>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="member-chat__message"
            :class="msg.sender_id === auth.user?.id ? 'member-chat__message--mine' : 'member-chat__message--theirs'"
          >
            <div class="member-chat__bubble">
              <!-- 파일 메시지 -->
              <template v-if="msg.file_url">
                <img
                  v-if="msg.file_type?.startsWith('image/')"
                  :src="msg.file_url"
                  :alt="msg.file_name"
                  class="member-chat__file-img"
                  @click="openImageViewer(msg.file_url)"
                />
                <div
                  v-else-if="msg.file_type?.startsWith('video/')"
                  class="member-chat__video-thumb"
                  @click="openVideoViewer(msg.file_url)"
                >
                  <video :src="msg.file_url" preload="metadata" class="member-chat__video-thumb-el" />
                  <div class="member-chat__video-play-btn">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.5)"/>
                      <path d="M16 11L28 20L16 29V11Z" fill="white"/>
                    </svg>
                  </div>
                </div>
                <a v-else :href="msg.file_url" target="_blank" class="member-chat__file-link">
                  {{ msg.file_name ?? '파일 보기' }}
                </a>
              </template>
              <!-- 텍스트 메시지 -->
              <span v-if="msg.content">{{ msg.content }}</span>
            </div>
            <span v-if="msg.sender_id === auth.user?.id && !msg.is_read" class="member-chat__read-indicator">1</span>
            <span class="member-chat__msg-time">{{ formatMsgTime(msg.created_at) }}</span>
          </div>
        </template>
      </div>

      <div v-if="pendingFiles.length > 0" class="member-chat__file-preview">
        <div v-for="(pf, idx) in pendingFiles" :key="idx" class="member-chat__file-preview-item">
          <img
            v-if="pf.type.startsWith('image/')"
            :src="pf.previewUrl"
            class="member-chat__file-preview-thumb"
          />
          <div v-else class="member-chat__file-preview-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="member-chat__file-preview-name">{{ pf.file.name }}</span>
          </div>
          <button class="member-chat__file-preview-remove" @click="removePendingFile(idx)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <!-- 입력 영역 -->
      <div class="member-chat__input-area">
        <input
          ref="fileInputRef"
          type="file"
          class="member-chat__file-input"
          :accept="fileAccept"
          :multiple="fileAccept === 'image/*'"
          @change="handleFileChange"
        />
        <button class="member-chat__file-btn" @click="showFileMenu = !showFileMenu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
        <input
          v-model="inputText"
          class="member-chat__text-input"
          type="text"
          placeholder="메시지를 입력하세요"
          @keyup.enter="handleSend"
        />
        <button
          class="member-chat__send-btn"
          :disabled="!inputText.trim() && pendingFiles.length === 0"
          @click="handleSend"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div v-if="showFileMenu" class="member-chat__file-panel">
        <button class="member-chat__file-panel-item" @click="selectFileType('image')">
          <div class="member-chat__file-panel-icon member-chat__file-panel-icon--image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span>사진</span>
        </button>
        <button class="member-chat__file-panel-item" @click="selectFileType('video')">
          <div class="member-chat__file-panel-icon member-chat__file-panel-icon--video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="15" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M17 9L22 6V18L17 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span>영상</span>
        </button>
        <button class="member-chat__file-panel-item" @click="selectFileType('file')">
          <div class="member-chat__file-panel-icon member-chat__file-panel-icon--file">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span>파일</span>
        </button>
      </div>
    </div>
    </template>

    <AppImageViewer v-model="showImageViewer" :src="viewerImageSrc" />
    <AppVideoViewer v-model="showVideoViewer" :src="viewerVideoSrc" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChat } from '@/composables/useChat'
import { useReservations } from '@/composables/useReservations'
import { useToast } from '@/composables/useToast'
import AppSkeleton from '@/components/AppSkeleton.vue'
import AppImageViewer from '@/components/AppImageViewer.vue'
import AppVideoViewer from '@/components/AppVideoViewer.vue'
import { useChatBadgeStore } from '@/stores/chatBadge'

const auth = useAuthStore()
const chatBadgeStore = useChatBadgeStore()
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
const { checkTrainerConnection } = useReservations()

const selectedPartnerId = ref(null)
const partnerName = ref('')
const inputText = ref('')
const messageListRef = ref(null)
const fileInputRef = ref(null)
const showFileMenu = ref(false)
const fileAccept = ref('')
const pendingFiles = ref([])
const hasActiveConnection = ref(null)
const loadingOlder = ref(false)
const skipAutoScroll = ref(false)
const showImageViewer = ref(false)
const viewerImageSrc = ref('')
const showVideoViewer = ref(false)
const viewerVideoSrc = ref('')
const isSearchMode = ref(false)
const searchQuery = ref('')
let searchDebounceTimer = null

function openImageViewer(src) {
  viewerImageSrc.value = src
  showImageViewer.value = true
}

function openVideoViewer(src) {
  viewerVideoSrc.value = src
  showVideoViewer.value = true
}

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

function formatMsgTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? '오전' : '오후'
  return `${ampm} ${h % 12 || 12}:${m}`
}

async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

async function openChat(conv) {
  closeSearchMode()
  partnerName.value = conv.partnerName ?? '채팅'
  selectedPartnerId.value = conv.partnerId
  await fetchMessages(conv.partnerId)
  await markAsRead(conv.partnerId)
  chatBadgeStore.loadUnreadCount(true)
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

function closeChat() {
  unsubscribe()
  closeSearchMode()
  selectedPartnerId.value = null
  partnerName.value = ''
  inputText.value = ''
  clearPendingFiles()
  fetchConversations()
  subscribeToConversations()
}

async function handleSend() {
  const text = inputText.value.trim()
  const files = [...pendingFiles.value]
  if ((!text && files.length === 0) || !selectedPartnerId.value) return
  inputText.value = ''
  clearPendingFiles()

  if (text) {
    await sendMessage(selectedPartnerId.value, text, null)
  }
  for (const pf of files) {
    await sendMessage(selectedPartnerId.value, '', pf.file)
  }
  scrollToBottom()
}

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

function handleFileChange(e) {
  showFileMenu.value = false
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  if (fileInputRef.value) fileInputRef.value.value = ''

  const isImage = fileAccept.value === 'image/*'
  if (isImage) {
    const remaining = 5 - pendingFiles.value.length
    const toAdd = files.slice(0, remaining)
    for (const file of toAdd) {
      pendingFiles.value.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type,
      })
    }
  } else {
    clearPendingFiles()
    const file = files[0]
    pendingFiles.value.push({
      file,
      previewUrl: null,
      type: file.type,
    })
  }
}

function clearPendingFiles() {
  for (const pf of pendingFiles.value) {
    if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl)
  }
  pendingFiles.value = []
}

function removePendingFile(idx) {
  const pf = pendingFiles.value[idx]
  if (pf?.previewUrl) URL.revokeObjectURL(pf.previewUrl)
  pendingFiles.value.splice(idx, 1)
}

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
  const connected = await checkTrainerConnection()
  hasActiveConnection.value = connected
  if (!connected) return
  fetchConversations()
  subscribeToConversations()
  addMessageScrollListener()
})

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  removeMessageScrollListener()
  unsubscribe()
})
</script>

<style src="./MemberChatView.css" scoped></style>
