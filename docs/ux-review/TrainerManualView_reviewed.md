# TrainerManualView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/TrainerManualView.md
> 참조한 소스 파일: src/views/trainer/TrainerManualView.vue, src/views/trainer/TrainerManualView.css, src/composables/useManuals.js
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | FAB 위치 이슈의 개선안이 불완전(앱 중앙 정렬 시 right 계산 부정확), 이미지 @error fallback 추가 필요, 카드 접근성(role/aria) 누락 미기재, nav spacer 80px 매직넘버의 의도 명확화 필요 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/TrainerManualView.vue` + `TrainerManualView.css`
- **역할**: 트레이너의 운동 매뉴얼 목록 화면. 검색, 카테고리 필터, 2열 그리드 카드, FAB(등록하기) 제공
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 4 | AppSkeleton 사용, 빈 상태 아이콘+메시지 제공 |
| 터치 타겟 | 4 | 헤더 버튼 44px 양호, 검색 클리어 24px 미달 |
| 스크롤/인터랙션 | 3 | 무한스크롤/페이지네이션 없음, 풀투리프레시 없음 |
| 시각적 일관성 | 4 | 디자인 토큰 잘 준수, 카드 디자인 일관적 |
| 접근성 | 3 | 카드에 role/aria 속성 없음, 이미지 alt 동적이나 fallback 없음 |
| 정보 밀도 | 5 | 2열 그리드가 480px 화면에 적절, 카드 정보량 적정 |
| 전체 사용성 | 4 | 깔끔한 목록 화면, 데이터 많아질 때 성능 고려 필요 |

---

### Critical (즉시 수정 필요)

없음 - 목록 화면으로 치명적 이슈 없음

---

### Major (높은 우선순위)

#### 1. 매뉴얼 개수 증가 시 성능 문제 — 페이지네이션/무한스크롤 없음
- **위치**: `TrainerManualView.vue:150-163` (`filteredManuals` computed)
- **문제**: `manuals.value` 전체를 한 번에 렌더링. 매뉴얼이 100개 이상이면 DOM 노드 과다로 스크롤 성능 저하, 이미지 동시 로딩으로 네트워크 병목
- **개선안**: 무한 스크롤 또는 "더 보기" 버튼 방식 페이지네이션 도입. 이미지에 `loading="lazy"` 속성 추가
```html
<img v-if="getThumbUrl(manual)" :src="getThumbUrl(manual)" loading="lazy" ... />
```

#### 2. FAB 위치가 하단 네비게이션 바와 겹칠 수 있음
- **위치**: `TrainerManualView.css:254-273` (`.manual-list__fab { bottom: 24px; right: 20px }`)
- **문제**: `bottom: 24px`인데 `--nav-height: 68px`이므로, 하단 네비게이션 바 바로 위에 위치하여 겹칠 가능성. 또한 `right: 20px`는 앱이 480px 내에서 중앙 정렬될 때 레이아웃 외부에 위치할 수 있음
- **개선안**: `bottom: calc(var(--nav-height) + 24px)`로 네비게이션 바 위에 배치. `right` 값은 앱의 `max-width` 컨테이너 기준으로 계산. 480px 이상 화면에서 FAB이 중앙 레이아웃 밖으로 나가지 않도록 미디어 쿼리 추가
```css
.manual-list__fab {
  bottom: calc(var(--nav-height) + 24px);
  right: var(--side-margin);
}
@media (min-width: 480px) {
  .manual-list__fab {
    right: calc(50% - 240px + var(--side-margin));
  }
}
```

#### 3. 검색 후 결과 없을 때의 빈 상태 메시지가 구분되지 않음
- **위치**: `TrainerManualView.vue:58-64`
- **문제**: 카테고리 필터링 결과 없음, 검색 결과 없음, 매뉴얼 자체가 없음 — 세 경우 모두 같은 "등록된 매뉴얼이 없습니다" 메시지 표시
- **개선안**: 조건별 다른 메시지
  - 검색 결과 없음: "'XXX' 검색 결과가 없습니다" + 검색어 초기화 버튼
  - 카테고리 필터 결과 없음: "'{카테고리}' 카테고리에 등록된 매뉴얼이 없습니다"
  - 매뉴얼 자체 없음: "아직 등록된 매뉴얼이 없습니다" + 등록 CTA 버튼

#### 4. 검색 입력 시 디바운스 없음
- **위치**: `TrainerManualView.vue:139` (`searchQuery`)
- **문제**: `v-model`로 직접 바인딩되어 매 키입력마다 `filteredManuals` computed가 재계산됨. 현재는 클라이언트 사이드 필터링이라 데이터가 적으면 문제없지만, 매뉴얼 수가 증가하면 입력 지연 발생 가능
- **개선안**: 200~300ms 디바운스 적용

#### 5. [신규] 카드 썸네일 이미지 로딩 실패 시 fallback 없음
- **위치**: `TrainerManualView.vue:76-79`
- **문제**: `<img>` 태그에 `@error` 핸들러가 없어 이미지 로딩 실패 시 깨진 이미지 아이콘이 표시됨. YouTube 썸네일 URL이 만료되거나 Storage URL이 변경되면 발생
- **개선안**: `@error` 핸들러로 이미지 숨기고 placeholder 표시
```html
<img v-if="getThumbUrl(manual)" :src="getThumbUrl(manual)" :alt="manual.title"
     class="manual-list__card-thumb-img"
     @error="e => e.target.closest('.manual-list__card-thumb').innerHTML = '<div class=\"manual-list__card-placeholder\">...</div>'" />
```

---

### Minor (개선 권장)

#### 6. 검색 클리어 버튼(24px) 터치 타겟 부족
- **위치**: `TrainerManualView.css:88-89` (`.manual-list__search-clear { width: 24px; height: 24px }`)
- **개선안**: `width: 36px; height: 36px`으로 확대, 아이콘은 현재 크기 유지

#### 7. 카테고리 칩 높이 36px — 최소 기준에 근접하지만 약간 부족
- **위치**: `TrainerManualView.css:117`
- **개선안**: `height: 40px`으로 변경

#### 8. 카드 메타 정보의 CSS 클래스명이 실제 콘텐츠와 불일치
- **위치**: `TrainerManualView.vue:94-96`
- **문제**: `.manual-list__card-duration`에 트레이너 이름 표시, `.manual-list__card-level`에 작성일 표시. 클래스명과 실제 데이터가 맞지 않아 유지보수 시 혼란
- **개선안**: 클래스명을 `.manual-list__card-trainer`, `.manual-list__card-date`로 변경

#### 9. 헤더가 `sticky`이지만 검색/카테고리는 스크롤됨
- **위치**: `TrainerManualView.css:13-24`
- **문제**: 헤더만 sticky이고 검색바와 카테고리 칩은 스크롤과 함께 사라짐. 사용자가 목록 아래로 스크롤한 후 검색하려면 다시 최상단으로 올라가야 함
- **개선안**: 검색바 + 카테고리 칩도 sticky로 고정. 또는 스크롤 다운 시 상단에 미니 검색바가 나타나는 패턴

#### 10. nav spacer 높이에 80px 추가분이 있음
- **위치**: `TrainerManualView.vue:104` (`height: calc(var(--nav-height) + 80px)`)
- **문제**: 80px는 FAB 높이(52px) + 여유분(28px)을 고려한 것으로 보이나, 매직넘버 사용으로 의도가 불명확
- **개선안**: CSS 변수 활용 또는 주석으로 의도 명시. 예: `/* FAB 52px + 여유분 28px */`

#### 11. [신규] 카드에 role/aria 속성 없음
- **위치**: `TrainerManualView.vue:67-99`
- **문제**: 카드 div가 `@click`으로 클릭 가능하지만 `role="button"` 또는 `role="link"`가 없어 스크린 리더 사용자가 인터랙션 가능한 요소인지 알 수 없음
- **개선안**: `role="button"` + `tabindex="0"` 추가

---

### Good (잘된 점)
- 2열 그리드 레이아웃이 480px 모바일 화면에 최적화됨
- 카드의 `aspect-ratio: 4/3` 썸네일이 일관된 비율 유지
- `AppSkeleton`을 활용한 로딩 상태가 잘 구현됨
- 빈 상태에 아이콘 + 메시지가 있어 사용자에게 현재 상태를 명확히 전달
- FAB 디자인이 깔끔 (box-shadow, 라운드, 아이콘+텍스트)
- 카드 `active` 상태에 `scale(0.97)` 트랜스폼이 자연스러운 터치 피드백 제공
- sticky 헤더로 뒤로가기 접근성 확보
- 검색 클리어 버튼이 조건부 렌더링되어 깔끔
- 헤더 뒤로가기 버튼이 44px로 양호 (다른 화면의 40px과 차이)

---

### 토스 앱 참고 개선안
1. **스크롤 시 헤더 축소**: 토스처럼 스크롤 다운 시 큰 헤더가 작은 헤더로 축소되면서 검색바는 유지
2. **카드 이미지 lazy loading**: `loading="lazy"` 속성 또는 `IntersectionObserver` 기반 lazy loading으로 초기 로딩 성능 개선
3. **풀투리프레시**: 매뉴얼 목록을 아래로 당겨서 새로고침하는 패턴
4. **빈 상태 CTA**: 매뉴얼이 없을 때 "첫 매뉴얼 등록하기" 버튼을 빈 상태 내에 배치

---

### 구조 개선 제안 (참고용)
1. **카드 컴포넌트 분리**: `ManualCard.vue`로 카드 UI를 분리하면 재사용 가능 (회원 뷰에서도 매뉴얼 카드 표시 가능)
2. **CSS 클래스명 정리**: `card-duration` -> `card-trainer`, `card-level` -> `card-date`
3. **검색 디바운스 유틸리티**: `useDebounce` composable을 만들어 다른 검색 기능에서도 재사용
4. **이미지 fallback 유틸**: `@error` 핸들러를 directive나 공통 composable로 추출하여 앱 전체에서 재사용
