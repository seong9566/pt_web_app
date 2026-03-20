# 트레이너 화면 UX 리뷰 종합 보고서

> 리뷰 일자: 2026-03-20
> 기준: 토스(Toss) 앱 수준의 모바일 UX 베스트 프랙티스
> 대상: 트레이너 관련 화면 21개
> 검증: GPT (codex exec) 교차 리뷰 완료 — 실제 소스 코드 대조 검증됨

---

## 📊 전체 현황

| 그룹 | 화면 수 | Critical | Major | Minor | GPT 라운드 |
|------|---------|----------|-------|-------|-----------|
| 핵심 (홈/일정/예약) | 3 | 3 | 6 | 6 | 2~3회 |
| 회원관리 | 3 | 6 | 5 | 4 | 1~2회 |
| 프로필 | 4 | 5 | 5 | 3 | 1~2회 |
| 콘텐츠 (메모/운동/매뉴얼) | 4 | 5 | 5 | 3 | 1~2회 |
| 결제/채팅 | 3 | 6 | 5 | 4 | 1~2회 |
| 설정/기타 | 4 | 5 | 7 | 5 | 2~3회 |
| **합계** | **21** | **~30** | **~33** | **~25** |  |

> 수치는 GPT 교차 리뷰로 항목이 추가/삭제/재분류되어 초기 리뷰 대비 증가함

---

## 🔴 Critical 이슈 TOP 15 (GPT 교차 검증 완료)

| # | 이슈 | 화면 | 사용자 영향 | GPT 신규 |
|---|------|------|------------|---------|
| 1 | 일정 취소 시 확인 다이얼로그 없이 즉시 실행 | TrainerScheduleView | 실수로 데이터 손실 | |
| 2 | 삭제 후 목록 미갱신 + 성공/실패 피드백 없음 | MemberPaymentView | 삭제 여부 확인 불가 | |
| 3 | 저장 성공 후 800ms 딜레이 중 폼 활성 → 중복 제출 | PaymentWriteView | 이중 결제 기록 | |
| 4 | 파일 전송 중 로딩 피드백 없음 | TrainerChatView | 반복 전송 시도 | |
| 5 | 수정 모드 로딩 시 빈 폼 노출 → 데이터 덮어쓰기 | MemoWriteView, ManualRegisterView | 기존 데이터 손실 | |
| 6 | `window.confirm` 사용 (기존 `useConfirm` 미활용) | TodayWorkoutView | PWA 앱 느낌 파괴 | |
| 7 | `pendingReservationCount` 미정의 변수 사용 | TrainerHomeView | 논리 버그 | ✅ |
| 8 | 날짜/시간/사진 UI 존재하지만 실제 저장 안 됨 | MemoWriteView | 데이터 손실 오인 | ✅ |
| 9 | `pt_sessions` 테이블 update/delete RLS 정책 없음 | PtCountManageView | 이력 수정 실패 | ✅ |
| 10 | 메모 저장 후 keep-alive 복귀 시 stale 데이터 | TrainerMemberDetailView | 오래된 데이터 표시 | ✅ |
| 11 | 연결 해제 후 `membersStore.invalidate()` 누락 | TrainerMemberDetailView | 해제된 회원 목록 잔존 | ✅ |
| 12 | 온보딩 완료 조건 불일치 (`name`만 검사) | TrainerProfileView | 부분 저장으로 온보딩 우회 | ✅ |
| 13 | 사진 즉시 저장 vs 폼 저장 혼합 모델 | TrainerProfileEditView | 취소해도 사진은 이미 변경 | ✅ |
| 14 | `messages` deep watch로 읽음 처리 시 자동 스크롤 | TrainerChatView | 의도치 않은 스크롤 점프 | ✅ |
| 15 | 배정됨/완료됨 필터 중복 노출 | ReservationManageView | 같은 예약 두 번 표시 | ✅ |

---

## 🔁 화면 횡단 공통 이슈 (GPT 보강)

### 1. 터치 타겟 미달 (전체 화면 공통)
22~40px 크기의 인터랙티브 요소가 다수 존재. 모바일 최소 권장 44px 미달.
- 히트맵 셀 36px, 파일 미리보기 제거 22px, 승인/거절 34px, 요일 칩 40px, 뒤로가기 32~40px 등

### 2. 에러/실패 피드백 부재
삭제, 저장, 전송 등 비동기 액션 실패 시 사용자에게 피드백 없음.
- 결제 삭제, 파일 전송, 코드 생성, 계정 삭제 등
- **GPT 추가**: `isActiveConnection()`이 네트워크 오류와 미연결을 구분 못하는 구조적 문제

### 3. 미저장 이탈 방지 없음
폼 작성 중 뒤로가기 시 경고 없이 데이터 소멸.
- MemoWriteView, ManualRegisterView, TrainerProfileEditView

### 4. 로딩 상태 불일치
일부 화면은 스켈레톤, 일부는 텍스트, 일부는 로딩 없음. 패턴 통일 필요.

### 5. 용어/표기 불일치
"메뉴얼/매뉴얼", "가입/연결", 전문 분야 라벨 등 화면 간 용어 불일치.

### 6. `setTimeout(() => safeBack(), 800)` 안티패턴 (GPT 신규)
7개 이상 화면에서 반복. 딜레이 중 폼 활성/중복 제출 위험.

### 7. 접근성 부재 (GPT 신규)
- 아이콘 버튼 전반에 `aria-label` 없음
- `:focus-visible` 스타일 미정의
- `role` 속성 누락 (카드, 리스트 등)

---

## 🟢 잘된 점 (유지해야 할 패턴)

- **스켈레톤 UI**: 홈/일정/예약 등 핵심 화면에 콘텐츠 형태에 맞는 스켈레톤 구현
- **풀투리프레시**: 목록 화면에 일관적으로 적용
- **스태거 애니메이션**: 카드/목록 항목에 순차 등장 애니메이션
- **디자인 토큰**: CSS 변수 준수율 높음, 시각적 일관성 양호
- **BEM 네이밍**: CSS 클래스명이 체계적
- **`prefers-reduced-motion` 대응**: 접근성 고려된 애니메이션
- **바텀시트 활용**: 모바일 친화적인 모달 패턴
- **`useConfirm` 시스템**: 이미 존재하지만 일부 화면에서 미활용 (확대 적용 필요)

---

## 💡 토스 앱 참고 공통 개선 권장사항

1. **Undo 패턴 확대**: 취소/삭제 후 즉시 실행 + 하단 토스트로 "실행 취소" 제공
2. **인라인 피드백**: 버튼 내부 로딩 스피너, 성공 체크 애니메이션
3. **바텀시트 확인 다이얼로그**: `window.confirm` → 기존 `useConfirm`/`AppConfirmDialog` 활용
4. **마이크로인터랙션**: 숫자 카운트업, 상태 전환 트랜지션
5. **날짜별 그룹핑**: 예약 목록에 날짜 구분자 (토스 송금 내역 패턴)
6. **safe-area 대응**: 노치/홈바 영역 대응 (`env(safe-area-inset-bottom)`)

---

## 🏗️ 구조 개선 제안 (리팩토링 단계용)

1. **전문 분야 상수 중앙화** → `src/constants/specialties.js`
2. **사진 업로드 컴포넌트화** → `AppAvatarUploader.vue`
3. **연결 상태 확인 패턴 composable화** → `useConnectionGuard.js`
4. **확인 다이얼로그 통일** → 기존 `useConfirm`/`AppConfirmDialog` 전면 활용
5. **에러 표시 패턴 통일** → 좌측 보더 스타일로 표준화
6. **예약 카드 컴포넌트 추출** → 코드 중복 200줄 제거
7. **`safeBack()` 딜레이 패턴 리팩토링** → Promise 기반 비동기 완료 후 이동

---

## 📁 개별 리뷰 문서 (GPT 교차 검증 완료)

| 그룹 | 파일 |
|------|------|
| 핵심 | [TrainerHomeView](./TrainerHomeView_reviewed.md), [TrainerScheduleView](./TrainerScheduleView_reviewed.md), [ReservationManageView](./ReservationManageView_reviewed.md) |
| 회원관리 | [TrainerMemberView](./TrainerMemberView_reviewed.md), [TrainerMemberDetailView](./TrainerMemberDetailView_reviewed.md), [PtCountManageView](./PtCountManageView_reviewed.md) |
| 프로필 | [TrainerProfileView](./TrainerProfileView_reviewed.md), [TrainerProfileEditView](./TrainerProfileEditView_reviewed.md), [TrainerProfileReadOnlyView](./TrainerProfileReadOnlyView_reviewed.md), [TrainerSearchView](./TrainerSearchView_reviewed.md) |
| 콘텐츠 | [MemoWriteView](./MemoWriteView_reviewed.md), [TodayWorkoutView](./TodayWorkoutView_reviewed.md), [TrainerManualView](./TrainerManualView_reviewed.md), [ManualRegisterView](./ManualRegisterView_reviewed.md) |
| 결제/채팅 | [MemberPaymentView](./MemberPaymentView_reviewed.md), [PaymentWriteView](./PaymentWriteView_reviewed.md), [TrainerChatView](./TrainerChatView_reviewed.md) |
| 설정/기타 | [SettingsView](./SettingsView_reviewed.md), [WorkTimeSettingView](./WorkTimeSettingView_reviewed.md), [AvailabilityStatusView](./AvailabilityStatusView_reviewed.md), [InviteManageView](./InviteManageView_reviewed.md) |

---

## 다음 단계

1. ✅ **1차 UX 리뷰 완료** — Claude가 21개 화면 분석
2. ✅ **GPT 교차 리뷰 완료** — codex exec로 실제 코드 대조 검증, 피드백 반영
3. ⬜ **우선순위 확정** — Critical 이슈 15개 중 먼저 수정할 항목 선택
4. ⬜ **UI/UX 개선 실행** — 기존 동작 유지하며 개선
5. ⬜ **코드 구조 리팩토링** — 마지막 단계
