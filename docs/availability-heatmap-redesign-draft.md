# Draft: AvailabilityStatusView 히트맵 리디자인 (B+C안)

## Requirements (confirmed)
- B안: AvailabilityStatusView를 시간대 중심 히트맵/매트릭스 뷰로 전환
- C안: TrainerScheduleView의 빈 슬롯 탭 시 회원 가용성 표시 (이미 구현됨, resolveAvailabilityState 버그만 수정)

## User Decisions
- **그리드 형태**: 7요일 매트릭스 (7열×16행, 480px 타이트하지만 전체 주간 한눈에 파악)
- **미등록 섹션**: 축소형 상단 배너 ("미등록 5명" 카운트 + 탭 시 바텀시트로 개별 리마인더)
- **셀 시각 표현**: 숫자 + 색상 강도 (0명=회색, 1~2명=연파랑, 3~5명=중파랑, 6+명=진파랑)
- **셀 탭 동작**: 바텀시트로 해당 시간대 가능 회원 리스트 표시
- **시간 범위**: 06:00~21:00 (회원 등록 화면과 동일한 16개 슬롯)

## Technical Decisions
- 수정 파일: `AvailabilityStatusView.vue` + `.css` (리디자인), `TrainerScheduleView.vue` (resolveAvailabilityState 버그 수정)
- composable 변경 없음 (기존 fetchMemberAvailabilities 사용)
- 새 파일 생성 없음
- 라우터 변경 없음
- AppBottomSheet 활용 (셀 탭 시 + 미등록 회원 리마인더)

## Research Findings — 핵심 데이터 구조
- `fetchMemberAvailabilities(weekStart)` 반환: `[{ member_id, name, photo_url, available_slots, memo, submitted_at }]`
- `available_slots`: `{ mon: ['06:00', '07:00'], tue: [] }` (실제 시간 문자열)
- `available_slots === null` → 미등록 회원

## Research Findings — 데이터 불일치 버그
- `TrainerScheduleView.vue:338`: `getDayPeriod(timeStr)` → `morning/afternoon/evening`으로 변환 후 비교
- 실제 데이터는 `'06:00'`, `'07:00'` 등 시간 문자열
- `daySlots.includes(getDayPeriod(timeStr))` → 항상 불일치 → 항상 'unavailable'
- 수정: `daySlots.includes(timeStr)` 또는 시간 범위 매칭으로 변경

## Research Findings — AvailabilityStatusView 현재 구조
- 347줄 (vue), 313줄 (css)
- 회원 중심 리스트: 미등록(pendingMembers) / 등록완료(submittedMembers) 분리
- `formatAvailability()`: PERIOD_ORDER 기반 — 역시 데이터 불일치 (리디자인에서 교체됨)
- 주 선택: weekOffset 0/1 (이번 주/다음 주)
- 리마인더: sendReminder(memberId) → createNotification()
- composable: useMembers, useAvailability, useNotifications, useToast, useAuthStore

## Research Findings — TrainerScheduleView C안 (이미 구현됨)
- 빈 슬롯 탭 → loadMembersWithAvailability(date, time) → 회원별 ✅/❌/❓ 표시
- resolveAvailabilityState(availableSlots, dateStr, timeStr) → 'available'|'unavailable'|'unknown'
- getDayPeriod(timeStr): hour<12→morning, hour<18→afternoon, else→evening
- AVAILABILITY_ORDER: { available: 0, unavailable: 1, unknown: 2 } → 정렬

## Metis Review — Guardrails
- G1: resolveAvailabilityState 버그는 TrainerScheduleView만 수정
- G2: AvailabilityStatusView의 formatAvailability()는 리디자인에서 완전 교체 → 별도 수정 불필요
- G3: 히트맵 데이터 집계는 뷰의 computed에서 처리, 새 composable 금지
- G4: 기존 composable import 모두 유지 (useMembers, useAvailability, useNotifications, useToast, useAuthStore)
- G5: CSS 파일 AvailabilityStatusView.css만 수정, global.css 금지
- G6: 라우터/composable 변경 금지

## Metis Review — Scope Creep Lock
- ❌ 트레이너 근무시간 연동
- ❌ 히트맵에서 직접 예약 생성
- ❌ 회원 등록 화면(AvailabilityRegistrationView) 수정
- ❌ 새 컴포넌트 추출 (AppHeatmap 등)
- ❌ 전체 리마인더 일괄 전송
- ❌ useAvailability composable 수정

## Metis Review — Edge Cases
- E1: 빈 배열 요일 (mon: []) → 카운트 0
- E2: 모든 요일 빈 배열 → "등록 완료"이지만 히트맵에는 카운트 안 됨
- E3: 레거시 데이터 (morning/afternoon/evening) → HH:MM 패턴 매칭 실패 → 무시 + 방어 코드
- E4: 2자리 숫자 (15명+) → 셀 크기 확인
- E5: 바텀시트 15명+ → 내부 스크롤 (AppBottomSheet 지원됨)
- E6: 7열 셀 크기 → 약 55px per cell (터치 가능)

## Open Questions
- 없음 (사용자 결정 완료)

## Scope Boundaries
- INCLUDE: AvailabilityStatusView 히트맵 리디자인 + resolveAvailabilityState 버그 수정
- EXCLUDE: 회원 등록 화면, 새 composable, 새 컴포넌트, 라우터 변경, 예약 생성 기능

## Task 분할 (Metis 권장)
- Task A (메인): AvailabilityStatusView.vue + .css 히트맵 리디자인 [visual-engineering]
- Task B (독립): TrainerScheduleView.vue resolveAvailabilityState 버그 수정 [quick]
- 두 태스크는 독립적, 병렬 실행 가능
