# Decisions — chat-enhancements

## 2026-03-10 Task 5
- 페이지네이션 트리거는 IntersectionObserver 대신 요구사항대로 `scrollTop < 50` 조건을 채택.
- 과거 메시지 로딩 상태는 composable 전역 `loading`과 분리해 각 뷰에 `loadingOlder` 로컬 ref를 두고 상단 스피너 UI 제어.
- 기존 양방향 채팅 뷰 구조를 유지하고(Member/Trainer 분리), 공통 컴포넌트 리팩토링은 의도적으로 수행하지 않음.
