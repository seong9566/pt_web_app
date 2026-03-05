<!-- 트레이너 프로필 수정 페이지. 이름, 전화번호, 전문 분야, 소개글 편집 → DB 저장 -->
<template>
  <div class="trainer-profile-edit">
    <div class="trainer-profile-edit__header">
      <button class="trainer-profile-edit__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h2 class="trainer-profile-edit__nav-title">프로필 수정</h2>
      <div style="width: 40px" />
    </div>

    <div class="trainer-profile-edit__content">
      <div class="trainer-profile-edit__photo-wrap" @click="triggerFileInput">
        <div class="trainer-profile-edit__photo">
          <img
            :src="avatarPreview || auth.profile?.photo_url || personIcon"
            alt="프로필 사진"
            :style="(avatarPreview || auth.profile?.photo_url)
              ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }
              : { width: '32px', height: '32px' }"
          />
        </div>
        <button class="trainer-profile-edit__photo-btn" type="button" @click.stop="triggerFileInput">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>
      <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileSelect" />

      <section class="trainer-profile-edit__section">
        <h3 class="trainer-profile-edit__section-title">기본 정보</h3>
        <div class="trainer-profile-edit__fields">
          <div class="trainer-profile-edit__field">
            <label class="trainer-profile-edit__label">이름 <span class="trainer-profile-edit__required">*</span></label>
            <AppInput v-model="form.name" placeholder="이름을 입력해주세요" />
            <p v-if="nameError" class="trainer-profile-edit__field-error">{{ nameError }}</p>
          </div>
          <div class="trainer-profile-edit__field">
            <label class="trainer-profile-edit__label">전화번호</label>
            <AppInput v-model="form.phone" placeholder="010-0000-0000" type="tel" />
          </div>
        </div>
      </section>

      <section class="trainer-profile-edit__section">
        <h3 class="trainer-profile-edit__section-title">전문 분야</h3>
        <div class="trainer-profile-edit__chips">
          <button
            v-for="spec in specialtyOptions"
            :key="spec.id"
            class="spec-chip"
            :class="{ 'spec-chip--selected': form.specialties.includes(spec.id) }"
            @click="toggleSpecialty(spec.id)"
            type="button"
          >
            {{ spec.label }}
          </button>
        </div>
      </section>

      <section class="trainer-profile-edit__section">
        <h3 class="trainer-profile-edit__section-title">소개글</h3>
        <textarea
          class="trainer-profile-edit__textarea"
          v-model="form.bio"
          placeholder="회원들에게 자신을 소개해 주세요."
          rows="4"
        />
      </section>

      <div v-if="profileError" class="trainer-profile-edit__error">{{ profileError }}</div>

      <div style="height: 100px" />
    </div>

    <div class="trainer-profile-edit__footer">
      <AppButton @click="handleSave" :disabled="uploading">
        {{ uploading ? '저장 중...' : '저장' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfile'
import AppInput from '@/components/AppInput.vue'
import AppButton from '@/components/AppButton.vue'
import personIcon from '@/assets/icons/person.svg'

const router = useRouter()
const auth = useAuthStore()
const { uploading, error: profileError, uploadAvatar, updateProfilePhoto, updateTrainerProfile } = useProfile()

const fileInput = ref(null)
const avatarPreview = ref(null)
const nameError = ref('')

const specialtyOptions = [
  { id: 'rehab', label: '재활' },
  { id: 'strength', label: '근력' },
  { id: 'diet', label: '다이어트' },
  { id: 'sports', label: '스포츠' },
  { id: 'core', label: '코어' },
  { id: 'flexibility', label: '유연성' },
]

const form = ref({
  name: '',
  phone: '',
  specialties: [],
  bio: '',
})

onMounted(() => {
  form.value.name = auth.profile?.name ?? ''
  form.value.phone = auth.profile?.phone ?? ''
  form.value.specialties = [...(auth.profile?.trainer_profiles?.specialties ?? [])]
  form.value.bio = auth.profile?.trainer_profiles?.bio ?? ''
})

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  avatarPreview.value = URL.createObjectURL(file)
  const url = await uploadAvatar(file)
  if (url) {
    await updateProfilePhoto(url)
  }
}

function toggleSpecialty(id) {
  const idx = form.value.specialties.indexOf(id)
  if (idx === -1) form.value.specialties.push(id)
  else form.value.specialties.splice(idx, 1)
}

async function handleSave() {
  nameError.value = ''
  if (!form.value.name.trim()) {
    nameError.value = '이름을 입력해주세요.'
    return
  }
  const success = await updateTrainerProfile(form.value.name, form.value.specialties, form.value.bio, form.value.phone || null)
  if (success) {
    router.back()
  }
}
</script>

<style src="./TrainerProfileEditView.css" scoped></style>
