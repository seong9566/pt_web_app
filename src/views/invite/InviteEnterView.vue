<template>
  <div class="invite-enter">
    <div class="invite-enter__header">
      <button class="invite-enter__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="invite-enter__title">초대 코드 입력</h2>
      <div style="width: 40px;" />
    </div>
    <div class="invite-enter__content">
      <div class="invite-enter__icon-box">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="16" cy="28" r="8" stroke="#007AFF" stroke-width="2.5"/><circle cx="40" cy="28" r="8" stroke="#007AFF" stroke-width="2.5"/><path d="M24 28H32" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round"/><path d="M28 22C28 22 32 25 32 28C32 31 28 34 28 34" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="invite-enter__desc">
        <p class="invite-enter__desc-main">트레이너에게 받은 코드를 입력해주세요.</p>
        <p class="invite-enter__desc-sub">담당 트레이너와 즉시 연결됩니다.</p>
      </div>
      <div class="invite-enter__code-inputs">
        <input v-for="(_, idx) in codeDigits" :key="idx" class="invite-enter__code-box" type="text" maxlength="1" :value="codeDigits[idx]" placeholder="-" @input="handleInput(idx, $event)" @keydown.backspace="handleBackspace(idx, $event)" :ref="el => { if (el) inputRefs[idx] = el }" />
      </div>
      <button class="invite-enter__check-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        코드 확인
      </button>
    </div>
    <div class="invite-enter__footer">
      <button class="invite-enter__confirm-btn">연결 확정</button>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const codeDigits = ref(['', '', '', '', '', ''])
const inputRefs = ref([])
function handleInput(idx, event) {
  const val = event.target.value.slice(-1).toUpperCase()
  codeDigits.value[idx] = val
  if (val && idx < 5) inputRefs.value[idx + 1]?.focus()
}
function handleBackspace(idx, event) {
  if (!codeDigits.value[idx] && idx > 0) inputRefs.value[idx - 1]?.focus()
}
</script>
<style scoped>
.invite-enter { min-height: 100vh; background-color: var(--color-white); display: flex; flex-direction: column; padding-bottom: calc(var(--nav-height) + var(--btn-height) + 32px); }
.invite-enter__header { display: flex; align-items: center; justify-content: space-between; padding: 16px var(--side-margin); border-bottom: 1px solid var(--color-gray-200); }
.invite-enter__back { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; border-radius: 50%; }
.invite-enter__back:active { background-color: var(--color-gray-100); }
.invite-enter__title { font-size: var(--fs-title); font-weight: var(--fw-title); color: var(--color-gray-900); margin: 0; }
.invite-enter__content { flex: 1; padding: 40px var(--side-margin) 0; display: flex; flex-direction: column; align-items: center; gap: 28px; }
.invite-enter__icon-box { width: 100px; height: 100px; background-color: var(--color-blue-light); border-radius: var(--radius-large); display: flex; align-items: center; justify-content: center; }
.invite-enter__desc { text-align: center; display: flex; flex-direction: column; gap: 6px; }
.invite-enter__desc-main { font-size: var(--fs-body1); color: var(--color-gray-900); margin: 0; }
.invite-enter__desc-sub { font-size: var(--fs-body2); color: var(--color-gray-600); margin: 0; }
.invite-enter__code-inputs { display: flex; gap: 8px; }
.invite-enter__code-box { width: 44px; height: 52px; border: 1.5px solid var(--color-gray-200); border-radius: var(--radius-small); background-color: var(--color-white); text-align: center; font-size: var(--fs-title); font-weight: 700; color: var(--color-gray-900); outline: none; font-family: inherit; }
.invite-enter__code-box:focus { border-color: var(--color-blue-primary); box-shadow: 0 0 0 2px var(--color-blue-light); }
.invite-enter__code-box::placeholder { color: var(--color-gray-200); font-weight: 400; }
.invite-enter__check-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background-color: var(--color-gray-100); border: none; border-radius: 100px; font-size: var(--fs-body2); color: var(--color-gray-600); cursor: pointer; font-family: inherit; }
.invite-enter__footer { position: fixed; bottom: var(--nav-height); left: 50%; transform: translateX(-50%); width: 100%; max-width: var(--app-max-width); padding: 16px var(--side-margin); background-color: var(--color-white); border-top: 1px solid var(--color-gray-200); }
.invite-enter__confirm-btn { width: 100%; height: var(--btn-height); background-color: var(--color-blue-primary); color: var(--color-white); border: none; border-radius: var(--radius-medium); font-size: var(--fs-body1); font-weight: var(--fw-body1-bold); cursor: pointer; font-family: inherit; box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3); }
.invite-enter__confirm-btn:active { opacity: 0.85; }
</style>
