# Draft: 매뉴얼 기능 갭 해소

## Requirements (confirmed)
- 작업 범위: 핵심 갭 + 품질 개선
- 카테고리 전략: DB enum 확장 (스포츠, 코어, 유연성 추가)
- 수정 UI 전략: ManualRegisterView 재사용 (edit mode 추가)

## Technical Decisions
- ManualRegisterView에 route param 기반 edit/create 모드 분기
- fetchManuals()에 manual_media JOIN 추가하여 썸네일 표시
- deleteManual()에서 Storage 파일도 함께 삭제
- 트레이너 상세 뷰에 수정/삭제 버튼 추가 (ManualDetailView 내 role 분기 or 별도 처리)
- confirm() → AppBottomSheet로 삭제 확인 UI 개선
- 미디어 개별 삭제/추가 관리 UI (수정 모드에서)

## Research Findings
- DB enum: manual_category = ('재활', '근력', '다이어트', '스포츠퍼포먼스') — 4개
- UI categories: 전체/재활/근력/다이어트/스포츠/코어/유연성 — 7개 (전체 제외 6개)
- ManualRegisterView에서 카테고리를 comma-join으로 저장 → DB enum 단일값이라 다중 선택 시 실패
- updateManual() composable 존재하지만 UI 없음
- 트레이너 상세 라우트 `/trainer/settings/manual/:id`가 ManualDetailView(읽기전용) 사용
- deleteManual() DB CASCADE만 → Storage orphan files
- fetchManuals()에 media JOIN 없음 → 리스트 썸네일 불가

## Scope Boundaries
- INCLUDE: 카테고리 enum 확장, 매뉴얼 수정 UI, 썸네일 표시, Storage 파일 정리, 미디어 관리, 삭제 확인 개선, 트레이너 상세뷰 수정/삭제 버튼
- EXCLUDE: 페이지네이션, 북마크, 댓글/리뷰, 공유, 오프라인 지원, 미디어 압축, 드래프트 기능

## Test Strategy Decision
- **Infrastructure exists**: YES (Vitest, 68 tests)
- **Automated tests**: YES (tests-after)
- **Framework**: Vitest
- **Agent-Executed QA**: ALWAYS (build + existing tests + new unit tests)

## Open Questions
- (none — all resolved)
