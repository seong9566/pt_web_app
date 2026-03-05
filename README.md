# FitLink — PT 매니저 Web App

개인 트레이닝(PT) 세션을 관리하는 Vue 3 모바일 퍼스트 PWA입니다.
트레이너와 회원 간의 연결, 예약, 스케줄 관리를 제공합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Vue 3 (Composition API, `<script setup>`) |
| 빌드 도구 | Vite 5 |
| 상태 관리 | Pinia |
| 라우팅 | Vue Router 4 |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage) |
| 언어 | JavaScript (TypeScript 미사용) |
| 스타일링 | CSS Custom Properties + BEM 네이밍 |

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm
- Supabase 프로젝트 (카카오 OAuth 설정 완료)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.example 참고)
cp .env.example .env.local
# .env.local에 실제 Supabase URL과 Anon Key 입력

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 환경변수

| 변수 | 설명 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL (예: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase 퍼블릭 anon 키 |

---

## 프로젝트 구조

```
pt_web_app/
├── index.html                  # SPA 진입점 HTML
├── vite.config.js              # Vite 빌드 설정 (@ alias → src/)
├── package.json                # 프로젝트 메타데이터 및 의존성
├── .env.local                  # 환경변수 (Supabase 키, git 미추적)
├── .env.example                # 환경변수 템플릿
│
├── supabase/
│   └── schema.sql              # DB 스키마 전체 SQL (테이블, RLS, RPC 함수)
│
├── docs/                       # 디자인 문서 및 UI 레퍼런스
│   ├── font_color_guide.md     # 폰트/컬러 디자인 가이드
│   ├── prd.md                  # 제품 요구사항 정의서 (PRD)
│   └── ui/                     # UI 레퍼런스 스크린샷
│
└── src/
    ├── main.js                 # 앱 부트스트랩 (createApp → Pinia → Router → Auth 초기화)
    ├── App.vue                 # 루트 컴포넌트 (router-view + 역할별 하단 네비게이션)
    │
    ├── assets/
    │   ├── css/
    │   │   └── global.css      # 디자인 시스템 (CSS 변수, 리셋, 기본 스타일)
    │   └── icons/              # SVG 아이콘 파일
    │
    ├── lib/
    │   └── supabase.js         # Supabase 클라이언트 인스턴스 (PKCE 인증 플로우)
    │
    ├── stores/
    │   └── auth.js             # 인증 스토어 (유저/프로필/역할/세션 상태 관리)
    │
    ├── router/
    │   └── index.js            # 라우트 정의 + 인증 가드 + 역할 기반 접근 제어
    │
    ├── composables/            # Supabase 데이터 접근 로직 (뷰에서 직접 호출 금지)
    │   ├── useMembers.js       # 트레이너의 회원 목록 조회 + 예약 통계
    │   ├── useInvite.js        # 초대 코드 생성/조회/사용 + 회원 연결
    │   ├── useWorkHours.js     # 근무시간 설정 조회/저장 (요일별 시간표)
    │   ├── useTrainerSearch.js # 트레이너 검색 + 연결 요청
    │   ├── useProfile.js       # 프로필 이미지 업로드 (Supabase Storage)
    │   ├── useMemos.js         # 회원 상세 정보 + 메모 CRUD
    │   ├── useReservations.js  # 예약 슬롯 계산, 생성, 목록 조회, 상태 변경
    │   ├── useChat.js          # 1:1 채팅 메시지 + 실시간 구독 (chat-files 버킷)
    │   ├── useNotifications.js # 알림 목록 + 읽음 처리
    │   ├── usePayments.js      # 수납 기록 CRUD (트레이너 관리)
    │   ├── usePtSessions.js    # PT 횟수 변경 이력 + 잔여 횟수 계산
    │   ├── useManuals.js       # 운동 매뉴얼 CRUD + manual-media 버킷
    │   ├── useWorkoutPlans.js  # 회원별 오늘의 운동 계획 CRUD
    │   └── useHolidays.js      # 트레이너 휴무일 관리
    │
    ├── components/             # 공유 UI 컴포넌트 (App 접두사 = 범용)
    │   ├── AppButton.vue       # 버튼 (primary/secondary/outline 변형)
    │   ├── AppInput.vue        # 텍스트 입력 (v-model 호환, 아이콘 슬롯)
    │   ├── AppBottomSheet.vue  # 바텀 시트 모달 (Teleport + Transition)
    │   ├── AppCalendar.vue     # 달력 (날짜 선택 + 상태 dot 표시)
    │   ├── AppTimePicker.vue   # 시간 선택기 (스크롤 휠, 5분 간격)
    │   ├── ProgressBar.vue     # 온보딩 단계 표시 바
    │   ├── BottomNav.vue       # 회원용 하단 네비게이션
    │   └── TrainerBottomNav.vue # 트레이너용 하단 네비게이션
    │
    └── views/                  # 페이지 뷰 (도메인별 폴더 그룹)
        ├── auth/
        │   └── AuthCallbackView.vue    # OAuth 콜백 처리 (인증 후 역할 확인 → 라우팅)
        │
        ├── login/
        │   └── LoginView.vue           # 로그인 페이지 (카카오 OAuth 버튼)
        │
        ├── onboarding/
        │   ├── RoleSelectView.vue      # 역할 선택 (트레이너/회원)
        │   └── MemberProfileView.vue   # 회원 프로필 생성 (이름, 나이, 키, 몸무게, 목표)
        │
        ├── home/
        │   └── MemberHomeView.vue      # 회원 홈 대시보드 (다음 예약, 트레이너 정보)
        │
        ├── invite/
        │   ├── InviteManageView.vue    # [트레이너] 초대 코드 관리 (생성, 공유, 최근 회원)
        │   └── InviteEnterView.vue     # [회원] 초대 코드 입력 → 트레이너 연결
        │
        ├── common/
        │   └── NotificationListView.vue    # 알림 목록 (전체/미읽음 탭)
        │
        ├── member/
        │   ├── MemberScheduleView.vue      # 회원 스케줄/캘린더 (예약 현황 표시)
        │   ├── MemberReservationView.vue   # 예약 생성 (날짜/시간 선택 → RPC 호출)
        │   ├── MemberSettingsView.vue      # 회원 설정 (프로필 보기, 로그아웃)
        │   ├── MemberChatView.vue          # 트레이너와 1:1 채팅
        │   ├── MemberManualView.vue        # 운동 매뉴얼 목록 (트레이너 등록)
        │   ├── ManualDetailView.vue        # 매뉴얼 상세 + 미디어
        │   ├── MemberMemoView.vue          # 회원의 메모 목록 조회
        │   └── MemberProfileEditView.vue   # 회원 프로필 수정
        │
        └── trainer/
            ├── TrainerHomeView.vue             # 트레이너 홈 대시보드 (오늘 예약, 회원 수, 통계)
            ├── TrainerScheduleView.vue         # 트레이너 스케줄/캘린더 (예약 관리)
            ├── TrainerMemberView.vue           # 회원 목록 (연결된 회원 + 예약 통계)
            ├── TrainerMemberDetailView.vue     # 회원 상세 (프로필 + 메모 목록)
            ├── TrainerSearchView.vue           # [회원용] 트레이너 검색 + 연결 요청
            ├── TrainerProfileView.vue          # 트레이너 프로필 생성 (온보딩)
            ├── TrainerProfileEditView.vue      # 트레이너 프로필 수정
            ├── ReservationManageView.vue       # 예약 관리 (승인/거절/완료/취소)
            ├── WorkTimeSettingView.vue         # 근무시간 설정 (요일별 시간 + 단위 시간)
            ├── SettingsView.vue                # 트레이너 설정 (프로필, 근무시간, 로그아웃)
            ├── MemoWriteView.vue               # 회원 메모 작성/편집
            ├── TrainerChatView.vue             # 회원과 1:1 채팅
            ├── TrainerManualView.vue           # 운동 매뉴얼 목록 관리
            ├── ManualRegisterView.vue          # 운동 매뉴얼 등록/편집
            ├── TodayWorkoutView.vue            # 회원별 오늘의 운동 계획 작성
            ├── MemberPaymentView.vue           # 회원 수납 기록 목록
            ├── PaymentWriteView.vue            # 수납 기록 작성
            └── PtCountManageView.vue           # PT 횟수 관리 (충전/차감)
```

---

## 데이터베이스 스키마

Supabase PostgreSQL 기반. 모든 테이블에 RLS(Row Level Security) 적용.

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 기본 정보 (이름, 역할, 전화번호, 프로필 사진). `auth.users` FK |
| `trainer_profiles` | 트레이너 추가 정보 (전문 분야, 소개글) |
| `member_profiles` | 회원 추가 정보 (나이, 키, 몸무게, 목표) |
| `trainer_members` | 트레이너-회원 연결 관계 (초대 코드 기반, status: active/pending/disconnected) |
| `invite_codes` | 초대 코드 (트레이너가 생성, 회원이 입력하여 연결) |
| `work_schedules` | 트레이너 근무시간 (요일별 시작/종료 시간, 슬롯 단위) |
| `reservations` | PT 예약 (날짜, 시간, 상태: pending→approved→completed) |
| `memos` | 트레이너가 회원에게 작성하는 메모 |
| `messages` | 1:1 채팅 메시지 (파일 첨부 지원, 읽음 여부 포함) |
| `payments` | 수납 기록 (금액, 날짜, 메모 — 트레이너 관리) |
| `pt_sessions` | PT 횟수 변경 이력 (충전/차감/자동 차감) |
| `manuals` | 운동 매뉴얼 (제목, 카테고리, 설명, 유튜브 링크) |
| `manual_media` | 매뉴얼 첨부 미디어 (사진/영상 URL) |
| `workout_plans` | 오늘의 운동 계획 (트레이너 → 회원, 날짜별) |
| `notifications` | 알림 (예약/채팅/운동/PT횟수/수납 등 type별) |
| `trainer_holidays` | 트레이너 휴무일 (날짜 기반, 예약 불가 처리) |

### RPC 함수

| 함수 | 설명 |
|------|------|
| `connect_via_invite(p_code)` | 초대 코드로 트레이너-회원 연결. 중복/자기 연결 방지 로직 포함 |
| `create_reservation(...)` | 예약 생성. 트레이너-회원 연결 확인 + 시간 충돌 방지 + PT 잔여 횟수 검증 |

### Triggers

| 트리거 | 설명 |
|--------|------|
| `trg_auto_deduct_pt` | 예약 상태가 `completed`로 변경 시 PT 횟수 자동 -1 차감 |

### Storage

| 버킷 | 용도 |
|------|------|
| `avatars` | 프로필 이미지 저장 (public 읽기, 인증 사용자 업로드) |
| `chat-files` | 채팅 첨부 파일 (비공개, 최대 50MB) |
| `manual-media` | 운동 매뉴얼 미디어 (공개, 최대 500MB) |

---

## 주요 아키텍처

### 인증 플로우

```
카카오 로그인 버튼 클릭
  → Supabase OAuth (PKCE)
  → /auth/callback 리다이렉트
  → auth store: getSession() → fetchProfile()
  → 프로필 있음? → 역할에 따라 홈으로
  → 프로필 없음? → /onboarding/role (역할 선택)
```

### 데이터 접근 패턴

```
뷰(View) → 컴포저블(Composable) → Supabase Client → DB
```

- **뷰에서 Supabase 직접 호출 금지** — 반드시 composable을 경유
- 각 composable은 `loading`, `error` ref를 포함하여 UI 상태 관리

### 역할 기반 라우팅

| 역할 | 접근 가능 경로 | 하단 네비게이션 |
|------|---------------|----------------|
| `trainer` | `/trainer/*`, `/search`, `/invite/*` | TrainerBottomNav |
| `member` | `/member/*`, `/home`, `/invite/*` | BottomNav |
| 미인증 | `/login`, `/auth/callback` | 없음 |

---

## Supabase 설정 가이드

### 1. 카카오 OAuth 설정

1. [Kakao Developers](https://developers.kakao.com/) 앱 생성
2. 카카오 로그인 활성화 + Redirect URI 설정:
   - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Kakao 활성화
4. REST API 키와 Client Secret 입력

### 2. DB 스키마 적용

`supabase/schema.sql` 파일의 SQL을 Supabase SQL Editor에서 실행하거나,
Supabase MCP를 통해 마이그레이션으로 적용합니다.

### 3. Storage 버킷

스키마 SQL에 avatars 버킷 생성이 포함되어 있습니다.
수동 생성 시: Storage → New Bucket → `avatars` (Public)

---

## 컴포넌트 가이드

### 공유 컴포넌트 (src/components/)

| 컴포넌트 | Props | 설명 |
|----------|-------|------|
| `AppButton` | `variant` (primary/secondary/outline), `fullWidth`, `disabled` | 범용 버튼. slot으로 라벨 전달 |
| `AppInput` | `modelValue`, `type`, `placeholder` | v-model 호환 입력 필드 |
| `AppBottomSheet` | `modelValue`, `title` | v-model로 열고 닫는 바텀 시트 |
| `AppCalendar` | `modelValue` (YYYY-MM-DD), `dots` | 날짜 선택 + 상태 dot 표시 |
| `AppTimePicker` | `modelValue` (HH:MM) | 스크롤 휠 시간 선택기 |
| `ProgressBar` | `currentStep`, `totalSteps` | 온보딩 단계 표시 |
| `BottomNav` | — | 회원 하단 네비게이션 (홈/스케줄/채팅/매뉴얼/설정) |
| `TrainerBottomNav` | — | 트레이너 하단 네비게이션 (홈/스케줄/회원/채팅/설정) |

---

## 개발 규칙

- **`<script setup>` only** — Options API 사용 금지
- **`@/` alias** — 모든 내부 import에 사용 (`../..` 금지)
- **CSS Custom Properties** — 하드코딩된 색상/크기 금지
- **BEM 네이밍** — `.block__element--modifier`
- **Scoped 스타일** — 작은 컴포넌트는 인라인, 큰 뷰는 `.css` 동반 파일
- **모바일 퍼스트** — 최대 너비 480px 레이아웃
- **Lazy Loading** — 모든 뷰는 라우터에서 동적 import

---

## 구현 완료 기능 (Phase 2)

| 기능 | 관련 뷰 | 상태 |
|------|---------|------|
| 채팅 | TrainerChatView, MemberChatView | ✅ 구현 완료 |
| 운동 매뉴얼 | TrainerManualView, ManualRegisterView, MemberManualView, ManualDetailView | ✅ 구현 완료 |
| 오늘의 운동 | TodayWorkoutView | ✅ 구현 완료 |
| 수납 기록 | MemberPaymentView, PaymentWriteView | ✅ 구현 완료 |
| 메모 작성 | MemoWriteView, MemberMemoView | ✅ 구현 완료 |
| 알림 시스템 | NotificationListView | ✅ 구현 완료 |
| 프로필 수정 | TrainerProfileEditView, MemberProfileEditView | ✅ 구현 완료 |
| PT 횟수 관리 | PtCountManageView | ✅ 구현 완료 |
| 계정 삭제 | — | 미구현 |
