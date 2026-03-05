# PRD Full Completion — Issues

## None yet

## 2026-03-05 — LSP diagnostics 환경 이슈
- `lsp_diagnostics` 실행 시 `typescript-language-server` 미설치로 진단 불가
- 오류 메시지: `LSP server 'typescript' is configured but NOT INSTALLED`
- 영향: 변경된 JS 테스트 파일에 대해 LSP clean 여부를 도구로 확인하지 못함

- 2026-03-05 scope audit issue: T26 요구사항의 'payment CRUD' 기준에서 update 흐름이 불명확함(`usePayments`에 update 함수 없음, `PaymentWriteView`는 create 전용).
- 2026-03-05 process issue: wave commits(c40edd1, 3d3c509)에서 `.sisyphus/plans/prd-full-completion.md`가 수정되어 plan read-only 원칙과 충돌.
