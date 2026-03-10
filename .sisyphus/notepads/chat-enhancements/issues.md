# Issues — chat-enhancements

## 2026-03-10 Task 5
- `lsp_diagnostics`의 CSS 파일 검증은 로컬 Biome LSP 미설치로 실행 불가. Vue/JS 파일 기준으로 진단 확인함.
- `npm run build` 시 기존 전역 CSS minify warning(`--animation-duration-fast`)이 계속 출력되지만 exit code는 0이며 이번 변경과 무관.

## 2026-03-10 Task 8
- CSS 파일(`MemberChatView.css`, `TrainerChatView.css`) 대상 `lsp_diagnostics`는 Biome LSP 미설치로 동일하게 실행 불가.
- `npm run build`에서 기존 CSS minify warning(`--animation-duration-fast`)과 router chunk warning이 재출력되지만 빌드는 성공(exit code 0).
