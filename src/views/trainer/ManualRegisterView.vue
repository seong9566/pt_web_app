<!-- [미구현] 매뉴얼 등록 페이지. 운동 매뉴얼 생성/편집 (목 데이터) -->
<template>
  <div class="manual-reg">

    <!-- ── Header ── -->
    <div class="manual-reg__header">
      <button class="manual-reg__header-btn" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="manual-reg__header-title">매뉴얼 등록</h1>
      <div style="width:44px;" />
    </div>

    <!-- ── Body ── -->
    <div class="manual-reg__body">

            <!-- 카테고리 -->
      <section class="manual-reg__section">
        <label class="manual-reg__label">카테고리</label>
        <div class="manual-reg__chips">
          <button
            v-for="cat in categories"
            :key="cat"
            class="manual-reg__chip"
            :class="{ 'manual-reg__chip--active': form.categories.includes(cat) }"
            @click="toggleCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </section>

      <!-- 메뉴얼 이름 -->
      <section class="manual-reg__section">
        <label class="manual-reg__label">메뉴얼 이름</label>
        <input
          v-model="form.title"
          class="manual-reg__input"
          type="text"
          placeholder="메뉴얼 제목을 입력하세요"
          maxlength="50"
        />
      </section>

      <!-- 설명 -->
      <section class="manual-reg__section">
        <label class="manual-reg__label">설명</label>
        <textarea
          v-model="form.description"
          class="manual-reg__textarea"
          placeholder="운동 방법, 주의사항 등 상세한 설명을 입력하세요."
          rows="5"
        />
      </section>


      <!-- 사진 및 영상 -->
      <section class="manual-reg__section">
        <div class="manual-reg__label-row">
          <label class="manual-reg__label">사진 및 영상</label>
          <span class="manual-reg__label-sub">최대 5장</span>
        </div>

        <div class="manual-reg__media-row">
          <!-- 추가하기 버튼 -->
          <button
            v-if="mediaFiles.length < 5"
            class="manual-reg__media-add"
            @click="openFilePicker"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.8"/>
            </svg>
            <span>추가하기</span>
            <!-- + badge -->
            <span class="manual-reg__media-add-plus">+</span>
          </button>

          <!-- 미디어 썸네일 -->
          <div
            v-for="(file, idx) in mediaFiles"
            :key="idx"
            class="manual-reg__media-thumb"
          >
            <img v-if="file.isImage" :src="file.url" :alt="file.name" />
            <video v-else :src="file.url" />
            <!-- 영상 아이콘 오버레이 -->
            <div v-if="!file.isImage" class="manual-reg__media-video-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)"/>
                <path d="M10 8L16 12L10 16V8Z" fill="white"/>
              </svg>
            </div>
            <!-- 삭제 버튼 -->
            <button class="manual-reg__media-remove" @click="removeMedia(idx)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- hidden file input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*,video/*"
          multiple
          style="display:none"
          @change="handleFileChange"
        />
      </section>

      <!-- 참고 영상 (YouTube) -->
      <section class="manual-reg__section">
        <label class="manual-reg__label">참고 영상 (YouTube)</label>
        <div class="manual-reg__input-icon-wrap">
          <svg class="manual-reg__input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
            <path d="M10 9L16 12L10 15V9Z" fill="currentColor"/>
          </svg>
          <input
            v-model="form.youtubeUrl"
            class="manual-reg__input manual-reg__input--icon"
            type="url"
            placeholder="https://youtube.com/..."
          />
        </div>
      </section>

      <div style="height: 100px;" />
    </div>

    <!-- ── Footer ── -->
    <div class="manual-reg__footer">
      <button
        class="manual-reg__save-btn"
        :disabled="!form.title.trim()"
        @click="handleSave"
      >
        저장하기
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── 카테고리 ──
const categories = ['재활', '근력', '다이어트', '스포츠', '코어', '유연성']

// ── 폼 상태 ──
const form = reactive({
  title: '',
  description: '',
  categories: [],
  youtubeUrl: '',
})

function toggleCategory(cat) {
  const idx = form.categories.indexOf(cat)
  if (idx === -1) {
    form.categories.push(cat)
  } else {
    form.categories.splice(idx, 1)
  }
}

// ── 미디어 첨부 ──
const fileInput = ref(null)
const mediaFiles = ref([]) // { url, isImage, name }

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const files = Array.from(e.target.files)
  const remaining = 5 - mediaFiles.value.length
  const toAdd = files.slice(0, remaining)

  toAdd.forEach(file => {
    const url = URL.createObjectURL(file)
    mediaFiles.value.push({
      url,
      isImage: file.type.startsWith('image/'),
      name: file.name,
    })
  })

  // 동일 파일 재선택 가능하도록 초기화
  e.target.value = ''
}

function removeMedia(idx) {
  URL.revokeObjectURL(mediaFiles.value[idx].url)
  mediaFiles.value.splice(idx, 1)
}

// ── 저장 ──
function handleSave() {
  if (!form.title.trim()) return
  // TODO: 실제 API 연동
  alert('저장되었습니다')
  router.back()
}
</script>

<style src="./ManualRegisterView.css" scoped></style>
