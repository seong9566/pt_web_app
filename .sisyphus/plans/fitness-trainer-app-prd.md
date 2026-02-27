# 헬스 트레이너 앱 — 기능 정의서(PRD) 작성 플랜

## TL;DR

> **Quick Summary**: 헬스 트레이너 일정 관리 앱의 기능 정의서(PRD)를 한국어로 작성한다. 이 문서는 피그마 UI 설계의 참고 자료로 사용되며, 24개 확정된 기능을 화면 단위로 정의한다.
>
> **Deliverables**:
>
> - `docs/PRD_헬스트레이너앱.md` — 종합 기능 정의서 (한국어)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Final Verification

---

## Context

### Original Request

헬스 트레이너를 위한 일정 관리 웹/앱의 전체적인 프로젝트 기능문서 작성. 피그마 설계 참고용.

### Interview Summary

**Key Discussions**:

- 사용자 유형: 트레이너 + 회원 (2종류만, 관리자 없음)
- 플랫폼: Vue.js 웹 + Flutter WebView 앱
- 인증: 카카오 OAuth
- 트레이너-회원 관계: 1:N (회원은 한 트레이너에게만 배정)
- 트레이너 매칭: 초대 링크/코드 + 앱 내 검색
- PT 예약: 회원 요청 → 트레이너 승인 → 확정 (자유 취소)
- 예약 시간: 트레이너가 근무 가능 시간 미리 설정 + 시간 단위 커스텀 설정
- 채팅: 1:1 텍스트 + 파일/이미지 전송 (그룹 X)
- 운동 매뉴얼: 트레이너 업로드, 전체 공개, 영상(직접+YouTube)+사진+제목+설명
- 카테고리: 재활/근력/다이어트/스포츠 퍼포먼스
- 결제: 간단한 수납 기록만 (온라인 결제 X)
- 운동 기록: 트레이너가 회원별 간단한 메모
- 운동 프로그램: 자유 텍스트 메모로 배정
- PT 횟수: 등록 횟수/잔여 횟수 관리
- 트레이너 프로필: 이름, 사진, 전문 분야
- 회원 프로필: 기본 + 신체정보(키/몸무게/나이) + 목표/특이사항
- 문서 언어: 한국어
- 인앱 알림: 필요 (푸시 알림은 제외)
- 온보딩: 카카오 로그인 → 역할 선택 → 프로필 입력
- 운동 프로그램 형태: 자유 텍스트 메모

### Metis Review

**Identified Gaps** (addressed):

- 인앱 알림 누락 → 사용자에게 확인 완료 (인앱 알림 포함)
- 온보딩 흐름 미정의 → 역할 선택 → 프로필 입력 확정
- 운동 프로그램 깊이 모호 → 자유 텍스트 메모로 확정
- 문서 언어 미정 → 한국어 확정
- 스코프 크리프 경계 설정 → 가드레일 적용 (아래 참조)

---

## Work Objectives

### Core Objective

24개 확정된 기능을 모두 포함하는 종합 기능 정의서를 한국어로 작성한다. 피그마 UI 설계자가 이 문서만으로 와이어프레임을 그릴 수 있도록 화면 단위로 기술한다.

### Concrete Deliverables

- `docs/PRD_헬스트레이너앱.md` — 종합 기능 정의서

### Definition of Done

- [ ] 24개 기능 영역 모두 문서에 포함됨 (섹션 헤더로 확인)
- [ ] 각 기능별 사용자 흐름(User Flow) 기술됨
- [ ] 각 기능별 화면 설명(Screen Description) 포함됨
- [ ] 각 기능별 비즈니스 규칙(Business Rules) 정의됨
- [ ] 각 기능별 범위 외(Out of Scope) 항목 명시됨
- [ ] 목차(Table of Contents) 포함됨
- [ ] DB 스키마, API 설계, 기술 구현 세부사항 없음
- [ ] 기능 체크리스트(Feature Checklist) 부록 포함됨

### Must Have

- 24개 기능 모두 커버 (1개도 빠지면 안 됨)
- 화면별 UI 요소 목록 (피그마 참고용)
- 트레이너 관점 / 회원 관점 양쪽 사용자 흐름
- 엣지 케이스 및 비즈니스 규칙
- 인앱 알림 시나리오

### Must NOT Have (Guardrails)

- DB 스키마 / ERD / 테이블 설계
- REST API 엔드포인트 설계
- 기술 아키텍처 (프레임워크/라이브러리 선택 등)
- 온라인 결제 / PG사 연동 기능
- 푸시 알림 기능
- 그룹 채팅 기능
- 좋아요/댓글/공유 등 소셜 기능 (매뉴얼)
- 상세 운동 추적 (세트/횟수/중량 시계열 데이터)
- 운동 진행도 그래프/차트
- 회원이 여러 트레이너를 갖는 기능
- 상세 트레이너 프로필 (자격증/경력/포트폴리오/후기/평점)
- 대기자 명단, 반복 예약, 오버부킹 규칙
- 음성 메시지, 영상 통화, 읽음 표시, 타이핑 표시, 메시지 리액션

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: N/A (문서 작성 태스크)
- **Automated tests**: None (코드가 아닌 문서)
- **Framework**: N/A

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **문서 검증**: Bash (grep/search) — 섹션 헤더 존재 확인, 금지 키워드 부재 확인, 구조 검증

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 문서 작성):
├── Task 1: PRD 문서 작성 — Part 1 (개요 + 공통 기능: 인증/온보딩/프로필/알림) [writing]
├── Task 2: PRD 문서 작성 — Part 2 (핵심 기능: 예약/캘린더/채팅/횟수관리/수납) [writing]
└── Task 3: PRD 문서 작성 — Part 3 (콘텐츠 기능: 매뉴얼/운동프로그램/메모 + 부록) [writing]

Wave 2 (After Wave 1 — 통합 + 검증):
├── Task 4: 문서 통합 및 목차/체크리스트 생성 [writing]
└── Task 5: QA 검증 — 구조 + 완성도 + 가드레일 준수 확인 [unspecified-high]

Wave FINAL (After ALL tasks — independent review):
└── Task F1: 플랜 준수 + 범위 충실도 통합 검증 [deep]
```

### Dependency Matrix

| Task | Depends On | Blocks |
| ---- | ---------- | ------ |
| 1    | —          | 4      |
| 2    | —          | 4      |
| 3    | —          | 4      |
| 4    | 1, 2, 3    | 5, F1  |
| 5    | 4          | F1     |
| F1   | 5          | —      |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 → `writing`, T2 → `writing`, T3 → `writing`
- **Wave 2**: 2 tasks — T4 → `writing`, T5 → `unspecified-high`
- **FINAL**: 1 task — F1 → `deep`

---

## TODOs

> 모든 태스크는 `docs/PRD_헬스트레이너앱.md` 단일 파일에 작성한다.
> Task 1-3은 병렬로 작성한 후, Task 4에서 통합한다.
> **모든 task에 포함될 24개 기능 리스트**: (1)카카오 OAuth 로그인 (2)온보딩/역할선택 (3)트레이너 프로필 (4)회원 프로필 (5)인앱 알림 (6)트레이너 검색/초대 (7)트레이너 근무시간 설정 (8)예약시간단위 설정 (9)PT 예약 요청 (10)PT 예약 승인/거절 (11)예약 취소 (12)캘린더 조회 (13)1:1 채팅 (14)파일/이미지 전송 (15)PT 횟수 관리 (16)수납 기록 (17)운동 매뉴얼 업로드 (18)매뉴얼 열람/검색 (19)매뉴얼 카테고리 필터 (20)운동 프로그램 배정(오늘의 운동) (21)회원 운동 메모 (22)계정 관리/탈퇴 (23)트레이너-회원 연결/해제 (24)대시보드(트레이너/회원 홈)

- [ ] 1. PRD 문서 작성 — Part 1: 개요 + 공통 기능 (8개 기능)

  **What to do**:
  - `docs/PRD_헬스트레이너앱_part1.md` 파일로 작성
  - **섹션 1: 제품 개요**
    - 제품명, 목적, 타깃 사용자, 플랫폼 (웹+Flutter WebView)
    - 핵심 가치 제안 1~2문장
    - 사용자 유형 정의 (트레이너/회원) + 각 유형의 주요 액션 요약
  - **섹션 2: 인증 및 온보딩** (기능 1~2)
    - 카카오 OAuth 로그인 흐름 (화면별 상세)
    - 최초 로그인 → 역할 선택(트레이너/회원) → 프로필 입력 → 완료
    - 재로그인 시 역할 선택 생략
    - 화면 설명: 로그인 화면, 역할 선택 화면, 프로필 입력 화면
  - **섹션 3: 프로필 관리** (기능 3~4)
    - 트레이너 프로필: 이름, 프로필 사진, 전문 분야 (재활/근력/다이어트/스포츠 퍼포먼스)
    - 회원 프로필: 이름, 연락처, 키/몸무게/나이, 운동 목표, 특이사항(부상 이력 등)
    - 프로필 수정 흐름
    - 화면 설명: 프로필 조회 화면, 프로필 수정 화면
  - **섹션 4: 인앱 알림** (기능 5)
    - 알림 발생 시나리오: 예약 요청/승인/거절/취소, 채팅 수신, 운동 프로그램 배정, PT 횟수 변경
    - 알림 센터(목록) 화면
    - 알림 읽음/안읽음 상태
    - 배지 카운트 표시 위치 (네비게이션 바)
  - **섹션 5: 트레이너 검색/초대** (기능 6)
    - 트레이너 목록/검색 화면 (이름, 전문분야 필터)
    - 초대 링크/코드 생성 및 공유 흐름
    - 초대 수락 흐름
    - 화면 설명: 트레이너 검색 화면, 트레이너 상세 화면, 초대코드 입력 화면
  - **섹션 6: 계정 관리** (기능 22~23)
    - 로그아웃
    - 계정 삭제 (개인정보보호법 준수)
    - 트레이너-회원 연결 해제 흐름 (채팅 기록/예약/메모 처리 정책)
  - **섹션 7: 대시보드** (기능 24)
    - 트레이너 홈: 오늘의 예약, 대기중 예약 요청, 안읽은 채팅, 이번 주 일정 요약
    - 회원 홈: 다음 PT 일정, 잔여 PT 횟수, 오늘의 운동
  - 각 섹션에 반드시 포함: **개요 / 사용자 흐름 / 화면 설명(UI 요소 목록) / 비즈니스 규칙 / 엣지 케이스 / 범위 외**

  **Must NOT do**:
  - DB 스키마, API 설계, 기술 구현 세부사항 포함 금지
  - 24개 확정된 기능 외 새로운 기능 임의 추가 금지
  - 영어로 작성 금지 (한국어 기능 정의서)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 순수 문서 작성 태스크. 코드 작성/수정 없음.
  - **Skills**: `[]`
    - 코드 관련 스킬 불필요
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI가 아닌 문서 작성이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4 (통합)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/fitness-trainer-app.md` — 인터뷰 전체 결정사항 기록 (요구사항 원본)

  **External References**:
  - 카카오 OAuth 공식 문서: https://developers.kakao.com/docs/latest/ko/kakaologin/common — 로그인 플로우 참고
  - 개인정보보호법: 계정 삭제 기능 필수 근거

  **WHY Each Reference Matters**:
  - 드래프트 파일에서 24개 기능 목록 + 각 기능의 세부 결정사항을 추출하여 문서에 반영해야 함
  - 카카오 OAuth 문서로 로그인 화면 UX 흐름을 정확하게 기술

  **Acceptance Criteria**:
  - [ ] 섹션 1~7 모두 작성 완료 (8개 기능 커버)
  - [ ] 각 섹션에 6개 하위 섹션 존재 (개요/사용자 흐름/화면 설명/비즈니스 규칙/엣지 케이스/범위 외)
  - [ ] 화면 설명에 UI 요소 목록 포함 (피그마 참고용)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Part 1 문서 구조 검증
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱_part1.md 파일 존재
    Steps:
      1. grep -c "카카오" docs/PRD_헬스트레이너앱_part1.md — 1건 이상 존재
      2. grep -c "역할 선택" docs/PRD_헬스트레이너앱_part1.md — 1건 이상 존재
      3. grep -c "트레이너 프로필" docs/PRD_헬스트레이너앱_part1.md — 1건 이상 존재
      4. grep -c "회원 프로필" docs/PRD_헬스트레이너앱_part1.md — 1건 이상 존재
      5. grep -c "인앱 알림\|알림 센터" docs/PRD_헬스트레이너앱_part1.md — 1건 이상
      6. grep -c "트레이너 검색\|초대" docs/PRD_헬스트레이너앱_part1.md — 1건 이상
      7. grep -c "대시보드\|홈" docs/PRD_헬스트레이너앱_part1.md — 1건 이상
      8. grep -c "계정 삭제\|탈퇴" docs/PRD_헬스트레이너앱_part1.md — 1건 이상
    Expected Result: 모든 grep이 1 이상 반환
    Evidence: .sisyphus/evidence/task-1-structure-check.txt

  Scenario: Part 1 금지 키워드 부재 확인
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱_part1.md 파일 존재
    Steps:
      1. grep -ic "ERD\|endpoint\|API 설계\|테이블 설계\|스키마\|DbContext\|Repository" docs/PRD_헬스트레이너앱_part1.md
    Expected Result: 0 (일치 없음)
    Failure Indicators: 1 이상이면 기술 구현 세부사항이 누출된 것
    Evidence: .sisyphus/evidence/task-1-forbidden-keywords.txt
  ```

  **Commit**: NO (Task 4에서 통합 후 커밋)

---

- [ ] 2. PRD 문서 작성 — Part 2: 핵심 기능 (8개 기능)

  **What to do**:
  - `docs/PRD_헬스트레이너앱_part2.md` 파일로 작성
  - **섹션 8: 트레이너 근무시간 설정** (기능 7)
    - 요일별 근무 가능 시간 설정 화면
    - 시간 단위 커스텀 설정 (30분/1시간 등)
    - 반복 일정 vs 날짜별 설정
    - 휴무일/휴가 설정
  - **섹션 9: PT 예약 시스템** (기능 8~11)
    - 예약 요청 흐름: 회원이 트레이너의 가능 시간 확인 → 시간 선택 → 예약 요청
    - 예약 승인/거절 흐름: 트레이너가 대기중 예약 확인 → 승인/거절 (거절 시 사유 입력)
    - 예약 취소 흐름: 회원/트레이너 모두 취소 가능, PT 시작 전까지 자유 취소
    - 예약 상태: 대기중/승인됨/거절됨/취소됨/완료
    - 화면 설명: 예약 가능 시간 조회, 예약 요청 화면, 예약 목록(트레이너), 예약 상세, 예약 내역(회원)
  - **섹션 10: 캘린더** (기능 12)
    - 월간/주간/일간 뷰 (트레이너: 전체 예약 현황 / 회원: 자신의 예약만)
    - 예약 상태별 색상 구분
    - 캘린더에서 바로 예약 상세 확인/승인
    - 알림 기능 X (푸시 알림 없음, 인앱 알림으로 대체)
  - **섹션 11: 1:1 채팅** (기능 13~14)
    - 채팅 목록 화면 (최근 메시지, 안읽은 수, 프로필 사진)
    - 채팅방 화면: 텍스트 입력, 이미지/파일 쳊부, 메시지 시간 표시
    - 파일/이미지 전송 흐름 (type 제한, 용량 제한)
    - 이미지 프리뷰/다운로드
    - 범위 외: 음성메시지, 영상통화, 읽음표시, 타이핑표시, 리액션, 메시지 삭제
  - **섹션 12: PT 횟수 관리** (기능 15)
    - 트레이너: 회원별 등록 횟수 설정, 잔여 횟수 확인, 수동 차감/추가
    - 회원: 자신의 잔여 횟수 확인
    - 횟수 0 시 예약 불가 또는 경고?
    - 횟수 변경 이력 로그
  - **섹션 13: 수납 기록** (기능 16)
    - 트레이너: 회원별 수납 내역 기록 (금액, 날짜, 메모)
    - 회원: 자신의 수납 내역 조회
    - 범위 외: 온라인 결제, 영수증 발행, 정기결제, 환불 처리
  - 각 섹션에 반드시 포함: **개요 / 사용자 흐름 / 화면 설명(UI 요소 목록) / 비즈니스 규칙 / 엣지 케이스 / 범위 외**

  **Must NOT do**:
  - DB 스키마, API 설계, 기술 구현 세부사항 포함 금지
  - 예약 시스템에 대기자 목록/반복예약/오버부킹 규칙 추가 금지
  - 채팅에 음성/영상/읽음표시/리액션 등 추가 금지
  - 수납 기록을 결제 시스템으로 확대 금지

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 순수 문서 작성 태스크
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: 문서 작성이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 4 (통합)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/fitness-trainer-app.md` — 예약 취소 정책(자유 취소), 근무시간 설정, PT 횟수 관리, 수납 기록 요구사항 참조

  **WHY Each Reference Matters**:
  - 예약 시스템의 5개 상태(대기중/승인/거절/취소/완료)를 정확하게 기술하기 위해 인터뷰 결정사항 필요
  - PT 횟수 관리와 수납 기록의 단순함/복잡함 경계를 드래프트에서 확인

  **Acceptance Criteria**:
  - [ ] 섹션 8~13 모두 작성 완료 (8개 기능 커버)
  - [ ] 각 섹션에 6개 하위 섹션 존재
  - [ ] PT 예약 흐름이 5개 상태를 모두 커버

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Part 2 문서 구조 검증
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱_part2.md 파일 존재
    Steps:
      1. grep -c "근무 시간\|근무시간" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      2. grep -c "예약 요청\|예약 승인\|예약 취소" docs/PRD_헬스트레이너앱_part2.md — 3건 이상
      3. grep -c "캘린더" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      4. grep -c "채팅" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      5. grep -c "PT 횟수\|잔여 횟수" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      6. grep -c "수납" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
    Expected Result: 모든 grep이 1 이상 반환
    Evidence: .sisyphus/evidence/task-2-structure-check.txt

  Scenario: Part 2 예약 상태 전체 커버 확인
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱_part2.md 파일 존재
    Steps:
      1. grep -c "대기\|대기중" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      2. grep -c "승인" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      3. grep -c "거절" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      4. grep -c "취소" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
      5. grep -c "완료" docs/PRD_헬스트레이너앱_part2.md — 1건 이상
    Expected Result: 5개 예약 상태 모두 문서에 언급됨
    Evidence: .sisyphus/evidence/task-2-booking-states.txt
  ```

  **Commit**: NO (Task 4에서 통합 후 커밋)

---

- [ ] 3. PRD 문서 작성 — Part 3: 콘텐츠 기능 + 부록 (8개 기능)

  **What to do**:
  - `docs/PRD_헬스트레이너앱_part3.md` 파일로 작성
  - **섹션 14: 운동 매뉴얼** (기능 17~19)
    - 트레이너 업로드 흐름:
      - 카테고리 선택 (재활/근력/다이어트/스포츠 퍼포먼스)
      - 운동명 입력
      - 설명 작성 (자세, 세트/횟수 추천, 주의사항)
      - 사진 업로드 (복수)
      - 영상 업로드 (직접 업로드 OR YouTube URL)
    - 회원/전체 사용자 열람 흐름:
      - 카테고리별 봐로우징 (필터)
      - 매뉴얼 상세 (영상 재생 + 사진 뷰어 + 설명 읽기)
      - 검색 (운동명, 카테고리)
    - 트레이너: 자신의 매뉴얼 수정/삭제
    - 화면 설명: 매뉴얼 목록(카테고리 필터), 매뉴얼 상세, 매뉴얼 업로드/수정, 영상 재생, 사진 뷰어
    - 범위 외: 좋아요/댓글/공유/북마크/팔로워 등 소셜 기능
  - **섹션 15: 운동 프로그램 배정 (오늘의 운동)** (기능 20)
    - 트레이너: 회원 선택 → 자유 텍스트로 '오늘의 운동' 작성 → 전달
    - 회원: '오늘의 운동' 확인 화면
    - 날짜별 이력 확인
    - 화면 설명: 프로그램 작성 화면, 프로그램 확인 화면(회원), 프로그램 이력
    - 범위 외: 구조화된 운동 선택(set/rep/weight), 진행도 추적, 운동 완료 체크
  - **섹션 16: 회원 운동 메모** (기능 21)
    - 트레이너: 회원 선택 → 메모 작성 (날짜 + 자유 텍스트)
    - 트레이너: 메모 이력 확인/수정/삭제
    - 회원: 자신의 메모 열람만 가능 (수정 X)
    - 화면 설명: 메모 목록, 메모 작성/수정, 메모 상세(회원용)
    - 범위 외: 회원이 메모 작성, 상세 운동 추적
  - **섹션 17: 부록**
    - 기능 체크리스트 (24개 기능 ↔ 문서 섹션 매핑)
    - 용어 정의 (PT, 트레이너, 회원, 예약, 매뉴얼 등)
    - 전체 화면 목록 인덱스 (트레이너용 N개, 회원용 N개, 공통 N개)
    - 범위 요약 (IN/OUT 전체 목록)
  - 각 섹션에 반드시 포함: **개요 / 사용자 흐름 / 화면 설명(UI 요소 목록) / 비즈니스 규칙 / 엣지 케이스 / 범위 외**

  **Must NOT do**:
  - DB 스키마, API 설계, 기술 구현 세부사항 포함 금지
  - 매뉴얼에 좋아요/댓글/공유 등 소셜 기능 추가 금지
  - 운동 프로그램을 구조화된 운동 선택/추적으로 확대 금지
  - 회원 메모에 회원 직접 작성 기능 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 순수 문서 작성 태스크
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: 문서 작성이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 4 (통합)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/fitness-trainer-app.md` — 매뉴얼 영상 업로드 방식(직접+YouTube), 카테고리(재활/근력/다이어트/스포츠), 프로그램 형태(자유 텍스트 메모) 참조

  **WHY Each Reference Matters**:
  - 영상 업로드의 2가지 방식(직접/YouTube)을 화면에 정확히 반영
  - 운동 프로그램이 '자유 텍스트'임을 확인하여 구조화된 UI를 만들지 않도록

  **Acceptance Criteria**:
  - [ ] 섹션 14~17 모두 작성 완료 (8개 기능 커버 + 부록)
  - [ ] 기능 체크리스트에 24개 항목 모두 존재
  - [ ] 전체 화면 목록 인덱스 포함

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Part 3 문서 구조 검증
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱_part3.md 파일 존재
    Steps:
      1. grep -c "매뉴얼" docs/PRD_헬스트레이너앱_part3.md — 3건 이상
      2. grep -c "오늘의 운동\|운동 프로그램" docs/PRD_헬스트레이너앱_part3.md — 1건 이상
      3. grep -c "메모" docs/PRD_헬스트레이너앱_part3.md — 1건 이상
      4. grep -c "체크리스트\|기능 목록" docs/PRD_헬스트레이너앱_part3.md — 1건 이상
      5. grep -c "화면 목록" docs/PRD_헬스트레이너앱_part3.md — 1건 이상
    Expected Result: 모든 grep이 기대값 이상 반환
    Evidence: .sisyphus/evidence/task-3-structure-check.txt

  Scenario: Part 3 소셜 기능 부재 확인
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱_part3.md 파일 존재
    Steps:
      1. grep -ic "좋아요\|댓글\|팔로워\|공유하기\|북마크" docs/PRD_헬스트레이너앱_part3.md
    Expected Result: 0 또는 '범위 외' 섹션에서만 언급 (기능 설명에는 없음)
    Failure Indicators: 소셜 기능이 기능 설명에 포함된 경우
    Evidence: .sisyphus/evidence/task-3-no-social-features.txt
  ```

  **Commit**: NO (Task 4에서 통합 후 커밋)

---

- [ ] 4. PRD 문서 통합 및 목차 생성

  **What to do**:
  - Part 1 + Part 2 + Part 3 파일을 하나의 `docs/PRD_헬스트레이너앱.md` 파일로 통합
  - 문서 상단에 **목차(Table of Contents)** 생성 (Markdown 앵커 링크)
  - 섹션 번호 통일 및 정리 (섹션 1~17 순서 확인)
  - 마크다운 포매팅 통일 (Heading 레벨, 리스트 스타일, 굵은 글씨 등)
  - Part 1/2/3 개별 파일은 **삭제하지 않음** (Task 5 QA 완료 후 Task 5에서 삭제)
  - 최종 파일이 한국어로 자연스럽게 읽히는지 통독성 검토

  **Must NOT do**:
  - 새로운 기능 추가 금지 (통합만, 내용 추가 X)
  - Part 파일의 내용 수정/삭제 금지 (포매팅 통일만)
  - DB 스키마, API 설계 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 문서 통합 및 포매팅 정리
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: Task 5, F1, F2
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `docs/PRD_헬스트레이너앱_part1.md` — Part 1 원본 (개요 + 공통 기능)
  - `docs/PRD_헬스트레이너앱_part2.md` — Part 2 원본 (핵심 기능)
  - `docs/PRD_헬스트레이너앱_part3.md` — Part 3 원본 (콘텐츠 + 부록)

  **WHY Each Reference Matters**:
  - 3개 Part 파일을 순서대로 통합하여 1개 파일로 만들어야 함

  **Acceptance Criteria**:
  - [ ] `docs/PRD_헬스트레이너앱.md` 파일 존재
  - [ ] 목차(TOC) 포함 (Markdown 앵커 링크 작동)
  - [ ] 섹션 1~17 순서대로 통합
  - [ ] Part 1/2/3 개별 파일 삭제됨
  - [ ] 마크다운 포매팅 통일

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 통합 문서 존재 및 구조 검증
    Tool: Bash
    Preconditions: Task 1~3 완료
    Steps:
      1. ls docs/PRD_헬스트레이너앱.md — 파일 존재 확인
      2. ls docs/PRD_헬스트레이너앱_part*.md 2>/dev/null | wc -l — 0 (개별 파일 삭제됨)
      3. grep -c "^## 목차\|^## Table of Contents" docs/PRD_헬스트레이너앱.md — 1건
      4. grep -c "^## " docs/PRD_헬스트레이너앱.md — 17건 이상 (섹션 1~17)
    Expected Result: 통합 파일 존재, 개별 파일 없음, 목차 있음, 17개 섹션 있음
    Evidence: .sisyphus/evidence/task-4-integration-check.txt

  Scenario: 개별 파일 삭제 확인
    Tool: Bash
    Preconditions: 통합 완료
    Steps:
      1. test ! -f docs/PRD_헬스트레이너앱_part1.md && echo "DELETED" || echo "EXISTS"
      2. test ! -f docs/PRD_헬스트레이너앱_part2.md && echo "DELETED" || echo "EXISTS"
      3. test ! -f docs/PRD_헬스트레이너앱_part3.md && echo "DELETED" || echo "EXISTS"
    Expected Result: 모두 "DELETED"
    Evidence: .sisyphus/evidence/task-4-parts-deleted.txt
  ```

  **Commit**: YES
  - Message: `docs: add fitness trainer app PRD (기능 정의서)`
  - Files: `docs/PRD_헬스트레이너앱.md`

---

- [ ] 5. QA 검증 — 구조 + 완성도 + 가드레일 준수 확인

  **What to do**:
  - `docs/PRD_헬스트레이너앱.md` 전체 문서를 읽고 다음 항목 검증:
    1. 24개 기능 전체 포함 여부 (부록 체크리스트와 대조)
    2. 각 기능 섹션의 6개 하위 섹션 존재 (개요/사용자 흐름/화면 설명/비즈니스 규칙/엣지 케이스/범위 외)
    3. DB 스키마/API 설계/기술 구현 세부사항 없음 확인
    4. 13개 가드레일 항목 위반 없음 확인
    5. 트레이너/회원 양쪽 관점 모두 기술되었는지 확인
    6. 화면 설명에 UI 요소 목록이 포함되어 피그마 참고용으로 충분한지 확인
  - 문제 발견 시 직접 수정
  - 수정 내역 기록 (에비던스로 저장)
  - **QA 완료 후 Part 파일 삭제**: `docs/PRD_헬스트레이너앱_part1.md`, `_part2.md`, `_part3.md` 삭제
    **Must NOT do**:
  - 새로운 기능 추가 (검증 + 수정만)
  - 이미 정확한 내용 변경

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 문서 읽기 + 패턴 검증 + 수정이 필요한 복합 태스크
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 4)
  - **Blocks**: F1, F2
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `docs/PRD_헬스트레이너앱.md` — 검증 대상 문서
  - `.sisyphus/plans/fitness-trainer-app-prd.md` — 본 플랜의 "Must NOT Have" 섹션에서 13개 가드레일 항목 참조
  - `.sisyphus/drafts/fitness-trainer-app.md` — 24개 기능 원본 리스트 (검증 기준)

  **WHY Each Reference Matters**:
  - 플랜의 가드레일 13개 항목을 1:1로 검증해야 함
  - 드래프트의 24개 기능 목록과 문서의 기능 체크리스트를 대조

  **Acceptance Criteria**:
  - [ ] 24개 기능 전체 확인 완료
  - [ ] 13개 가드레일 위반 없음 확인
  - [ ] 문제 발견 시 수정 완료

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 24개 기능 전체 커버리지 확인
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱.md 파일 존재
    Steps:
      1. 다음 24개 키워드 각각 grep으로 검색:
         카카오, 온보딩, 트레이너 프로필, 회원 프로필, 인앱 알림,
         트레이너 검색, 근무 시간, 예약 요청, 예약 승인,
         예약 취소, 캘린더, 채팅, 파일 전송,
         PT 횟수, 수납, 매뉴얼 업로드, 매뉴얼 열람,
         카테고리 필터, 오늘의 운동, 운동 메모,
         계정 삭제, 연결 해제, 대시보드
      2. 각각 1건 이상 존재 확인
    Expected Result: 24개 모두 1건 이상
    Failure Indicators: 0건인 키워드가 있으면 해당 기능 누락
    Evidence: .sisyphus/evidence/task-5-full-coverage.txt

  Scenario: 13개 가드레일 준수 확인
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱.md 파일 존재
    Steps:
      1. 다음 금지 키워드 grep 검색:
         ERD, endpoint, API 설계, 테이블 설계, 스키마, DbContext,
         Repository, PG사, 온라인 결제, 영수증, 환불,
         음성메시지, 영상통화, 읽음표시, 타이핑표시,
         리액션, 북마크, 팔로워, 대기자 목록, 반복 예약,
         오버부킹, 진행도 그래프, 운동 완료 체크
      2. '범위 외' 섹션 내부를 제외하고 기능 설명에서 언급되는지 확인
    Expected Result: 기능 설명 내에서는 0건 ('범위 외'에서만 허용)
    Evidence: .sisyphus/evidence/task-5-guardrail-check.txt

  Scenario: 피그마 참고용 화면 설명 충실도 확인
    Tool: Bash (grep)
    Preconditions: docs/PRD_헬스트레이너앱.md 파일 존재
    Steps:
      1. grep -c "화면 설명" docs/PRD_헬스트레이너앱.md — 10건 이상
      2. grep -c "UI 요소\|버튼\|입력란\|리스트\|카드\|탭\|모달\|팝업" docs/PRD_헬스트레이너앱.md — 20건 이상
    Expected Result: 화면 설명 섹션이 충분하고, 구체적 UI 요소가 명시됨
    Evidence: .sisyphus/evidence/task-5-figma-readiness.txt
  ```

  **Commit**: YES (if corrections made)
  - Message: `docs: fix PRD issues from QA review`
  - Files: `docs/PRD_헬스트레이너앱.md`

---

## Final Verification Wave

- [ ] F1. **최종 검증: 플랜 준수 + 범위 충실도** — `deep`
      다음 항목을 모두 한 태스크에서 수행:
  1. 문서 전체를 읽고 24개 기능 각각이 포함되었는지 확인
  2. 각 기능 섹션에 필수 하위 섹션(개요/사용자 흐름/화면 설명/비즈니스 규칙/범위 외)이 존재하는지 확인
  3. DB 스키마/API 엔드포인트/기술 구현 세부사항이 포함되지 않았는지 grep 검색
  4. 가드레일 13개 항목 각각 grep 검색
  5. 인터뷰에서 확정되지 않은 기능이 임의로 추가되지 않았는지 확인
  6. 트레이너 관점과 회원 관점 양쪽 모두 기술되었는지 확인
     Output: `Features [24/24] | Subsections [OK/MISSING] | Guardrails [CLEAN/N violations] | Invented [CLEAN/N] | Dual Perspective [YES/NO] | VERDICT: APPROVE/REJECT`

---

## Commit Strategy

- **Task 4 완료 후**: `docs: add fitness trainer app PRD (기능 정의서)` — `docs/PRD_헬스트레이너앱.md`
- **Task 5 이후 수정 시**: `docs: fix PRD issues from QA review` — `docs/PRD_헬스트레이너앱.md`

---

## Success Criteria

### Verification Commands

```bash
# 24개 기능 섹션 존재 확인
grep -c "^### " docs/PRD_헬스트레이너앱.md  # Expected: >= 24

# 금지 키워드 부재 확인
grep -i "ERD\|endpoint\|API 설계\|테이블 설계\|스키마" docs/PRD_헬스트레이너앱.md  # Expected: no matches

# 필수 하위 섹션 패턴 확인
grep -c "사용자 흐름\|화면 설명\|비즈니스 규칙\|범위 외" docs/PRD_헬스트레이너앱.md  # Expected: >= 48 (each x4 subsections)
```

### Final Checklist

- [ ] 24개 기능 모두 포함
- [ ] 각 기능별 4개 하위 섹션 존재
- [ ] DB/API/기술 구현 세부사항 없음
- [ ] 가드레일 13개 항목 모두 준수
- [ ] 목차 + 기능 체크리스트 부록 포함
- [ ] 피그마 설계자가 참고할 수 있는 화면 단위 기술
