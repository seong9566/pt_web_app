# PRD Full Completion — Issues

## None yet

## 2026-03-05 — LSP diagnostics 환경 이슈
- `lsp_diagnostics` 실행 시 `typescript-language-server` 미설치로 진단 불가
- 오류 메시지: `LSP server 'typescript' is configured but NOT INSTALLED`
- 영향: 변경된 JS 테스트 파일에 대해 LSP clean 여부를 도구로 확인하지 못함
