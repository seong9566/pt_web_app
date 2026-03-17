/**
 * 회원 주간 가용 시간 캐시 스토어 (Pinia)
 *
 * 트레이너가 연결된 회원들의 주간 가용 시간을 Map 기반으로 캐싱.
 * TTL: 10분 (600,000ms). per-key 캐시 구조.
 *
 * 캐시 key 패턴:
 *   ${weekStart}  — 주 시작일 (YYYY-MM-DD)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAvailabilityStore = defineStore('availability', () => {
  const _cache = ref(new Map())
  const _dirty = ref(false)

  /**
   * 캐시 항목이 만료되었는지 확인
   * @param {string} key 캐시 키 (weekStart)
   * @param {number} ttlMs TTL (ms). 기본 10분.
   */
  function _isStale(key, ttlMs = 600000) {
    if (_dirty.value) return true
    const entry = _cache.value.get(key)
    if (!entry) return true
    return Date.now() - entry.lastFetchedAt > ttlMs
  }

  /**
   * 트레이너 기준 연결된 active 회원 전체의 주간 가용 시간 조회
   * 미등록 회원은 available_slots=null로 포함됨.
   *
   * @param {string} trainerId - 트레이너 사용자 ID
   * @param {string} weekStart - 주 시작일 YYYY-MM-DD (월요일)
   * @param {boolean} force - true면 TTL/dirty 무관하게 강제 재조회
   * @returns {Array<{member_id, name, photo_url, available_slots, memo, created_at}>}
   */
  async function loadMemberAvailabilities(trainerId, weekStart, force = false) {
    const key = weekStart
    if (!force && !_isStale(key)) return _cache.value.get(key).data

    try {
      // 1단계: 트레이너에 연결된 active 회원 목록 조회
      const { data: members, error: membersError } = await supabase
        .from('trainer_members')
        .select('member_id, profiles!trainer_members_member_id_fkey(name, photo_url)')
        .eq('trainer_id', trainerId)
        .eq('status', 'active')

      if (membersError) throw membersError
      if (!members || members.length === 0) {
        _cache.value.set(key, { data: [], lastFetchedAt: Date.now() })
        _dirty.value = false
        return []
      }

      // 2단계: 해당 주의 가용 시간 레코드 일괄 조회
      const memberIds = members.map((m) => m.member_id)
      const { data: availabilities, error: availError } = await supabase
        .from('member_weekly_availability')
        .select('member_id, available_slots, memo, created_at')
        .in('member_id', memberIds)
        .eq('week_start', weekStart)
        .eq('trainer_id', trainerId)

      if (availError) throw availError

      // 3단계: member_id 기준 가용성 맵 생성 후 회원 목록과 병합
      const availMap = {}
      for (const avail of availabilities ?? []) {
        availMap[avail.member_id] = avail
      }

      const result = members.map((member) => ({
        member_id: member.member_id,
        name: member.profiles?.name ?? '',
        photo_url: member.profiles?.photo_url ?? null,
        available_slots: availMap[member.member_id]?.available_slots ?? null,
        memo: availMap[member.member_id]?.memo ?? null,
        created_at: availMap[member.member_id]?.created_at ?? null,
      }))

      _cache.value.set(key, { data: result, lastFetchedAt: Date.now() })
      _dirty.value = false
      return result
    } catch (e) {
      _cache.value.set(key, { data: [], lastFetchedAt: Date.now() })
      _dirty.value = false
      return []
    }
  }

  /**
   * 캐시 무효화 — 다음 loadMemberAvailabilities 호출 시 강제 재조회
   */
  function invalidate() {
    _dirty.value = true
  }

  /**
   * 상태 전체 초기화
   */
  function $reset() {
    _cache.value = new Map()
    _dirty.value = false
  }

  return {
    _cache,
    _dirty,
    loadMemberAvailabilities,
    invalidate,
    $reset,
  }
})
