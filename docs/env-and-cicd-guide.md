# 환경변수 & CI/CD 가이드

## 목차

1. [환경변수 파일 구조](#1-환경변수-파일-구조)
2. [각 파일의 역할](#2-각-파일의-역할)
3. [Vite 환경변수 로딩](#3-vite-환경변수-로딩)
4. [CI/CD 파이프라인](#4-cicd-파이프라인)
5. [Vercel 배포 구성](#5-vercel-배포-구성)
6. [전체 플로우 다이어그램](#6-전체-플로우-다이어그램)

---

## 1. 환경변수 파일 구조

```
pt_web_app/
├── .env.example          # 템플릿 (Git 추적 O) — 신규 개발자 온보딩용
└── .env.local            # 로컬 개발 환경변수 (Git 추적 X)
```

> **단일 파일 구조**: `.env.local` 하나로 모든 환경변수를 관리합니다.
> 기존의 `.env.development` / `.env.production` 분리 구조는 사용하지 않습니다.

### 환경변수 목록

| 변수명                    | 용도                                                  | 사용 위치             |
| ------------------------- | ----------------------------------------------------- | --------------------- |
| `VITE_SUPABASE_URL`       | Supabase 프로젝트 REST API URL                        | `src/lib/supabase.js` |
| `VITE_SUPABASE_ANON_KEY`  | Supabase 퍼블릭 anon 키 (RLS 기반 접근)               | `src/lib/supabase.js` |
| `VITE_KAKAO_REST_API_KEY` | 카카오 REST API 키 (카카오톡 공유 등 클라이언트 기능) | 카카오 SDK 초기화     |

> **참고**: 카카오 OAuth 로그인 자체는 Supabase Auth가 서버 사이드에서 처리하므로
> `VITE_KAKAO_REST_API_KEY`는 OAuth 로그인이 아닌 카카오톡 공유 등 클라이언트 SDK 기능에 사용됩니다.

---

## 2. 각 파일의 역할

### `.env.example` — 템플릿 (유일하게 Git에 커밋됨)

```bash
# 역할: 프로젝트에 필요한 환경변수 목록과 설정 가이드를 제공
# 대상: 신규 개발자, CI/CD 설정 시 참고용
# Git 추적: O (커밋됨)
# 실제 값: 포함하지 않음 (플레이스홀더만)
```

- 프로젝트를 처음 클론한 개발자가 "어떤 환경변수가 필요한지" 파악하는 용도
- 이 파일을 복사하여 `.env.local`을 생성: `cp .env.example .env.local`
- Vercel 환경변수 설정 가이드 주석 포함

---

### `.env.local` — 로컬 개발 환경변수

```bash
# 역할: 로컬 개발에 필요한 모든 환경변수를 보관
# 대상: Supabase 프로젝트 연결 + 카카오 SDK
# Git 추적: X (.gitignore에 등록)
# Vite 로딩 조건: 항상 (dev/build 모두)
```

| 변수                      | 연결 대상                                               |
| ------------------------- | ------------------------------------------------------- |
| `VITE_SUPABASE_URL`       | FitLink-KR 프로젝트 (`hprcudkmysjjhghnpoit`, 서울 리전) |
| `VITE_SUPABASE_ANON_KEY`  | FitLink-KR 프로젝트의 anon 키                           |
| `VITE_KAKAO_REST_API_KEY` | 카카오 REST API 키                                      |

- `npm run dev`와 `npm run build` 모두 이 파일의 값을 사용
- **Supabase 프로젝트는 단일 프로젝트** (FitLink-KR, 서울 리전)로 dev/prod 구분 없이 사용
- 무료 티어에서는 DB를 나누지 않으므로, 로컬 개발과 프로덕션이 동일한 DB를 가리킴

---

## 3. Vite 환경변수 로딩

Vite는 프로젝트 루트에서 `.env` 파일을 자동으로 로딩합니다.

### 현재 구조의 로딩 순서

```
npm run dev 또는 npm run build 실행 시:

1. .env              ← 공통 기본값 (현재 없음)
2. .env.local         ← 로컬 환경변수 ⭐ 최종 적용

결과: .env.local의 값이 사용됨
```

> **단순 구조**: `.env.local` 하나만 사용하므로 환경별 오버라이드 혼선이 없습니다.

### `VITE_` 접두사 규칙

- Vite는 보안상 `VITE_` 접두사가 있는 변수만 클라이언트 번들에 포함합니다.
- 코드에서 접근: `import.meta.env.VITE_SUPABASE_URL`
- `VITE_` 접두사가 없는 변수는 클라이언트 코드에서 사용할 수 없습니다.

---

## 4. CI/CD 파이프라인

### GitHub Actions (`/.github/workflows/ci.yml`)

```
트리거 조건:
  ✅ develop 브랜치에 push          → CI 실행
  ✅ main 브랜치로의 Pull Request    → CI 실행 (머지 전 검증)

  ❌ main 브랜치에 직접 push         → CI 실행 안 됨
  ❌ feature/* 브랜치에 push         → CI 실행 안 됨

동시성 제어:
  - 같은 브랜치에서 중복 실행 시 이전 실행 자동 취소
```

#### 파이프라인 구조

```
GitHub Actions CI
├── build (병렬 실행)
│   ├── actions/checkout@v4          # 코드 체크아웃
│   ├── actions/setup-node@v4        # Node.js 20 + npm 캐시
│   ├── npm ci                       # 의존성 설치 (lockfile 기반)
│   ├── npm run build                # Vite 프로덕션 빌드
│   └── actions/upload-artifact@v4   # dist/ 아티팩트 업로드
│
└── test (병렬 실행)
    ├── actions/checkout@v4
    ├── actions/setup-node@v4
    ├── npm ci
    └── npm test                     # Vitest 단위 테스트
```

- `build`와 `test`는 **독립적으로 병렬 실행**됨 (서로 의존 관계 없음)
- `npm ci`는 `package-lock.json` 기반으로 정확한 의존성을 설치 (재현 가능한 빌드)
- `cache: 'npm'`으로 `node_modules` 캐시를 활용해 설치 속도 향상

#### CI에서 환경변수는 어떻게?

- GitHub Actions에서 `npm run build` 시 `.env.local`이 없으므로 환경변수가 비어있음
- **실제 프로덕션 빌드는 Vercel에서 수행** — CI의 build job은 "빌드가 깨지지 않는지" 검증 용도
- Supabase 연결이 필요한 테스트가 있다면 GitHub Secrets에 환경변수 추가 필요

#### 프로덕션 배포 트리거

```
develop → main 으로 Pull Request 생성
  → GitHub Actions CI 실행 (빌드 + 테스트 검증)
  → CI 통과 + 코드 리뷰 완료
  → PR 머지 (main에 코드 반영)
  → Vercel이 main 브랜치 변경 감지 → Production 배포
```

> **핵심**: main 브랜치에 직접 push하지 않고, 반드시 develop에서 PR을 통해 머지합니다.

---

## 5. Vercel 배포 구성

### `vercel.json` 설정 파일

```json
{
  "rewrites": [...],     // SPA 라우팅 — 모든 경로를 index.html로
  "headers": [...]       // 보안 헤더 + 정적 에셋 캐시
}
```

| 설정                              | 역할                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| `rewrites`                        | 모든 URL을 `index.html`로 리다이렉트 (Vue Router 히스토리 모드 지원) |
| `X-Frame-Options: DENY`           | 클릭재킹 방지 — iframe 삽입 차단                                     |
| `X-Content-Type-Options: nosniff` | MIME 타입 스니핑 방지                                                |
| `X-XSS-Protection: 1; mode=block` | XSS 필터 활성화                                                      |
| `/assets/*` Cache-Control         | Vite 빌드 에셋에 1년 캐시 (파일명에 해시 포함되어 안전)              |

### Vercel 브랜치 배포 전략

```
Git 브랜치          Vercel 환경        배포 트리거
─────────────────  ────────────────  ──────────────────────
main               Production        develop → main PR 머지 시
develop            Preview           develop에 push 시
feature/*          Preview           push 시 (Vercel 자동)
```

### Vercel 환경변수 설정 (Dashboard)

```
Vercel Dashboard > Project Settings > Environment Variables

┌─────────────────────────┬───────────────┬───────────────┐
│ 변수명                    │ Production    │ Preview       │
├─────────────────────────┼───────────────┼───────────────┤
│ VITE_SUPABASE_URL       │ FitLink-KR    │ FitLink-KR    │
│ VITE_SUPABASE_ANON_KEY  │ FitLink-KR    │ FitLink-KR    │
│ VITE_KAKAO_REST_API_KEY │ 카카오 키      │ (선택)         │
└─────────────────────────┴───────────────┴───────────────┘

⚠️  현재 무료 티어로 단일 Supabase 프로젝트(FitLink-KR)를 사용하므로
    Production과 Preview 모두 동일한 Supabase 값을 설정합니다.

⚠️  Vercel은 빌드 시 자체 환경변수를 주입하므로
    .env.local 파일은 Vercel 빌드에 영향 없음
    (Git에 추적되지 않아 Vercel 서버에 존재하지 않음)
```

---

## 6. 전체 플로우 다이어그램

### 로컬 개발 플로우

```
개발자 로컬 머신
│
├── npm run dev
│   ├── Vite가 .env.local 로딩 (Supabase + 카카오 키)
│   └── localhost:5173 에서 개발 서버 실행
│       └── → FitLink-KR Supabase (서울 리전) 연결
│
└── npm run build (로컬 프로덕션 빌드 테스트)
    ├── Vite가 .env.local 로딩 (Supabase + 카카오 키)
    └── dist/ 폴더에 빌드 결과물 생성
```

### CI/CD 플로우

```
코드 변경
│
├── git push (develop 브랜치)
│   │
│   ├──── GitHub Actions 트리거 ────────────────────────┐
│   │     ├── build job: npm ci → npm run build          │
│   │     └── test job: npm ci → npm test                │
│   │                                                     │
│   └──── Vercel Preview 배포 ─────────────────────────┐  │
│         ├── Vercel Preview 환경변수 주입               │  │
│         ├── npm run build (FitLink-KR 연결)            │  │
│         └── → preview URL에 배포                       │  │
│                                                        │  │
└── Pull Request 생성 (develop → main)                   │  │
    │                                                    │  │
    ├── GitHub Actions CI 자동 실행 ─────────────────────┘  │
    │   ├── ✅ 통과 → PR에 체크 표시                         │
    │   └── ❌ 실패 → PR에 실패 표시, 머지 차단               │
    │                                                       │
    ├── Vercel Preview 배포 (PR별 고유 URL) ────────────────┘
    │   └── 리뷰어가 Preview URL에서 실제 동작 확인 가능
    │
    └── PR 머지 (main에 반영)
        └── Vercel Production 배포
            ├── Vercel Production 환경변수 주입
            ├── npm run build (FitLink-KR 연결)
            └── → production URL에 배포
```

### Supabase 프로젝트 구조

```
Supabase (단일 프로젝트)
└── FitLink-KR (hprcudkmysjjhghnpoit)
    ├── 리전: ap-northeast-2 (서울)
    ├── 플랜: Free tier
    ├── 용도: 개발 + 프로덕션 공용
    └── 연결: 로컬(.env.local) + Vercel(Production/Preview)
```

> **참고**: 무료 티어에서는 별도의 개발 DB를 두지 않고 단일 프로젝트를 사용합니다.
> 유료 플랜 전환 시 개발/프로덕션 프로젝트를 분리하는 것을 권장합니다.

---

## 부록: 자주 묻는 질문

### Q: 왜 `.env.development` / `.env.production` 파일을 사용하지 않나요?

**현재 무료 티어**로 Supabase 프로젝트를 하나만 운영하므로, 환경별로 다른 값을 넣을 필요가 없습니다. `.env.local` 하나에 모든 환경변수를 관리하는 것이 가장 단순합니다. 유료 플랜에서 dev/prod DB를 분리할 때 다시 도입할 수 있습니다.

### Q: Vercel 배포 시 `.env.local` 파일이 사용되나요?

**아닙니다.** `.env.local`은 `.gitignore`에 등록되어 Git에 포함되지 않으므로 Vercel 서버에 존재하지 않습니다. Vercel은 Dashboard에서 설정한 환경변수를 빌드 시 주입합니다.

### Q: 새로운 환경변수를 추가하려면?

1. `.env.example`에 변수명 + 설명 주석 추가 (Git 커밋)
2. `.env.local`에 실제 값 추가
3. Vercel Dashboard에 Production/Preview 환경별로 값 설정
4. 코드에서 `import.meta.env.VITE_변수명`으로 접근

### Q: `VITE_` 접두사가 없는 환경변수도 사용 가능한가요?

**클라이언트 코드에서는 불가능합니다.** Vite는 보안상 `VITE_` 접두사가 있는 변수만 클라이언트 번들에 포함합니다. 서버 사이드에서만 사용하는 변수(예: 빌드 스크립트)는 접두사 없이 사용 가능합니다.

### Q: 카카오 OAuth 설정은 어떻게 하나요?

새 Supabase 프로젝트(FitLink-KR)에서 카카오 OAuth를 사용하려면:

1. Supabase Dashboard → Authentication → Providers → Kakao 활성화
2. [Kakao Developers](https://developers.kakao.com/) 앱의 REST API 키와 Client Secret 입력
3. Kakao 앱 설정에서 Redirect URI 추가:
   - `https://hprcudkmysjjhghnpoit.supabase.co/auth/v1/callback`
4. 카카오 로그인 동의 항목 설정 (이메일, 프로필 등)
