# Decisions — workout-assignment

## [2026-03-06] Session ses_33f92e282ffeDZpWgKk9CRKamW — Plan Start

### User Decisions
1. **운동 입력 방식**: 자유 텍스트 → 구조화된 폼 (운동명/세트/횟수/메모)
2. **테스트**: 구현 후 Vitest 추가
3. **알림 네비게이션**: workout 알림 클릭 → /home 아님, MemberWorkoutDetailView로 직접 이동

### Architecture Decisions
1. **createNotification 호출 위치**: composable 내부 (비즈니스 규칙)
2. **DB 마이그레이션 전략**: DROP content + ADD exercises (데이터 0건 확인됨)
3. **날짜 네비게이션**: 운동이 있는 날짜 간 이동 (빈 날짜 스킵)
4. **exercises 최대 개수**: 20개
5. **세트/횟수 기본값**: 3세트 10회

## [2026-03-06] Task F4 Decisions

1. **Scope fidelity 판정 기준**: 각 task별 spec 항목 존재 + Must NOT 위반 없음 + commit/file 매핑 일치 시 COMPLIANT.
2. **Contamination 판정 기준**: commit 단위 파일 집합이 task 경계와 일치하면 CLEAN.
3. **Verification 최소 기준**: targeted Vitest + build + changed-file LSP diagnostics clean을 통과해야 최종 APPROVE.
