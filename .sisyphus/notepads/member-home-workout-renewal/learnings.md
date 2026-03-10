# Learnings — member-home-workout-renewal

## 2026-03-10 Session Start

### 현재 파일 상태 (실제 라인 번호 확인)
- MemberHomeView.vue: 354줄
- MemberHomeView.css: 497줄

### 제거 대상 (Vue 템플릿)
- Line 88-101: `<div v-if="nextSession.routine.length > 0" class="member-home__pt-routine">` 블록
- Line 102-104: `<div v-else-if="nextSession.hasReservation" class="member-home__pt-routine">` 블록
- Line 105: `</div>` — pt-card 닫는 태그이므로 **유지**
- Line 108-132: 기존 "오늘의 운동" 섹션 전체 교체

### 제거 대상 (JS computed)
- Line 287: `routine: [],` (기본 반환값)
- Line 288: `hasReservation: false,` (기본 반환값)
- Line 299: `const routine = currentPlan.value?.exercises?.map(e => e.name).filter(Boolean) || []`
- Line 307: `routine,`
- Line 308: `hasReservation: true,`
- Line 339-344: `workoutPreview` computed 전체

### 제거 대상 (CSS)
- Line 234-240: `.member-home__pt-routine`
- Line 242-246: `.member-home__pt-routine-label`
- Line 248-254: `.member-home__pt-routine-empty`
- Line 256-263: `.member-home__pt-routine-list`
- Line 265-271: `.member-home__pt-routine-item`
- Line 421-441: `.member-home__workout-card`, `.member-home__workout-card:active`, `.member-home__workout-content` (기존 카드 스타일)

### 주의사항
- `--color-gray-50`은 global.css에 **미정의** → 사용 금지 (현재 CSS 234줄에 이미 사용 중이지만 제거 대상)
- `prefers-reduced-motion` 블록(line 492-497)에 `.member-home__exercise-card` 추가 필요
- `section-row` 클래스는 이미 존재 (line 126-131 CSS)
- `see-all` 버튼 클래스도 이미 존재 (line 133-141 CSS)
