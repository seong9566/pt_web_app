<!-- [미구현] 매뉴얼 상세 보기. 제목, 설명, 메타 정보, 미디어 갤러리, 유튜브 링크 -->
<template>
  <div class="manual-detail">

    <!-- ── Fallback: invalid ID ── -->
    <template v-if="!manual">
      <div class="manual-detail__fallback">
        <button class="manual-detail__back manual-detail__back--dark" @click="router.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <p class="manual-detail__fallback-text">매뉴얼을 찾을 수 없습니다</p>
      </div>
    </template>

    <!-- ── Main content ── -->
    <template v-else>

      <!-- Hero -->
      <div class="manual-detail__hero" :style="{ background: manual.gradient }">
        <div class="manual-detail__hero-overlay" />
        <button class="manual-detail__back" @click="router.back()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="manual-detail__hero-bottom">
          <span class="manual-detail__badge">{{ manual.categories[0] }}</span>
          <h1 class="manual-detail__title">{{ manual.title }}</h1>
        </div>
      </div>

      <!-- Body -->
      <div class="manual-detail__body">

        <!-- Meta bar -->
        <div class="manual-detail__meta">
          <template v-if="manual.duration">
            <div class="manual-detail__meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="manual-detail__meta-label">시간</span>
              <span class="manual-detail__meta-value">{{ manual.duration }}{{ manual.unit }}</span>
            </div>
            <div v-if="manual.difficulty" class="manual-detail__meta-divider" />
          </template>
          <template v-if="manual.difficulty">
            <div class="manual-detail__meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="manual-detail__meta-label">난이도</span>
              <span class="manual-detail__meta-value">{{ manual.difficulty }}</span>
            </div>
          </template>
        </div>

        <!-- 설명 -->
        <section class="manual-detail__section">
          <h2 class="manual-detail__section-title">설명</h2>
          <p class="manual-detail__desc">{{ manual.description }}</p>
        </section>

        <!-- 미디어 갤러리 -->
        <section v-if="manual.media && manual.media.length > 0" class="manual-detail__section">
          <h2 class="manual-detail__section-title">미디어</h2>
          <div class="manual-detail__media-grid">
            <div 
              v-for="(item, idx) in manual.media" 
              :key="idx" 
              class="manual-detail__media-box"
            >
              <span class="manual-detail__media-type">{{ item.type === 'video' ? '영상' : '사진' }}</span>
            </div>
          </div>
        </section>

        <!-- YouTube -->
        <section v-if="manual.youtubeUrl" class="manual-detail__section">
          <h2 class="manual-detail__section-title">유튜브</h2>
          <a :href="manual.youtubeUrl" target="_blank" rel="noopener noreferrer" class="manual-detail__youtube">
            <div class="manual-detail__youtube-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <polygon points="10,8 16,12 10,16" fill="currentColor"/>
              </svg>
            </div>
            <span class="manual-detail__youtube-link">{{ manual.youtubeUrl }}</span>
          </a>
        </section>

      </div>
    </template>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Mock 데이터 (실제는 API에서 로드)
const manuals = [
  {
    id: 1,
    title: '허리 재활 운동',
    description: '허리 통증 완화와 코어 안정화를 위한 재활 프로그램입니다.',
    categories: ['재활'],
    gradient: 'linear-gradient(145deg, #c9a97a 0%, #a07850 45%, #7a5c38 100%)',
    duration: 15,
    unit: '분',
    difficulty: '초급',
    youtubeUrl: '',
    media: [
      { type: 'image', placeholder: '그라디언트1' },
      { type: 'image', placeholder: '그라디언트2' }
    ]
  },
  {
    id: 2,
    title: '전신 파워 루틴',
    description: '상체와 하체를 균형 있게 자극하는 고강도 전신 운동입니다.',
    categories: ['근력'],
    gradient: 'linear-gradient(145deg, #3a4a5c 0%, #2c3a4a 50%, #1e2d3d 100%)',
    duration: 45,
    unit: '분',
    difficulty: '고급',
    youtubeUrl: '',
    media: []
  },
  {
    id: 3,
    title: 'HIIT 유산소 폭발',
    description: '짧은 시간에 최대 칼로리를 소모하는 고강도 인터벌 트레이닝입니다.',
    categories: ['유산소', '스포츠'],
    gradient: 'linear-gradient(145deg, #5aaee8 0%, #3a8dcf 45%, #1a6ab0 100%)',
    duration: 20,
    unit: '분',
    difficulty: '중급',
    youtubeUrl: 'https://youtube.com/watch?v=example1',
    media: [
      { type: 'video', placeholder: '영상1' }
    ]
  },
  {
    id: 4,
    title: '케토 식단 플랜',
    description: '탄수화물 섭취를 제한하고 건강한 지방을 중심으로 한 식단 가이드입니다.',
    categories: ['영양', '다이어트'],
    gradient: 'linear-gradient(145deg, #5aaa5a 0%, #3a8a3a 45%, #2a6e2a 100%)',
    duration: null,
    unit: '분',
    difficulty: null,
    youtubeUrl: '',
    media: []
  },
  {
    id: 5,
    title: '어깨 가동성 훈련',
    description: '어깨 관절의 가동 범위를 넓히고 통증을 예방하는 가벼운 훈련입니다.',
    categories: ['재활', '가동성'],
    gradient: 'linear-gradient(145deg, #e8d5b8 0%, #c8b898 50%, #a89878 100%)',
    duration: 10,
    unit: '분',
    difficulty: '초급',
    youtubeUrl: '',
    media: [
      { type: 'image', placeholder: '사진1' },
      { type: 'video', placeholder: '영상1' }
    ]
  },
  {
    id: 6,
    title: '코어 강화 운동',
    description: '복부, 허리, 골반 근육을 종합적으로 강화하는 프로그램입니다.',
    categories: ['코어', '근력'],
    gradient: 'linear-gradient(145deg, #2e3a4e 0%, #1e2c3e 50%, #12202e 100%)',
    duration: 30,
    unit: '분',
    difficulty: '중급',
    youtubeUrl: '',
    media: []
  },
  {
    id: 7,
    title: '스쿼트 심화 과정',
    description: '다양한 스쿼트 변형으로 하체 근력과 안정성을 끌어올리는 프로그램입니다.',
    categories: ['근력', '하체'],
    gradient: 'linear-gradient(145deg, #5c4a3a 0%, #4a3828 50%, #38281a 100%)',
    duration: 35,
    unit: '분',
    difficulty: '중급',
    youtubeUrl: 'https://youtube.com/watch?v=example2',
    media: [
      { type: 'image', placeholder: '사진1' },
      { type: 'image', placeholder: '사진2' },
      { type: 'video', placeholder: '영상1' }
    ]
  },
  {
    id: 8,
    title: '전신 유연성 스트레칭',
    description: '전신의 주요 근육군을 스트레칭하여 유연성을 향상시키는 프로그램입니다.',
    categories: ['유연성'],
    gradient: 'linear-gradient(145deg, #a8c8e8 0%, #88a8c8 50%, #6888a8 100%)',
    duration: 25,
    unit: '분',
    difficulty: '초급',
    youtubeUrl: '',
    media: []
  }
]

// 매뉴얼 ID로 데이터 조회
const manual = computed(() => {
  const id = Number(route.params.id)
  return manuals.find(m => m.id === id) || null
})
</script>

<style src="./ManualDetailView.css" scoped></style>
