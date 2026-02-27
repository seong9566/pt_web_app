<template>
  <div class="invite-enter">
    <div class="invite-enter__header">
      <button class="invite-enter__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <h2 class="invite-enter__title">초대 코드 입력</h2>
      <div style="width: 40px" />
    </div>
    <div class="invite-enter__content">
      <div class="invite-enter__icon-box">
        <img src="@/assets/icons/link_invite.svg" alt="invite" width="56" height="56" />
      </div>
      <div class="invite-enter__desc">
        <p class="invite-enter__desc-main">
          트레이너에게 받은 코드를 입력해주세요.
        </p>
        <p class="invite-enter__desc-sub">담당 트레이너와 즉시 연결됩니다.</p>
      </div>
      <div class="invite-enter__code-inputs">
        <input
          v-for="(_, idx) in codeDigits"
          :key="idx"
          class="invite-enter__code-box"
          type="text"
          maxlength="1"
          :value="codeDigits[idx]"
          placeholder="-"
          @input="handleInput(idx, $event)"
          @keydown.backspace="handleBackspace(idx, $event)"
          :ref="
            (el) => {
              if (el) inputRefs[idx] = el;
            }
          "
        />
      </div>
      <button class="invite-enter__check-btn">
        <img src="@/assets/icons/code_copy.svg" alt="check" width="16" height="16" />
        코드 확인
      </button>
    </div>
    <div class="invite-enter__footer">
      <button class="invite-enter__confirm-btn" @click="handleConfirm">
        연결 확정
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const codeDigits = ref(["", "", "", "", "", ""]);
const inputRefs = ref([]);
function handleInput(idx, event) {
  const val = event.target.value.slice(-1).toUpperCase();
  codeDigits.value[idx] = val;
  if (val && idx < 5) inputRefs.value[idx + 1]?.focus();
}
function handleBackspace(idx, event) {
  if (!codeDigits.value[idx] && idx > 0) inputRefs.value[idx - 1]?.focus();
}
function handleConfirm() {
  router.push({
    path: "/onboarding/member-profile",
    query: { fromInvite: "true" },
  });
}
</script>
<style src="./InviteEnterView.css" scoped></style>
