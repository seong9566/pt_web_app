<!-- [미구현] 수납 작성 페이지. 결제 금액/날짜/방법 입력 (목 데이터) -->
<template>
  <div class="pay-write">

    <!-- ── Header ── -->
    <div class="pay-write__header">
      <button class="pay-write__back" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="pay-write__title">수납 기록 추가</h1>
      <button
        class="pay-write__save"
        :disabled="!canSave"
        @click="handleSave"
      >
        저장
      </button>
    </div>

    <!-- ── Body (scrollable) ── -->
    <div class="pay-write__body">

      <!-- 결제 항목 -->
      <section class="pay-write__section">
        <label class="pay-write__label">결제 항목</label>
        <div class="pay-write__chips">
          <button
            v-for="item in sessionOptions"
            :key="item"
            class="pay-write__chip"
            :class="{ 'pay-write__chip--active': selectedItem === item }"
            @click="selectedItem = item"
          >
            {{ item }}
          </button>
        </div>
      </section>

      <!-- PT 횟수 (직접 입력) -->
      <section class="pay-write__section">
        <label class="pay-write__label">PT 횟수</label>
        <div class="pay-write__input-wrap" :class="{ 'pay-write__input-wrap--disabled': isPackSelected }">
          <input
            v-model.number="sessionCount"
            class="pay-write__input"
            type="number"
            inputmode="numeric"
            placeholder="횟수를 입력하세요"
            min="1"
            :disabled="isPackSelected"
          />
          <span class="pay-write__input-suffix">회</span>
        </div>
      </section>

      <!-- 결제 금액 -->
      <section class="pay-write__section">
        <label class="pay-write__label">결제 금액</label>
        <div class="pay-write__input-wrap">
          <span class="pay-write__input-prefix">₩</span>
          <input
            v-model="amountDisplay"
            class="pay-write__input pay-write__input--with-prefix"
            type="text"
            inputmode="numeric"
            placeholder="금액을 입력하세요"
            @input="onAmountInput"
          />
        </div>
      </section>

      <!-- 결제 날짜 -->
      <section class="pay-write__section">
        <label class="pay-write__label">결제 날짜</label>
        <button class="pay-write__field-btn" @click="showDateSheet = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
            <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 3V7M16 3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="pay-write__field-text">{{ formattedDate }}</span>
          <svg class="pay-write__field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>

      <!-- 결제 방법 -->
      <section class="pay-write__section">
        <label class="pay-write__label">결제 방법</label>
        <div class="pay-write__chips">
          <button
            v-for="method in paymentMethods"
            :key="method"
            class="pay-write__chip"
            :class="{ 'pay-write__chip--active': selectedMethod === method }"
            @click="selectedMethod = method"
          >
            {{ method }}
          </button>
        </div>
      </section>

      <!-- 메모 -->
      <section class="pay-write__section">
        <label class="pay-write__label">메모 <span class="pay-write__label-hint">(선택)</span></label>
        <textarea
          class="pay-write__textarea"
          v-model="memo"
          placeholder="할인 사유, 특이사항 등을 기록하세요..."
        />
      </section>

    </div>

    <!-- ── Footer ── -->
    <div class="pay-write__footer">
      <button
        class="pay-write__submit"
        :disabled="!canSave"
        @click="handleSave"
      >
        수납 기록 저장하기
      </button>
    </div>

    <!-- ── Date Bottom Sheet ── -->
    <AppBottomSheet v-model="showDateSheet" title="날짜 선택">
      <AppCalendar :model-value="selectedDate" @update:model-value="onDateSelect" />
    </AppBottomSheet>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBottomSheet from '@/components/AppBottomSheet.vue'
import AppCalendar from '@/components/AppCalendar.vue'

const router = useRouter()
const route = useRoute()
const memberId = route.params.id

const pad = (n) => String(n).padStart(2, '0')

// ── 결제 항목 ──
const sessionOptions = ['PT 10회', 'PT 20회', 'PT 30회', '직접 입력']
const selectedItem = ref('')

// ── PT 횟수 ──
const sessionCount = ref(null)

const isPackSelected = computed(() => {
  return selectedItem.value !== '' && selectedItem.value !== '직접 입력'
})

watch(selectedItem, (newVal) => {
  if (newVal === 'PT 10회') {
    sessionCount.value = 10
  } else if (newVal === 'PT 20회') {
    sessionCount.value = 20
  } else if (newVal === 'PT 30회') {
    sessionCount.value = 30
  } else if (newVal === '직접 입력') {
    sessionCount.value = null
  }
})

// ── 결제 금액 ──
const amountRaw = ref(0)
const amountDisplay = ref('')

function onAmountInput(e) {
  const raw = e.target.value.replace(/[^0-9]/g, '')
  const num = Number(raw)
  amountRaw.value = num
  amountDisplay.value = num ? num.toLocaleString() : ''
}

// ── 결제 날짜 ──
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

// ── 결제 방법 ──
const paymentMethods = ['카드 결제', '현금', '계좌이체']
const selectedMethod = ref('')

// ── 메모 ──
const memo = ref('')

// ── Save ──
const canSave = computed(() => {
  return selectedItem.value && sessionCount.value > 0 && amountRaw.value > 0 && selectedMethod.value
})

function handleSave() {
  if (!canSave.value) return

  const payment = {
    memberId,
    item: selectedItem.value,
    sessionCount: sessionCount.value,
    amount: amountRaw.value,
    date: selectedDate.value,
    method: selectedMethod.value,
    memo: memo.value.trim(),
  }

  console.log('수납 기록 저장:', payment)
  alert('수납 기록이 저장되었습니다.')
  router.back()
}
</script>

<style src="./PaymentWriteView.css" scoped></style>
