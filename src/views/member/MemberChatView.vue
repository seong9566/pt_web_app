<!-- 회원 채팅 페이지 — 대화 목록 ↔ 채팅방 (Supabase Realtime) -->
<template>
  <div class="member-chat">

    <!-- ══ 대화 목록 패널 ══ -->
    <div v-if="!selectedPartnerId" class="member-chat__list-panel">

      <!-- 헤더 -->
      <div class="member-chat__header">
        <h1 class="member-chat__title">채팅</h1>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="member-chat__loading">
        대화 목록을 불러오는 중...
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
      </div>

      <!-- 메시지 목록 -->
      <div ref="messageListRef" class="member-chat__messages">
        <div v-if="loading && messages.length === 0" class="member-chat__msg-loading">
          메시지를 불러오는 중...
        </div>
        <div v-else-if="messages.length === 0" class="member-chat__msg-empty">
          첫 메시지를 보내보세요
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
              />
              <a v-else :href="msg.file_url" target="_blank" class="member-chat__file-link">
                {{ msg.file_name ?? '파일 보기' }}
              </a>
            </template>
            <!-- 텍스트 메시지 -->
            <span v-if="msg.content">{{ msg.content }}</span>
          </div>
          <span class="member-chat__msg-time">{{ formatMsgTime(msg.created_at) }}</span>
        </div>
      </div>

      <!-- 입력 영역 -->
      <div class="member-chat__input-area">
        <input
          ref="fileInputRef"
          type="file"
          class="member-chat__file-input"
          @change="handleFileChange"
        />
        <button class="member-chat__file-btn" @click="triggerFileInput">
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
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <AppToast v-model="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChat } from '@/composables/useChat'
import { useToast } from '@/composables/useToast'
import AppToast from '@/components/AppToast.vue'

const auth = useAuthStore()
const {
  conversations,
  messages,
  loading,
  error,
  fetchConversations,
  fetchMessages,
  sendMessage,
  markAsRead,
  subscribeToMessages,
  unsubscribe,
} = useChat()

const { showToast, toastMessage, toastType, showError } = useToast()

const selectedPartnerId = ref(null)
const partnerName = ref('')
const inputText = ref('')
const messageListRef = ref(null)
const fileInputRef = ref(null)

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
  partnerName.value = conv.partnerName ?? '채팅'
  selectedPartnerId.value = conv.partnerId
  await fetchMessages(conv.partnerId)
  await markAsRead(conv.partnerId)
  subscribeToMessages(conv.partnerId)
  scrollToBottom()
}

function closeChat() {
  unsubscribe()
  selectedPartnerId.value = null
  partnerName.value = ''
  inputText.value = ''
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || !selectedPartnerId.value) return
  inputText.value = ''
  await sendMessage(selectedPartnerId.value, text, null)
  scrollToBottom()
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file || !selectedPartnerId.value) return
  if (fileInputRef.value) fileInputRef.value.value = ''
  await sendMessage(selectedPartnerId.value, '', file)
  scrollToBottom()
}

watch(messages, () => {
  if (selectedPartnerId.value) scrollToBottom()
}, { deep: true })

watch(error, (val) => {
  if (val) showError(val)
})

onMounted(() => {
  fetchConversations()
})

onUnmounted(() => {
  unsubscribe()
})
</script>

<style src="./MemberChatView.css" scoped></style>
