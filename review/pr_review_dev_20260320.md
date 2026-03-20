# PR 코드 리뷰 보고서

**브랜치**: `dev`
**기준**: `main`
**리뷰어**: Codex (`gpt-5.4`, reasoning: `high`)
**날짜**: 2026-03-20
**변경 파일 수**: 5개 (src/utils/reservation.js, ReservationManageView.vue/css, TrainerHomeView.vue/css)

---

## 파일별 리뷰

### 공통
- 🔴 높음: 신규 유틸 `@/utils/reservation`를 두 뷰에서 import했는데, 현재 작업 트리 기준 `src/utils/reservation.js`가 아직 untracked 입니다. PR에 이 파일이 빠지면 `ReservationManageView.vue:349`, `TrainerHomeView.vue:209`에서 바로 import 에러로 빌드가 깨집니다.

### ReservationManageView.vue
- 🔴 높음: `today` 계산을 `ReservationManageView.vue:410`에서 `new Date().toISOString().slice(0, 10)`으로 만들고 있습니다. 이 값은 UTC 기준이라 KST에서는 자정부터 오전 9시 전까지 전날로 계산됩니다. 그 결과 `ReservationManageView.vue:428`, `ReservationManageView.vue:429`의 `오늘/다른 날짜` 분류가 잘못될 수 있습니다.
- 🟡 중간: `change_requested` 카드에서 승인 버튼이 항상 노출됩니다. `ReservationManageView.vue:178`, `ReservationManageView.vue:281`. 반면 backend는 요청 시간 데이터가 없으면 `"No change request data"`로 실패합니다(`useReservations.js:395`). 이전 버전은 `requested_date`가 있을 때만 승인 버튼을 보여줬고, 대신 재배정 액션이 있었는데 이번 diff에서 그 경로가 사라져 일부 변경 요청이 처리 불가 상태가 됩니다.
- 🟡 중간: 변경 요청 카드에서 요청된 날짜/시간 정보가 UI에서 사라졌습니다. 현재는 `ReservationManageView.vue:163`, `ReservationManageView.vue:266`에서 사유만 보여주고 있어, 트레이너가 어떤 시간 변경을 승인하는지 확인할 수 없습니다. 로직상 승인 자체는 시간 데이터를 사용하므로, 표시 제거는 UX 회귀에 가깝습니다.
- 🟢 낮음: 오늘/다른 날짜 섹션의 카드 마크업이 거의 그대로 복제돼 있습니다. `ReservationManageView.vue:124`, `ReservationManageView.vue:219` 이후 블록이 같은 조건식까지 반복돼서 이후 수정 시 한쪽만 고치는 드리프트가 생기기 쉽습니다. `ReservationCard` 같은 하위 컴포넌트로 빼는 편이 안전합니다.

### ReservationManageView.css
- 🟢 낮음: 디자인 토큰 준수에서 어긋난 하드코딩 색상이 여러 군데 들어왔습니다. 예: `ReservationManageView.css:232`, `ReservationManageView.css:303`, `ReservationManageView.css:319`, `ReservationManageView.css:351`, `ReservationManageView.css:354`, `ReservationManageView.css:438`. 프로젝트 규칙상 `global.css` 토큰으로 치환하는 쪽이 맞습니다.
- 🟢 낮음: 타이포그래피도 일부 하드코딩되었습니다. `ReservationManageView.css:291`, `ReservationManageView.css:292`, `ReservationManageView.css:293`. 기존 토큰 체계와 섞이면 화면 일관성이 깨질 수 있습니다.

### TrainerHomeView.vue
- 🟡 중간: 완료 배지 조건이 상태를 보지 않고 시간만 봅니다. `TrainerHomeView.vue:114`, `TrainerHomeView.vue:116`, `TrainerHomeView.vue:132`에서 `isSessionPast(reservation)`를 바로 쓰는데, 리스트 자체는 `TrainerHomeView.vue:259`, `TrainerHomeView.vue:260`처럼 `change_requested`를 포함합니다. 그래서 변경 요청 상태의 지난 일정도 `완료`처럼 보일 수 있습니다. `scheduled`에만 적용하거나 별도 상태 배지가 필요합니다.
- 🟢 낮음: 한 카드에서 `isSessionPast(reservation)`를 두 번, `formatWorkoutSummary(workoutMap[reservation.id])`를 두 번 호출합니다. 리스트가 커지면 불필요한 재계산이 누적되니, 파생값을 미리 계산해서 템플릿엔 결과만 두는 편이 낫습니다.

### TrainerHomeView.css
- 🟢 낮음: 이번 diff에서 추가된 스타일 자체는 BEM 네이밍과 토큰 사용이 대체로 맞습니다. 별도 문제는 없었습니다.

## 보안 메모
- 이번 diff 범위에서는 `v-html`, 민감정보 출력, 직접적인 XSS 유입 지점은 보이지 않았습니다.
- 다만 `partner_photo` 같은 외부 URL 렌더링은 기존 구조 그대로라, 허용 도메인 정책이 없다면 별도 검토 여지는 있습니다.

## PR 체크리스트
- [ ] `src/utils/reservation.js`를 PR에 포함했는지 확인
- [ ] `today` 계산을 UTC가 아닌 로컬 타임존 기준으로 수정
- [ ] `change_requested` 카드에서 `requested_date/requested_start_time` 없는 경우 승인 버튼 노출 조건 재검토
- [ ] 변경 요청 카드에 요청된 날짜/시간 표시 복원 또는 대체 UI 추가
- [ ] Trainer Home의 `완료` 표시를 `scheduled` 등 허용 상태로 제한
- [ ] `ReservationManageView.css`의 하드코딩 색상/타이포 값을 디자인 토큰으로 치환
- [ ] 중복된 예약 카드 템플릿을 하위 컴포넌트로 분리할지 검토
