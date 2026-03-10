# Problems — chat-enhancements

## 2026-03-10 Task 5
- 현재 `fetchOlderMessages` 커서가 `created_at` 단일 컬럼 기반이라, 동일 타임스탬프 메시지가 대량 발생하면 경계 중복/누락 가능성이 남아있음.
- 상단 로딩 트리거 임계값(50px)은 고정값이며, 기기별 스크롤 감도 차이를 고려한 동적 임계값 전략은 아직 없음.
