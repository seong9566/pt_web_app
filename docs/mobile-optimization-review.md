# FitLink 모바일 최적화 리뷰

**리뷰 일시**: 2026-03-24
**대상**: FitLink PWA (Vue 3 + Vite 5 + Pinia + Supabase, 480px 모바일 전용)
**리뷰 영역**: PWA 설정, CSS/터치 인터랙션, 성능 최적화

---

## 1. Executive Summary

### 전체 평가: B- (양호하나 핵심 개선 필요)

FitLink은 모바일 전용 PWA로서 기본 골격(lazy loading, Pinia 캐시, 시스템 폰트, 경량 의존성)은 잘 갖추고 있으나, **PWA 핵심 기능(Service Worker)이 부재**하고 **iOS Safe Area 대응이 무효화**되어 있어 실제 모바일 기기에서의 사용자 경험에 큰 차이가 발생합니다.

### 핵심 개선 사항 Top 5

| # | 항목 | 심각도 | 예상 효과 |
|---|------|--------|-----------|
| 1 | Service Worker 완전 부재 | Critical | 오프라인 지원, A2HS 설치, 캐싱 전략 |
| 2 | `viewport-fit=cover` 누락 → Safe Area 전체 무효화 | Critical | 노치/홈 인디케이터 대응, 10+개 파일 영향 |
| 3 | BottomNav Safe Area 패딩 누락 | Critical | iPhone X+ 하단 터치 불가 영역 해결 |
| 4 | Vite manualChunks 미설정 | Critical | 초기 로드 20-30% 개선, 캐시 적중률 |
| 5 | Supabase 순차 쿼리 Waterfall | Critical | 슬롯 조회 0.8~1.6초 → 0.2~0.4초 |

### 수치 요약

| 심각도 | PWA | CSS/터치 | 성능 | **합계** |
|--------|-----|---------|------|----------|
| Critical | 2 | 3 | 2 | **7** |
| Major | 4 | 5 | 6 | **15** |
| Minor | 3 | 6 | 5 | **14** |
| Suggestion | 3 | 4 | 5 | **12** |
| **소계** | 12 | 18 | 18 | **48** |

---

## 2. PWA 최적화 리뷰

### Critical (2건)

#### C-PWA-1. Service Worker 완전 부재
- **파일**: 프로젝트 전체
- **현황**: SW 파일 없음, `vite-plugin-pwa` 미설치, `main.js`에 SW 등록 코드 없음
- **영향**:
  - 오프라인 지원 불가 — 네트워크 없으면 앱 사용 불가
  - Chrome A2HS(홈 화면에 추가) 설치 프롬프트 미작동 (SW는 설치 요건)
  - 정적 자산 캐싱 없음 — 재방문 시 불필요한 네트워크 요청
  - 푸시 알림, 백그라운드 동기화 등 PWA 핵심 기능 사용 불가
- **수정 방안**:
  ```bash
  npm install -D vite-plugin-pwa
  ```
  ```js
  // vite.config.js
  import { VitePWA } from 'vite-plugin-pwa'
  export default defineConfig({
    plugins: [
      vue(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [{
            urlPattern: /^https:\/\/.*supabase.*\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
          }]
        }
      })
    ]
  })
  ```

#### C-PWA-2. manifest.json에 maskable 아이콘 누락
- **파일**: `public/manifest.json:9-12`
- **현황**: `purpose` 필드 없음. maskable 아이콘 미제공
- **영향**: Android 홈 화면 아이콘이 원형/사각형 마스크에 맞지 않아 잘려 보임
- **수정 방안**: maskable 전용 아이콘 제작 후 추가
  ```json
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
  ```

### Major (4건)

| ID | 항목 | 파일 | 설명 |
|----|------|------|------|
| M-PWA-1 | viewport 메타태그 최적화 부족 | `index.html:5` | `viewport-fit=cover`, `user-scalable=no` 미설정 → 노치 대응 불가, 더블탭 확대 |
| M-PWA-2 | manifest.json 필수/권장 필드 누락 | `public/manifest.json` | `orientation`, `scope`, `id`, `categories`, `lang`, `shortcuts` 등 |
| M-PWA-3 | apple-touch-icon 단일 사이즈 | `index.html:10` | 180x180 하나만 제공, 152/120 사이즈 없음 |
| M-PWA-4 | iOS 스플래시 스크린 미지원 | `index.html` | `apple-touch-startup-image` 없음 → 실행 시 흰 화면 |

### Minor (3건)

| ID | 항목 | 설명 |
|----|------|------|
| m-PWA-1 | 상태바 스타일 `default` | `black-translucent`로 변경 시 몰입감 향상 |
| m-PWA-2 | og:image 상대 경로 | 일부 크롤러에서 OG 이미지 미인식 |
| m-PWA-3 | 아이콘 사이즈 간격 큼 | 192→512 사이 96/144/384 추가 권장 |

### Suggestion (3건)

- PWA 업데이트 알림 UI (`vite-plugin-pwa`의 `registerType: 'prompt'` + 토스트)
- manifest.json shortcuts (예약, 스케줄 빠른 접근)
- robots.txt에 sitemap 추가

---

## 3. CSS/레이아웃/터치 리뷰

### Critical (3건)

#### C-CSS-1. `-webkit-text-size-adjust: 100%` 미적용
- **파일**: `src/assets/css/global.css` (body 영역)
- **현황**: iOS Safari 가로 회전/split view 시 브라우저가 텍스트 크기 자동 증가
- **수정안**:
  ```css
  body {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
  ```

#### C-CSS-2. `viewport-fit=cover` 누락 → Safe Area 전체 무효화
- **파일**: `index.html:5`
- **현황**: `env(safe-area-inset-*)` 값이 항상 `0` 반환
- **영향**: AppBottomSheet, PaymentWriteView, MemoWriteView 등 10개 파일에서 사용 중인 safe-area 패딩이 모두 무효화
- **수정안**:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```

#### C-CSS-3. BottomNav/TrainerBottomNav Safe Area 패딩 누락
- **파일**: `src/components/BottomNav.vue:105-119`, `src/components/TrainerBottomNav.vue:132-146`
- **현황**: `position: fixed; bottom: 0` — 홈 인디케이터와 겹침
- **수정안**:
  ```css
  .bottom-nav {
    padding-bottom: env(safe-area-inset-bottom, 0px);
    height: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px));
  }
  ```

### Major (5건)

| ID | 항목 | 파일 | 설명 |
|----|------|------|------|
| M-CSS-1 | 40+개 뷰에서 `100vh` 사용, `100dvh` 미적용 | 전체 뷰 CSS | 모바일 주소바 문제로 콘텐츠 잘림/불필요한 스크롤 |
| M-CSS-2 | 입력 필드 16px 글로벌 보장 필요 | global.css | iOS 자동 줌 방지 (AppInput은 양호, inline input 위험) |
| M-CSS-3 | `-webkit-tap-highlight-color` 글로벌 미설정 | global.css | 4개 뷰에서만 개별 적용, 나머지 기본 하이라이트 노출 |
| M-CSS-4 | ImageViewer/VideoViewer 닫기 버튼 40px | components | Apple HIG 44px 미달, 노치 근처 상단 우측 |
| M-CSS-5 | RealtimeBanner safe area 미적용 | RealtimeBanner.vue | `top: 0` → 노치/다이나믹 아일랜드 뒤로 가려짐 |

### Minor (6건)

| ID | 항목 | 설명 |
|----|------|------|
| m-CSS-1 | `overscroll-behavior` 글로벌 미적용 | PTR 없는 페이지에서도 바운스 |
| m-CSS-2 | AppConfirmDialog 오버레이 스크롤 잠금 없음 | 배경 스크롤 가능 |
| m-CSS-3 | AppToast safe area 미고려 | BottomNav safe area 적용 시 가려짐 |
| m-CSS-4 | `@media (hover: hover)` 미사용 | sticky hover 방지 |
| m-CSS-5 | BottomNav spacer 인라인 스타일 하드코딩 | 15+개 뷰, 유지보수 어려움 |
| m-CSS-6 | AppPullToRefresh `:deep(body)` 실효성 없음 | scoped 스타일 한계 |

### Suggestion (4건)

- `touch-action: manipulation` 글로벌 적용 (300ms 딜레이 방지)
- AppCalendar 날짜 셀 터치 타겟 40px → 44px
- AppBottomSheet 스와이프 다운 닫기 제스처
- 채팅 뷰 `visualViewport` API로 가상 키보드 대응

### 양호한 부분

- `:active` 터치 피드백 잘 적용됨
- `prefers-reduced-motion` 접근성 고려
- AppBottomSheet: reference counting 스크롤 잠금 + dvh 폴백 + overscroll-behavior
- AppCalendar/WeeklyCalendar/AvailabilityGrid: 44px 터치 타겟
- 로그인 폼 autocomplete 속성 적절

---

## 4. 성능 최적화 리뷰

### Critical (2건)

#### C-PERF-1. Vite 빌드에 manualChunks 미설정
- **파일**: `vite.config.js`
- **현황**: `build.rollupOptions` 없음. Supabase SDK (~130KB gzip)가 초기 번들에 포함
- **영향**: FCP/LCP 지연, vendor 캐시 효율 저하
- **수정안**:
  ```js
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
  ```

#### C-PERF-2. `fetchAvailableSlots` 순차 Supabase 호출 3~4회
- **파일**: `src/composables/useReservations.js:76-233`
- **현황**: 1회 호출에 최대 4개 순차 쿼리 (holiday → override → schedule → reservations)
- **영향**: 모바일 3G에서 0.8~1.6초 waterfall
- **수정안**: `Promise.all`로 병합하거나 서버 사이드 RPC 단일 함수로 통합

### Major (6건)

| ID | 항목 | 파일 | 설명 |
|----|------|------|------|
| M-PERF-1 | `loadMembers()` N+1 패턴 | `stores/members.js:36-130` | 2단계 순차 쿼리 + N개 개별 color UPDATE |
| M-PERF-2 | 주간 운동 카테고리 날짜별 순차 쿼리 | `stores/workoutPlans.js:48-86` | 최대 7개 순차 쿼리 → `.in('date', dates)` 1개로 가능 |
| M-PERF-3 | `select('*')` 13곳 과다 사용 | stores/composables 전반 | 불필요한 payload, 모바일 데이터 낭비 |
| M-PERF-4 | 이미지 `loading="lazy"` 미적용 | 프로젝트 전반 | 프로필 사진 한 번에 모두 로드 |
| M-PERF-5 | 채팅 대화 목록 전체 메시지 스캔 | `composables/useChat.js:36-104` | 100개 메시지 → 클라이언트 그룹화, 비효율적 |
| M-PERF-6 | Realtime 채널 동시 4~5개 | 다수 파일 | 채널 통합 가능, 배터리/네트워크 부담 |

### Minor (5건)

| ID | 항목 | 설명 |
|----|------|------|
| m-PERF-1 | `preloadMemberData` 2단계 직렬 | trainerId 캐싱으로 재진입 최적화 가능 |
| m-PERF-2 | `trimSeconds()` 3곳 중복 정의 | utils/time.js로 추출 권장 |
| m-PERF-3 | `_dirty` 플래그 전체 캐시 무효화 | per-key invalidation 미지원 |
| m-PERF-4 | keep-alive에 채팅 뷰 미포함 | 탭 전환마다 재렌더링 + 재호출 |
| m-PERF-5 | 시스템 폰트 스택 미명시 | 기기별 렌더링 차이 가능성 |

### Suggestion (5건)

- CSS 미사용 코드 분석 (`vite-bundle-visualizer`)
- Supabase SDK manualChunks 분리
- `@vue/cli-plugin-router` devDependency 제거 (Vite 프로젝트에 불필요)
- gzip/brotli 사전 압축 (`vite-plugin-compression`)
- Supabase Storage 이미지 transform (`?width=80&height=80`) 활용

### 양호한 부분

- 라우터 100% lazy loading
- Pinia TTL 캐시 패턴 일관 적용
- `preloadAllTabData()` 병렬 프리로드
- keep-alive + 탭 경로 키 전략
- console.log 프로덕션 제거
- 시스템 폰트 사용 (웹폰트 없음)
- Realtime 디바운스 300ms 적용
- 런타임 의존성 5개 — 매우 경량

---

## 5. 우선순위별 액션 플랜

### P0 — 즉시 수정 (1~2일)

1줄 수정으로 큰 효과를 내는 항목들입니다.

| # | 항목 | 난이도 | 예상 효과 |
|---|------|--------|-----------|
| 1 | `viewport-fit=cover` 추가 (index.html 1줄) | ⭐ | Safe Area 전체 활성화 — 10+개 파일 영향 |
| 2 | BottomNav/TrainerBottomNav safe area 패딩 | ⭐ | iPhone X+ 하단 터치 정상화 |
| 3 | `-webkit-text-size-adjust: 100%` (global.css 1줄) | ⭐ | iOS 가로 회전 텍스트 깨짐 방지 |
| 4 | `-webkit-tap-highlight-color: transparent` (global.css 1줄) | ⭐ | 터치 하이라이트 통일 |
| 5 | Vite `manualChunks` 설정 (vite.config.js) | ⭐ | 초기 로드 20-30% 개선 |
| 6 | nav-spacer CSS 클래스화 | ⭐⭐ | 15+개 뷰 인라인 스타일 정리 + safe area 일괄 반영 |

### P1 — 단기 개선 (1주)

사용자 경험에 직접 영향을 주는 항목들입니다.

| # | 항목 | 난이도 | 예상 효과 |
|---|------|--------|-----------|
| 7 | `100vh` → `100dvh` 폴백 (CSS 변수화) | ⭐⭐ | 모바일 주소바 문제 해결 |
| 8 | `vite-plugin-pwa` 설치 + SW 설정 | ⭐⭐⭐ | 오프라인 지원, A2HS, 정적 자산 캐싱 |
| 9 | manifest.json 필드 보강 | ⭐ | orientation 고정, 설치 경험 향상 |
| 10 | maskable 아이콘 제작/추가 | ⭐⭐ | Android 홈 화면 아이콘 품질 |
| 11 | 이미지 `loading="lazy"` 일괄 적용 | ⭐ | LCP 개선, 데이터 사용량 감소 |
| 12 | `select('*')` → 필요 컬럼만 (13곳) | ⭐ | payload 30-50% 감소 |
| 13 | ImageViewer/VideoViewer 닫기 버튼 44px + safe area | ⭐ | 터치 타겟 개선 |
| 14 | RealtimeBanner/AppToast safe area | ⭐ | 노치 대응 |

### P2 — 중기 개선 (2~4주)

성능 병목을 해소하는 항목들입니다.

| # | 항목 | 난이도 | 예상 효과 |
|---|------|--------|-----------|
| 15 | `fetchAvailableSlots` 쿼리 `Promise.all` 병합 | ⭐⭐ | 슬롯 조회 0.8~1.6초 → 0.2~0.4초 |
| 16 | 주간 운동 카테고리 단일 `.in()` 쿼리 | ⭐ | 7개 순차 → 1개 쿼리 |
| 17 | 채팅 뷰 keep-alive 추가 | ⭐⭐ | 탭 전환 시 재렌더링 방지 |
| 18 | Realtime 채널 통합 | ⭐⭐ | 채널 수 5→2~3, 배터리/네트워크 절감 |
| 19 | AppBottomSheet 스와이프 닫기 | ⭐⭐ | 모바일 UX 자연스러움 |
| 20 | `overscroll-behavior-y: contain` 글로벌 | ⭐ | 불필요한 바운스 방지 |
| 21 | `touch-action: manipulation` 글로벌 | ⭐ | 300ms 딜레이 방지 |
| 22 | iOS 스플래시 스크린 추가 | ⭐⭐ | 앱 실행 시 흰 화면 방지 |
| 23 | apple-touch-icon 다중 사이즈 | ⭐ | iOS 아이콘 선명도 |
| 24 | 입력 필드 font-size 16px 글로벌 보장 | ⭐ | iOS 자동 줌 방지 |

### P3 — 장기 개선 (1개월+)

서버 사이드 변경이 필요한 구조적 개선입니다.

| # | 항목 | 난이도 | 예상 효과 |
|---|------|--------|-----------|
| 25 | `loadMembers` 서버 RPC 통합 | ⭐⭐⭐ | 2+N 쿼리 → 1 쿼리 |
| 26 | 대화 목록 서버 사이드 그룹화 (RPC/뷰) | ⭐⭐⭐ | 채팅 응답 시간 개선 |
| 27 | Pinia per-key cache invalidation | ⭐⭐ | 정밀한 캐시 제어 |
| 28 | PWA 업데이트 알림 UI | ⭐⭐ | 배포 시 사용자 알림 |
| 29 | 채팅 가상 키보드 `visualViewport` 대응 | ⭐⭐ | 키보드 올라올 때 레이아웃 안정 |
| 30 | `@vue/cli-plugin-router` 제거 | ⭐ | 불필요한 devDependency 정리 |

---

## 6. 체크리스트

### PWA 설정
- [ ] Service Worker (vite-plugin-pwa) 설치 및 설정
- [ ] manifest.json — maskable 아이콘 추가
- [ ] manifest.json — orientation, scope, id, categories, lang 추가
- [ ] manifest.json — shortcuts 추가
- [ ] manifest.json — 아이콘 중간 사이즈(96, 144, 384) 추가
- [x] manifest.json — name, short_name, description, start_url, display ✅
- [x] manifest.json — theme_color/background_color 일관성 ✅
- [ ] apple-touch-icon 다중 사이즈 (180, 152, 120)
- [ ] apple-touch-startup-image (iOS 스플래시)
- [ ] apple-mobile-web-app-status-bar-style → black-translucent
- [ ] og:image 절대 URL
- [ ] PWA 업데이트 알림 UI
- [x] theme-color 메타태그 ✅
- [x] mobile-web-app-capable 태그 ✅
- [x] apple-mobile-web-app-capable 태그 ✅

### CSS / 모바일 레이아웃
- [ ] viewport-fit=cover 추가 (index.html)
- [ ] -webkit-text-size-adjust: 100% (global.css)
- [ ] -webkit-tap-highlight-color: transparent (global.css)
- [ ] touch-action: manipulation (인터랙티브 요소)
- [ ] BottomNav/TrainerBottomNav safe area padding
- [ ] RealtimeBanner safe area (top)
- [ ] AppToast safe area 반영
- [ ] ImageViewer/VideoViewer 닫기 버튼 44px + safe area
- [ ] 100vh → 100dvh 폴백 (CSS 변수)
- [ ] nav-spacer 글로벌 CSS 클래스
- [ ] overscroll-behavior-y: contain (body)
- [ ] AppConfirmDialog 스크롤 잠금
- [ ] 입력 필드 font-size 16px 글로벌
- [ ] AppCalendar 날짜 셀 44px
- [ ] AppBottomSheet 스와이프 닫기
- [ ] @media (hover: hover) 활용
- [x] :active 터치 피드백 ✅
- [x] press-effect + prefers-reduced-motion ✅
- [x] AppBottomSheet 스크롤 잠금 + dvh 폴백 ✅
- [x] 주요 컴포넌트 44px 터치 타겟 ✅
- [x] autocomplete 속성 적용 ✅

### 성능
- [ ] vite.config.js manualChunks 설정
- [ ] fetchAvailableSlots 쿼리 병합 (Promise.all / RPC)
- [ ] loadWeeklyWorkoutCategories .in() 단일 쿼리
- [ ] select('*') → 필요 컬럼만 (13곳)
- [ ] 이미지 loading="lazy" 일괄 적용
- [ ] 채팅 대화 목록 서버 사이드 그룹화
- [ ] Realtime 채널 통합
- [ ] 채팅 뷰 keep-alive 추가
- [ ] loadMembers 서버 RPC 통합
- [ ] trimSeconds() 유틸리티 추출
- [ ] per-key cache invalidation
- [ ] @vue/cli-plugin-router 제거
- [x] 라우터 100% lazy loading ✅
- [x] Pinia TTL 캐시 패턴 ✅
- [x] preloadAllTabData 병렬 프리로드 ✅
- [x] keep-alive + 탭 키 전략 ✅
- [x] console.log 프로덕션 제거 ✅
- [x] 시스템 폰트 사용 (웹폰트 없음) ✅
- [x] Realtime 디바운스 ✅
- [x] 경량 런타임 의존성 (5개) ✅

---

## 7. 사이드 이펙트 분석

각 제안사항이 기존 동작에 미치는 영향을 실제 코드 기반으로 분석한 결과입니다.

### 위험도 범례
- 🔴 **위험**: 동시 수정 필수이거나 회귀(regression) 가능성 높음
- 🟡 **주의**: 엣지 케이스 존재, 테스트 필요
- 🟢 **안전**: 사이드 이펙트 없음 또는 극히 미미

---

### 7.1 PWA 변경사항

| # | 변경 | 위험도 | 핵심 사이드 이펙트 | 동시 수정 필수 항목 |
|---|------|--------|-------------------|-------------------|
| 1 | vite-plugin-pwa + SW | 🔴 | OAuth 콜백(`/auth/callback`) 가로채기 위험. SW의 `navigateFallback`이 PKCE code exchange URL을 캐시된 index.html로 리다이렉트하면 **로그인 실패**. Pinia TTL 캐시와 SW 캐시 이중 캐싱. `public/manifest.json`과 플러그인 자동 생성 manifest 충돌 | `navigateFallbackDenylist: [/^\/auth\/callback/]` 설정, `public/manifest.json` 제거 후 플러그인 manifest 옵션으로 통합, 업데이트 알림 UI, E2E 테스트 SW 비활성화 |
| 2 | manifest.json 필드 추가 | 🟢 | 기존 동작에 영향 없음. maskable 아이콘은 별도 파일 제작 필요 | 없음 (SW 미도입 시) |
| 3 | viewport-fit=cover | 🟡 | `env(safe-area-inset-*)` 값이 0→34px로 활성화되어 **10개 파일의 레이아웃 즉시 변경**. BottomNav에 safe-area 패딩이 없어 홈 인디케이터 겹침 발생 | BottomNav 2개 safe-area 패딩, nav-spacer 20+개 업데이트, RealtimeBanner/AppToast 위치 조정 |
| 4 | apple-touch-icon/splash | 🟢 | 순수 HTML 태그 추가. 기존 동작 무관 | 없음 |
| 5 | status-bar black-translucent | 🟡 | 상태바가 투명해져 앱 배경(#FFFFFF) 위에 흰색 텍스트 → **시간/배터리 표시 안 보임**. 뷰 배경이 대부분 흰색이므로 가독성 문제 | viewport-fit=cover 선행 필수 + 상단 헤더 배경색 대응 또는 `default` 유지 권장 |

#### SW 도입 시 주의사항 상세

```
⚠️ 롤백 특이사항: SW는 코드에서 제거해도 이미 사용자 브라우저에 설치된 SW가 남아있음.
   완전 제거하려면 self.registration.unregister() 코드를 한 번 배포해야 함.
   → SW 도입은 "되돌리기 어려운 변경"에 해당
```

- `registerType: 'prompt'` 설정인데 업데이트 UI가 없으면 사용자가 구버전에 갇힘
- iOS Safari는 SW 지원이 제한적 (백그라운드 동기화, 푸시 미지원)
- E2E 테스트(Playwright)에서 SW가 네트워크 요청을 캐시하면 테스트 비결정적

#### 권장: SW 도입을 미루고 manifest/viewport만 먼저

| 옵션 | 장점 | 단점 |
|------|------|------|
| SW 지금 도입 | 오프라인, A2HS, 캐싱 | auth 위험, 롤백 어려움, 이중 캐싱 |
| SW 미루고 나머지 먼저 | 위험 최소화, 즉각적 UX 개선 | 오프라인 미지원 지속 |

---

### 7.2 CSS/레이아웃 변경사항

| # | 변경 | 위험도 | 핵심 사이드 이펙트 |
|---|------|--------|-------------------|
| 1 | viewport-fit=cover | 🔴 | 10곳의 `env(safe-area-inset-*)` 활성화 → 패딩 즉시 +34px. **단독 적용 금지** |
| 2 | BottomNav safe area | 🔴 | nav 높이 80px→114px 변경 → 20+개 뷰 nav-spacer 깨짐, AppToast 위치 불일치, fixed bottom 액션바 3곳 재계산 필요 |
| 3 | text-size-adjust | 🟢 | 시각적 변화 없음 (이미 480px 세로 고정) |
| 4 | tap-highlight transparent | 🟡 | `.press-effect`나 `:active`가 없는 요소(BottomNav router-link 등)에서 **터치 피드백 완전 상실** |
| 5 | 100vh→100dvh | 🔴 | 55+곳 영향. 특히 `height: 100vh`(min 아닌) 사용하는 **채팅방 패널 4곳**에서 키보드 열기/닫기 시 레이아웃 점프 위험 |
| 6 | nav-spacer 클래스 | 🟡 | 뷰별 여백이 다름 (+16/+24/+32/+80px) → 단일 클래스로 통일 불가. 변형 클래스 필요 |
| 7 | overscroll-behavior | 🟡 | **iOS rubber-band 스크롤 제거** → UX 이질감. AppPullToRefresh의 비작동 `:deep(body)` 코드는 해결됨 |
| 8 | touch-action manipulation | 🟢 | 기존 `touch-action: none`(WeeklyCalendar, ImageViewer)과 충돌 없음 (none이 우선) |
| 9 | 닫기 버튼 44px | 🟢 | 전체화면 오버레이 위 요소라 겹침 없음 |
| 10 | Banner/Toast safe area | 🟡 | #1 선행 필수. AppToast에 safe-area 추가 시 nav 높이에 이미 포함된 safe-area와 **이중 적용 위험** |

#### 원자적 변경 그룹 (반드시 한 묶음으로 배포)

```
viewport-fit=cover (#1)
  └→ BottomNav safe area (#2)
      └→ nav-spacer 글로벌 클래스 (#6)
          └→ AppToast/RealtimeBanner safe area (#10)
```

**이 4개는 하나만 적용하면 레이아웃이 깨집니다.**

#### 100dvh 전환 전략

| 패턴 | 전략 | 위험도 |
|------|------|--------|
| `min-height: 100vh` (~50곳) | dvh 폴백 안전 적용 | 🟢 |
| `height: 100vh` (채팅방 4곳) | `100svh` 사용 또는 유지 검토 | 🔴 |
| `#app`, `#container` (global.css) | dvh 적용 시 전체 앱 flex 레이아웃 재계산 | 🟡 |

#### nav-spacer 변형 클래스 설계 제안

```css
.nav-spacer        { height: calc(var(--nav-height) + 16px + env(safe-area-inset-bottom, 0px)); }
.nav-spacer--lg    { height: calc(var(--nav-height) + 32px + env(safe-area-inset-bottom, 0px)); }
.nav-spacer--fab   { height: calc(var(--nav-height) + 80px + env(safe-area-inset-bottom, 0px)); }
```

---

### 7.3 성능 변경사항

| # | 변경 | 위험도 | 핵심 사이드 이펙트 | 에러 처리 변경 |
|---|------|--------|-------------------|---------------|
| 1 | manualChunks | 🟢 | 순수 빌드 타임 변경. RLS/캐시 영향 없음 | 없음 |
| 2 | fetchAvailableSlots Promise.all | 🟡 | **완전 병렬화 불가** — 3단계가 2단계 결과에 의존 (조건부 분기). 4RTT→2RTT로 부분 병합만 가능 | `Promise.all`은 하나 실패 시 전체 reject. 현재 holiday 체크는 에러를 무시하지만 묶이면 전체 실패 → `Promise.allSettled` 사용 권장 |
| 3 | workoutPlans .in() 쿼리 | 🟡 | **빈 날짜 마커 누락 위험** — 현재는 결과 없어도 `_loaded_${date}` 마커 설정. .in() 변환 시 결과에 없는 날짜를 별도로 마커 처리 안 하면 영원히 stale로 매번 재조회 | 없음 |
| 4 | select('*') 컬럼 명시 | 🟡 | **누락 필드 undefined 접근 위험** — 특히 채팅 메시지(`useChat.js`)는 템플릿에서 다양한 필드를 참조. 모든 사용처 전수 조사 필수 | 기존 캐시 무효화 1회 필요 |
| 5 | 이미지 loading="lazy" | 🟢 | ATF(Above The Fold) 이미지에 적용하면 LCP 악화. 프로필 사진 헤더 등은 제외 필요 | 없음 |
| 6 | 채팅 서버 그룹화 | 🟡 | Realtime 핸들러가 로컬 `conversations.value`를 직접 조작 중 → RPC 결과 구조가 현재 클라이언트 그룹화 결과와 동일해야 함 | `SECURITY DEFINER` RPC 시 함수 내부에서 `auth.uid()` 검증 필수 |
| 7 | Realtime 채널 통합 | 🟡 | 서버 사이드 필터 느슨화 → 불필요한 이벤트 수신량 증가. **레퍼런스 카운팅** 메커니즘 필요 (공유 채널의 subscribe/unsubscribe) | 없음 |
| 8 | 채팅 뷰 keep-alive | 🔴 | **Realtime 구독 누수** — keep-alive 시 `onUnmounted` 미호출 → 채널 3개가 영원히 살아있음. `onDeactivated`/`onActivated`로 리팩토링 없이 **절대 적용 금지** | stale 메시지 데이터 표시 |
| 9 | loadMembers RPC | 🟡 | UI 변환 로직(`dotStatus`, `barColor` 등)을 SQL에 넣는 것은 부적절 → RPC는 데이터 조회/집계만, 변환은 클라이언트 유지. color 자동 할당 인덱스 기반이라 결과 순서 변경 시 색상 변동 | `SECURITY DEFINER` 시 `auth.uid()` 검증 필수 |

#### keep-alive 적용 시 필수 리팩토링

```js
// ❌ 현재 (keep-alive 시 호출 안 됨)
onUnmounted(() => { unsubscribe() })

// ✅ keep-alive 적용 시 변경 필수
onDeactivated(() => { unsubscribe() })
onActivated(() => {
  fetchConversations()
  subscribeToConversations()
})
```

#### fetchAvailableSlots 부분 병렬화 구조

```
현재: holiday → override → schedule → reservations (4 RTT)

가능한 최적화:
Promise.all([holiday, override, schedule])  // 3개 병렬 (1 RTT)
  → effectiveSchedule 결정
  → reservations 조회                       // 순차 (1 RTT)

결과: 4 RTT → 2 RTT (완전 병렬화는 불가)
```

---

### 7.4 안전한 적용 순서

```
=== Phase 1: 즉시 적용 가능 (사이드 이펙트 없음) ===
🟢 manifest.json 필드 추가 (orientation, scope, id, categories)
🟢 -webkit-text-size-adjust: 100%
🟢 touch-action: manipulation
🟢 닫기 버튼 44px
🟢 manualChunks 설정
🟢 이미지 loading="lazy" (ATF 제외)

=== Phase 2: 원자적 묶음 배포 (한 번에 전부) ===
🔴 viewport-fit=cover
🔴 BottomNav/TrainerBottomNav safe area padding
🔴 nav-spacer 글로벌 클래스 (변형 포함)
🟡 RealtimeBanner/AppToast safe area (이중 적용 주의)

=== Phase 3: 개별 주의사항 확인 후 적용 ===
🟡 -webkit-tap-highlight-color (press-effect 없는 요소 확인)
🟡 overscroll-behavior-y (iOS UX 테스트)
🟡 100vh→100dvh (min-height부터, height:100vh 4곳은 별도 검토)
🟡 select('*') 컬럼 명시 (템플릿 전수 조사)
🟡 workoutPlans .in() 쿼리 (빈 날짜 마커 처리)

=== Phase 4: 라이프사이클/서버 변경 동반 ===
🔴 채팅 뷰 keep-alive (onDeactivated/onActivated 리팩토링 필수)
🟡 fetchAvailableSlots Promise.allSettled (부분 병렬화)
🟡 채팅 서버 그룹화 (RPC + Realtime 핸들러 호환)
🟡 loadMembers RPC (데이터 조회만, 변환은 클라이언트)
🟡 Realtime 채널 통합 (레퍼런스 카운팅 설계)

=== Phase 5: 신중한 도입 ===
🔴 Service Worker (auth callback 예외, 업데이트 UI, 이중 캐싱 대응)
🟡 status-bar black-translucent (흰 배경 가독성 문제 해결 후)
```

### 7.5 테스트 매트릭스

| 변경 그룹 | iPhone Safari | iPhone PWA | Android Chrome | 삼성 인터넷 |
|-----------|:---:|:---:|:---:|:---:|
| Phase 1 (독립) | 확인 | 확인 | 확인 | 확인 |
| Phase 2 (safe area) | **필수** | **필수** (홈바) | 확인 (무해) | 확인 |
| 100dvh 전환 | **필수** (주소창) | 필수 | 필수 | **필수** (폴백) |
| overscroll-behavior | **필수** (바운스) | 필수 | 필수 (새로고침) | 확인 |
| keep-alive | 필수 | 필수 | 필수 | 필수 |
| Service Worker | **필수** (auth) | **필수** | 필수 | 필수 |

---

## 부록: 상세 리뷰 파일

| 영역 | 파일 위치 |
|------|----------|
| PWA 설정 리뷰 | `.omc/research/pwa-review.md` |
| CSS/터치 인터랙션 리뷰 | `.omc/research/css-touch-review.md` |
| 성능 최적화 리뷰 | `.omc/research/performance-review.md` |
