<!-- [미구현] 메모 작성 페이지. 회원별 메모 작성/수정 (목 데이터) -->
<template>
  <div class="memo-write">

    <!-- ── Header ── -->
    <div class="memo-write__header">
      <button class="memo-write__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="memo-write__title">메모 작성</h1>
      <button
        class="memo-write__save"
        :disabled="!canSave"
        @click="handleSave"
      >
        저장
      </button>
    </div>

    <!-- ── Body (scrollable) ── -->
    <div class="memo-write__body">

      <!-- 날짜 선택 -->
      <section class="memo-write__section">
        <label class="memo-write__label">날짜</label>
        <button class="memo-write__field-btn" @click="showDateSheet = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
            <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 3V7M16 3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="memo-write__field-text">{{ formattedDate }}</span>
          <svg class="memo-write__field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>

      <!-- 시간 선택 -->
      <section class="memo-write__section">
        <label class="memo-write__label">시간</label>
        <button class="memo-write__field-btn" @click="showTimeSheet = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="memo-write__field-text">{{ formattedTime }}</span>
          <svg class="memo-write__field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>

      <!-- 태그 선택 -->
      <section class="memo-write__section">
        <label class="memo-write__label">태그</label>
        <div class="memo-write__tags">
          <button
            v-for="tag in availableTags"
            :key="tag"
            class="memo-write__tag"
            :class="{ 'memo-write__tag--active': selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </section>

      <!-- 메모 내용 -->
      <section class="memo-write__section">
        <label class="memo-write__label">메모 내용</label>
        <textarea
          class="memo-write__textarea"
          v-model="content"
          placeholder="운동 내용, 회원 컨디션, 식단 피드백 등을 기록하세요..."
        />
      </section>

      <!-- 사진 첨부 -->
      <section class="memo-write__section">
        <label class="memo-write__label">사진 첨부</label>
        <div class="memo-write__photos">
          <div v-for="(photo, idx) in photos" :key="idx" class="memo-write__photo">
            <img :src="photo" alt="첨부 사진" class="memo-write__photo-img" />
            <button class="memo-write__photo-remove" @click="removePhoto(idx)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)"/>
                <path d="M8 8L16 16M16 8L8 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <button class="memo-write__photo-add" @click="triggerFileInput">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="8.5" cy="9.5" r="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2 16L7 12L11 15L16 10L22 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>사진 추가</span>
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          hidden
          @change="handleFiles"
        />
      </section>

    </div>

    <!-- ── Footer ── -->
    <div class="memo-write__footer">
      <button
        class="memo-write__submit"
        :disabled="!canSave"
        @click="handleSave"
      >
        메모 저장하기
      </button>
    </div>

    <!-- ── Date Bottom Sheet ── -->
    <AppBottomSheet v-model="showDateSheet" title="날짜 선택">
      <AppCalendar :model-value="selectedDate" @update:model-value="onDateSelect" />
    </AppBottomSheet>

    <!-- ── Time Bottom Sheet ── -->
    <AppBottomSheet v-model="showTimeSheet" title="시간 선택">
      <AppTimePicker v-model="selectedTime" />
      <button class="memo-write__time-confirm" @click="showTimeSheet = false">확인</button>
    </AppBottomSheet>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppCalendar from '@/components/AppCalendar.vue'
import AppTimePicker from '@/components/AppTimePicker.vue'

const router = useRouter()
const route = useRoute()
const memberId = route.params.id

const pad = (n) => String(n).padStart(2, '0')

// ── Date ──
const today = new Date()
const selectedDate = ref(
  `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
)
const showDateSheet = ref(false)

const formattedDate = computed(() => {
  const [y, m, d] = selectedDate.value.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
})

function onDateSelect(dateStr) {
  selectedDate.value = dateStr
  showDateSheet.value = false
}

// ── Time ──
const selectedTime = ref(
  `${pad(today.getHours())}:${pad(today.getMinutes())}`
)
const showTimeSheet = ref(false)

const formattedTime = computed(() => {
  const [h, m] = selectedTime.value.split(':').map(Number)
  const period = h >= 12 ? '오후' : '오전'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return `${period} ${hour12}:${pad(m)}`
})

// ── Tags ──
const availableTags = ['상체', '하체', '유산소', '코어', '스트레칭', '상담', '식단']
const selectedTags = ref([])

function toggleTag(tag) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(idx, 1)
  }
}

// ── Content ──
const content = ref('')

// ── Photos ──
const photos = ref([])
const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFiles(e) {
  const files = Array.from(e.target.files || [])
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      photos.value.push(URL.createObjectURL(file))
    }
  })
  e.target.value = ''
}

function removePhoto(idx) {
  URL.revokeObjectURL(photos.value[idx])
  photos.value.splice(idx, 1)
}

// ── Save ──
const canSave = computed(() => content.value.trim().length > 0)

function handleSave() {
  if (!canSave.value) return

  const memo = {
    memberId,
    date: selectedDate.value,
    time: selectedTime.value,
    tags: [...selectedTags.value],
    content: content.value.trim(),
    photoCount: photos.value.length,
  }

  console.log('메모 저장:', memo)
  alert('메모가 저장되었습니다.')
  router.back()
}
</script>

<style src="./MemoWriteView.css" scoped></style>
