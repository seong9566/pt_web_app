/**
 * 수납 기록 관리 컴포저블
 *
 * 트레이너가 회원의 수납 기록을 조회, 생성, 삭제하는 기능 제공.
 * 수납 금액은 0보다 커야 함.
 */

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** 수납 기록 관리 */
export function usePayments() {
  const auth = useAuthStore()

  const payments = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** 총 수납액 계산 */
  const totalAmount = computed(() =>
    payments.value.reduce((sum, p) => sum + p.amount, 0)
  )

  /** 특정 회원의 수납 목록 조회 (최신순) */
  async function fetchPayments(memberId) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .order('payment_date', { ascending: false })

      if (fetchError) throw fetchError

      payments.value = data || []
    } catch (e) {
      error.value = e?.message ?? '수납 기록을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 수납 기록 생성 (금액 > 0 검증) */
  async function createPayment(memberId, amount, paymentDate, memo = null) {
    if (!amount || amount <= 0) {
      error.value = '금액은 0보다 커야 합니다'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          trainer_id: auth.user.id,
          member_id: memberId,
          amount,
          payment_date: paymentDate,
          memo
        })

      if (insertError) throw insertError

      await fetchPayments(memberId)
      return true
    } catch (e) {
      error.value = e?.message ?? '수납 기록 저장에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 수납 기록 수정 */
  async function updatePayment(paymentId, amount, paymentDate, memo = null) {
    if (!amount || amount <= 0) {
      error.value = '금액은 0보다 커야 합니다'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ amount, payment_date: paymentDate, memo })
        .eq('id', paymentId)

      if (updateError) throw updateError

      return true
    } catch (e) {
      error.value = e?.message ?? '수납 기록 수정에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 수납 기록 삭제 */
  async function deletePayment(paymentId) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (deleteError) throw deleteError

      payments.value = payments.value.filter((p) => p.id !== paymentId)
      return true
    } catch (e) {
      error.value = e?.message ?? '수납 기록 삭제에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    payments,
    loading,
    error,
    totalAmount,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
  }
}
