<!-- 회원 프로필 수정 페이지. 이름, 전화번호, 신체 정보, 운동 목표 편집 → DB 저장 -->
<template>
  <div class="member-profile-edit">
    <div class="member-profile-edit__header">
      <button class="member-profile-edit__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h2 class="member-profile-edit__nav-title">프로필 수정</h2>
      <div style="width: 40px" />
    </div>

    <div class="member-profile-edit__content">
      <div class="member-profile-edit__photo-wrap" @click="triggerFileInput">
        <div class="member-profile-edit__photo">
          <img
            :src="avatarPreview || auth.profile?.photo_url || personIcon"
            alt="프로필 사진"
            :style="(avatarPreview || auth.profile?.photo_url)
              ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }
              : { width: '32px', height: '32px' }"
          />
        </div>
        <button class="member-profile-edit__photo-btn" type="button" @click.stop="triggerFileInput">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>
      <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileSelect" />

      <section class="member-profile-edit__section">
        <h3 class="member-profile-edit__section-title">기본 정보</h3>
        <div class="member-profile-edit__fields">
          <div class="member-profile-edit__field">
            <label class="member-profile-edit__label">이름 <span class="member-profile-edit__required">*</span></label>
            <AppInput v-model="form.name" placeholder="이름을 입력해주세요" />
            <p v-if="nameError" class="member-profile-edit__field-error">{{ nameError }}</p>
          </div>
          <div class="member-profile-edit__field">
            <label class="member-profile-edit__label">전화번호</label>
            <AppInput v-model="form.phone" placeholder="010-0000-0000" type="tel" />
          </div>
        </div>
      </section>

      <section class="member-profile-edit__section">
        <h3 class="member-profile-edit__section-title">신체 정보</h3>
        <div class="member-profile-edit__body-row">
          <div class="member-profile-edit__body-field">
            <label class="member-profile-edit__label">나이</label>
            <div class="body-input-wrap">
              <input
                class="body-input"
                type="number"
                v-model="form.age"
                placeholder="0"
              /><span class="body-input__unit">세</span>
            </div>
          </div>
          <div class="member-profile-edit__body-field">
            <label class="member-profile-edit__label">키</label>
            <div class="body-input-wrap">
              <input
                class="body-input"
                type="number"
                v-model="form.height"
                placeholder="0"
              /><span class="body-input__unit">cm</span>
            </div>
          </div>
          <div class="member-profile-edit__body-field">
            <label class="member-profile-edit__label">몸무게</label>
            <div class="body-input-wrap">
              <input
                class="body-input"
                type="number"
                v-model="form.weight"
                placeholder="0"
              /><span class="body-input__unit">kg</span>
            </div>
          </div>
        </div>
      </section>

      <section class="member-profile-edit__section">
        <h3 class="member-profile-edit__section-title">성별</h3>
        <div class="member-profile-edit__chips">
          <button
            v-for="g in genderOptions"
            :key="g.id"
            class="goal-chip"
            :class="{ 'goal-chip--selected': form.gender === g.id }"
            @click="form.gender = form.gender === g.id ? '' : g.id"
            type="button"
          >
            {{ g.label }}
          </button>
        </div>
      </section>

      <section class="member-profile-edit__section">
        <h3 class="member-profile-edit__section-title">운동 목표</h3>
        <div class="member-profile-edit__chips">
          <button
            v-for="goal in goalOptions"
            :key="goal.id"
            class="goal-chip"
            :class="{ 'goal-chip--selected': form.goals.includes(goal.id) }"
            @click="toggleGoal(goal.id)"
            type="button"
          >
            {{ goal.label }}
          </button>
        </div>
      </section>

      <div v-if="profileError" class="member-profile-edit__error">{{ profileError }}</div>

      <div style="height: 100px" />
    </div>

    <div class="member-profile-edit__footer">
      <AppButton @click="handleSave" :disabled="uploading">
        {{ uploading ? '저장 중...' : '저장' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfile'
import { useToast } from '@/composables/useToast'
import AppInput from '@/components/AppInput.vue'
import AppButton from '@/components/AppButton.vue'
import personIcon from '@/assets/icons/person.svg'

const router = useRouter()
const auth = useAuthStore()
const { uploading, error: profileError, uploadAvatar, updateProfilePhoto, updateMemberProfile } = useProfile()
const { showToast } = useToast()

const fileInput = ref(null)
const avatarPreview = ref(null)
const nameError = ref('')

const genderOptions = [
  { id: 'male', label: '남성' },
  { id: 'female', label: '여성' },
]

const goalOptions = [
  { id: 'weight-loss', label: '체중감량' },
  { id: 'muscle-gain', label: '근력강화' },
  { id: 'rehab', label: '재활' },
  { id: 'endurance', label: '체력향상' },
  { id: 'flexibility', label: '유연성' },
  { id: 'stress-relief', label: '스트레스해소' },
]

const form = ref({
  name: '',
  phone: '',
  age: '',
  height: '',
  weight: '',
  gender: '',
  goals: [],
})

onMounted(() => {
  form.value.name = auth.profile?.name ?? ''
  form.value.phone = auth.profile?.phone ?? ''
  form.value.age = auth.profile?.member_profiles?.age ?? ''
  form.value.height = auth.profile?.member_profiles?.height ?? ''
  form.value.weight = auth.profile?.member_profiles?.weight ?? ''
  form.value.gender = auth.profile?.member_profiles?.gender ?? ''
  form.value.goals = [...(auth.profile?.member_profiles?.goals ?? [])]
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

function toggleGoal(id) {
  const idx = form.value.goals.indexOf(id)
  if (idx === -1) form.value.goals.push(id)
  else form.value.goals.splice(idx, 1)
}

async function handleSave() {
  nameError.value = ''
  if (!form.value.name.trim()) {
    nameError.value = '이름을 입력해주세요.'
    return
  }
  const success = await updateMemberProfile(
    form.value.name,
    parseInt(form.value.age) || null,
    parseFloat(form.value.height) || null,
    parseFloat(form.value.weight) || null,
    form.value.goals,
    null,
    form.value.gender || null,
  )
  if (success) {
    router.back()
  }
}

watch(profileError, (e) => { if (e) showToast(e, 'error') })
</script>

<style src="./MemberProfileEditView.css" scoped></style>
