<!-- 트레이너 프로필 읽기전용 뷰. 이름, 사진, 전문 분야, 소개글, 연결 회원 수 표시 -->
<template>
  <div class="trainer-profile-ro">

    <!-- ── 헤더 ── -->
    <div class="trainer-profile-ro__header">
      <button class="trainer-profile-ro__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h2 class="trainer-profile-ro__nav-title">내 프로필</h2>
      <button class="trainer-profile-ro__edit-btn" @click="router.push({ name: 'trainer-profile-edit' })">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>

    <div class="trainer-profile-ro__content">

      <!-- ── 프로필 섹션 ── -->
      <div class="trainer-profile-ro__profile-wrap">
        <div class="trainer-profile-ro__photo">
          <img
            :src="auth.profile?.photo_url || personIcon"
            alt="프로필 사진"
            :style="auth.profile?.photo_url
              ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }
              : { width: '40px', height: '40px' }"
          />
        </div>
        <div class="trainer-profile-ro__name-wrap">
          <p class="trainer-profile-ro__name">{{ auth.profile?.name || '이름 없음' }}</p>
          <p class="trainer-profile-ro__member-count">연결 회원 {{ memberCount }}명</p>
        </div>
      </div>

      <!-- ── 전문 분야 섹션 ── -->
      <section class="trainer-profile-ro__section">
        <h3 class="trainer-profile-ro__section-title">전문 분야</h3>
        <div v-if="displayedSpecialties.length > 0" class="trainer-profile-ro__chips">
          <span
            v-for="spec in displayedSpecialties"
            :key="spec.id"
            class="trainer-profile-ro__chip"
          >
            {{ spec.label }}
          </span>
        </div>
        <p v-else class="trainer-profile-ro__empty">전문 분야를 아직 설정하지 않았습니다.</p>
      </section>

      <!-- ── 소개글 섹션 ── -->
      <section class="trainer-profile-ro__section">
        <h3 class="trainer-profile-ro__section-title">소개글</h3>
        <p v-if="bio" class="trainer-profile-ro__bio">{{ bio }}</p>
        <p v-else class="trainer-profile-ro__empty">소개글을 아직 작성하지 않았습니다.</p>
      </section>

      <div style="height: 40px" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMembers } from '@/composables/useMembers'
import personIcon from '@/assets/icons/person.svg'

const router = useRouter()
const auth = useAuthStore()
const { members, fetchMembers } = useMembers()

const specialtyOptions = [
  { id: 'rehab', label: '재활' },
  { id: 'strength', label: '근력' },
  { id: 'diet', label: '다이어트' },
  { id: 'sports', label: '스포츠' },
  { id: 'core', label: '코어' },
  { id: 'flexibility', label: '유연성' },
]

const memberCount = computed(() => members.value.length)

const displayedSpecialties = computed(() => {
  const selected = auth.profile?.trainer_profiles?.specialties ?? []
  return specialtyOptions.filter(opt => selected.includes(opt.id))
})

const bio = computed(() => auth.profile?.trainer_profiles?.bio ?? '')

onMounted(async () => {
  await fetchMembers()
})
</script>

<style src="./TrainerProfileReadOnlyView.css" scoped></style>
