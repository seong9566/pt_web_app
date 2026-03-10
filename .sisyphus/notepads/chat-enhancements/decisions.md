# Decisions — chat-enhancements

## 2026-03-10 Task 5
- 페이지네이션 트리거는 IntersectionObserver 대신 요구사항대로 `scrollTop < 50` 조건을 채택.
- 과거 메시지 로딩 상태는 composable 전역 `loading`과 분리해 각 뷰에 `loadingOlder` 로컬 ref를 두고 상단 스피너 UI 제어.
- 기존 양방향 채팅 뷰 구조를 유지하고(Member/Trainer 분리), 공통 컴포넌트 리팩토링은 의도적으로 수행하지 않음.

## 2026-03-10 Task 8
- 검색은 별도 페이지/모달 없이 기존 채팅방 패널 내부 인라인 모드(`isSearchMode`)로 구현.
- 서버 검색은 full-text/인덱스 작업 없이 Supabase `ilike('content', '%query%')` 기반으로 제한하고, 결과 정렬은 `created_at desc` + `limit(50)`로 고정.
- 검색 모드 종료 시 `searchQuery`/`searchResults`를 즉시 초기화해 이전 검색 컨텍스트가 다음 채팅 진입에 남지 않도록 결정.
