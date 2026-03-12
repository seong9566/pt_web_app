<!-- 회원 프로필 생성 페이지. 이름, 나이, 키, 몸무게, 목표 등 입력 → DB 저장 -->
<template>
  <div class="member-profile">
    <div class="member-profile__nav">
      <button class="member-profile__back" @click="router.back()" style="color: var(--color-gray-900);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="member-profile__nav-title">프로필 입력</h2>
      <div style="width: 40px" />
    </div>
    <div class="member-profile__content">
      <div class="member-profile__photo-wrap" @click="triggerFileInput">
        <div class="member-profile__photo">
          <img :src="avatarPreview || personIcon" alt="avatar" width="32" height="32" :style="avatarPreview ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' } : {}" />
        </div>
        <button class="member-profile__photo-edit" type="button">
          <img src="@/assets/icons/pencil.svg" alt="edit" width="14" height="14" />
        </button>
        <p class="member-profile__photo-label">프로필 사진 등록</p>
      </div>
      <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileSelect" />
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">기본 정보</h3>
        <div class="member-profile__fields">
          <div class="member-profile__field">
            <label class="member-profile__label">이름 <span style="color: var(--color-red);">*</span></label>
            <AppInput v-model="form.name" placeholder="홍길동" @blur="validateName" :class="{ 'form-field--error': nameError }" />
            <p v-if="nameError" class="form-error-text">{{ nameError }}</p>
          </div>
          <div class="member-profile__field">
            <label class="member-profile__label">연락처</label>
            <AppInput
              v-model="form.phone"
              placeholder="010-0000-0000"
              type="tel"
              @input="handlePhoneInput"
              @blur="validatePhone"
              :class="{ 'form-field--error': phoneError }"
            />
            <p v-if="phoneError" class="form-error-text">{{ phoneError }}</p>
          </div>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">신체 정보</h3>
        <div class="member-profile__body-row">
          <div class="member-profile__body-field">
            <label class="member-profile__label">나이</label>
            <div class="body-input-wrap">
              <input
                :class="['body-input', { 'form-field--error': ageError }]"
                type="number"
                v-model="form.age"
                placeholder="0"
                @blur="validateAge"
              /><span class="body-input__unit">세</span>
            </div>
            <p v-if="ageError" class="form-error-text">{{ ageError }}</p>
          </div>
          <div class="member-profile__body-field">
            <label class="member-profile__label">키</label>
            <div class="body-input-wrap">
              <input
                :class="['body-input', { 'form-field--error': heightError }]"
                type="number"
                v-model="form.height"
                placeholder="0"
                @blur="validateHeight"
              /><span class="body-input__unit">cm</span>
            </div>
            <p v-if="heightError" class="form-error-text">{{ heightError }}</p>
          </div>
          <div class="member-profile__body-field">
            <label class="member-profile__label">몸무게</label>
            <div class="body-input-wrap">
              <input
                :class="['body-input', { 'form-field--error': weightError }]"
                type="number"
                v-model="form.weight"
                placeholder="0"
                @blur="validateWeight"
              /><span class="body-input__unit">kg</span>
            </div>
            <p v-if="weightError" class="form-error-text">{{ weightError }}</p>
          </div>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">성별</h3>
        <div class="member-profile__chips">
          <button
            v-for="g in genderOptions"
            :key="g.id"
            class="goal-chip"
            :class="{ 'goal-chip--selected': form.gender === g.id }"
            @click="form.gender = form.gender === g.id ? '' : g.id"
          >
            {{ g.label }}
          </button>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">운동 목표</h3>
        <div class="member-profile__chips">
          <button
            v-for="goal in goals"
            :key="goal.id"
            class="goal-chip"
            :class="{ 'goal-chip--selected': selectedGoals.includes(goal.id) }"
            @click="toggleGoal(goal.id)"
          >
            {{ goal.label }}
          </button>
        </div>
      </section>
      <section class="member-profile__section">
        <h3 class="member-profile__section-title">부상 및 특이사항</h3>
        <textarea
          class="member-profile__textarea"
          v-model="form.notes"
          placeholder="허리 디스크, 관절 통증 등 주의해야 할 사항을 입력해주세요."
          rows="4"
        />
      </section>
      <div style="height: 100px" />
    </div>
    <p v-if="errorMsg" class="member-profile__error" style="color: var(--color-red); font-size: var(--fs-body2); text-align: center; margin-bottom: 12px;">{{ errorMsg }}</p>
    <div class="member-profile__footer">
      <AppButton @click="handleComplete" :disabled="isLoading">{{ isLoading ? '저장 중...' : '작성 완료 ✓' }}</AppButton>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppInput from "@/components/AppInput.vue";
import AppButton from "@/components/AppButton.vue";
import { useAuthStore } from '@/stores/auth'
import { useProfile } from '@/composables/useProfile'
import { useInvite } from '@/composables/useInvite'
import { useToast } from '@/composables/useToast'
import { useReservationsStore } from '@/stores/reservations'
import { usePtSessionsStore } from '@/stores/ptSessions'
import { useChatBadgeStore } from '@/stores/chatBadge'
import personIcon from '@/assets/icons/person.svg'
import { isValidPhone, formatPhone, isValidAge, isValidHeight, isValidWeight } from '@/utils/validators'
const router = useRouter();
const auth = useAuthStore()
const { uploading, error: uploadError, uploadAvatar, saveMemberProfileBasic, saveMemberProfileDetails } = useProfile()
const { redeemInviteCode } = useInvite()
const { showToast, showSuccess } = useToast()
const reservationsStore = useReservationsStore()
const ptSessionsStore = usePtSessionsStore()
const chatBadgeStore = useChatBadgeStore()
const fileInput = ref(null)
const avatarPreview = ref(null)
const avatarUrl = ref(null)
const form = ref({
  name: "",
  phone: "",
  age: "",
  height: "",
  weight: "",
  gender: "",
  notes: "",
});
const genderOptions = [
  { id: 'male', label: '남성' },
  { id: 'female', label: '여성' },
];
const goals = [
  { id: "weight-loss", label: "체중 감량" },
  { id: "muscle-gain", label: "근력 증가" },
  { id: "endurance", label: "체력 증진" },
  { id: "body-profile", label: "바디 프로필" },
];
const selectedGoals = ref([]);
const isLoading = ref(false)
const errorMsg = ref('')
const nameError = ref('')
const phoneError = ref('')
const ageError = ref('')
const heightError = ref('')
const weightError = ref('')
function validateName() {
  if (!form.value.name.trim()) {
    nameError.value = '이름을 입력해주세요'
  } else {
    nameError.value = ''
  }
}

function validatePhone() {
  if (form.value.phone && !isValidPhone(form.value.phone)) {
    phoneError.value = '올바른 전화번호 형식이 아닙니다 (010-0000-0000)'
  } else {
    phoneError.value = ''
  }
}

function handlePhoneInput() {
  form.value.phone = formatPhone(form.value.phone)
}

function validateAge() {
  if (form.value.age && !isValidAge(form.value.age)) {
    ageError.value = '14세 ~ 100세 범위의 정수를 입력해주세요'
  } else {
    ageError.value = ''
  }
}

function validateHeight() {
  if (form.value.height && !isValidHeight(form.value.height)) {
    heightError.value = '100cm ~ 250cm 범위로 입력해주세요'
  } else {
    heightError.value = ''
  }
}

function validateWeight() {
  if (form.value.weight && !isValidWeight(form.value.weight)) {
    weightError.value = '20kg ~ 300kg 범위로 입력해주세요'
  } else {
    weightError.value = ''
  }
}

/** 목표 선택 토글 처리 */
function toggleGoal(id) {
  const idx = selectedGoals.value.indexOf(id);
  if (idx === -1) selectedGoals.value.push(id);
  else selectedGoals.value.splice(idx, 1);
}

/** 프로필 사진 선택 단추 단추 */
function triggerFileInput() {
  fileInput.value?.click()
}

/** 프로필 사진 업로드 및 리뷰 생성 */
async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  avatarPreview.value = URL.createObjectURL(file)
  const url = await uploadAvatar(file)
  if (url) { avatarUrl.value = url }
}

/** 회원 프로필 저장 및 다음 단계 진행 */
async function handleComplete() {
   validateName()
   validatePhone()
   validateAge()
   validateHeight()
   validateWeight()
   if (nameError.value || phoneError.value || ageError.value || heightError.value || weightError.value) {
     return
   }

   isLoading.value = true
   errorMsg.value = ''

   const basicSuccess = await saveMemberProfileBasic(form.value.name, form.value.phone, avatarUrl.value)
   if (!basicSuccess) {
     errorMsg.value = '프로필 저장에 실패했습니다. 다시 시도해주세요.'
     isLoading.value = false
     return
   }

   const detailsSuccess = await saveMemberProfileDetails(
     form.value.age,
     form.value.height,
     form.value.weight,
     form.value.gender,
     selectedGoals.value,
     form.value.notes
   )
   if (!detailsSuccess) {
     errorMsg.value = '회원 정보 저장에 실패했습니다. 다시 시도해주세요.'
     isLoading.value = false
     return
   }

    await auth.fetchProfile()
    isLoading.value = false

    showSuccess('프로필이 저장되었습니다')
    setTimeout(() => {
      const pendingCode = localStorage.getItem('pending_invite_code')
      if (pendingCode) {
        redeemInviteCode(pendingCode).then((result) => {
          if (result) {
            localStorage.removeItem('pending_invite_code')
            reservationsStore.invalidate()
            ptSessionsStore.invalidate()
            chatBadgeStore.loadUnreadCount(true)
          }
          router.replace('/member/home')
        })
      } else {
         router.replace('/member/home')
       }
    }, 800)
}

watch(uploadError, (e) => { if (e) showToast(e, 'error') })
</script>
<style src="./MemberProfileView.css" scoped></style>
