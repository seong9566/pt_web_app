# ManualRegisterView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/ManualRegisterView.md
> 참조한 소스 파일: src/views/trainer/ManualRegisterView.vue, src/views/trainer/ManualRegisterView.css, src/composables/useManuals.js, src/composables/useConfirm.js
> 리뷰 라운드: 1회 (최종 판정: NEEDS_IMPROVEMENT 반영 후 최종본)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | 미저장 이탈 방지 이슈를 Critical로 상향 필요, 저장 후 800ms 자동 이동 패턴이 앱 공통 이슈임을 명시, 영상 제한 로직의 UX 문제 severity 상향, 기존 useConfirm 시스템 활용 권장, "메뉴얼" 표기 혼용이 코드 전반에 걸쳐 있음 확인 |

---

## 최종 리뷰 내용

### 개요
- **파일**: `src/views/trainer/ManualRegisterView.vue` + `ManualRegisterView.css`
- **역할**: 트레이너가 운동 매뉴얼을 등록/수정하는 폼 화면. 카테고리 선택, 제목/설명 입력, 사진/영상 첨부, YouTube URL 입력 기능 제공
- **리뷰 일자**: 2026-03-20

### 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 수정 모드 로딩 상태 없음, 에러가 인라인 텍스트만 |
| 터치 타겟 | 4 | 대부분 44px 이상, 미디어 삭제 버튼만 22px |
| 스크롤/인터랙션 | 2 | 미저장 이탈 방지 없음, 키보드 처리 부족 |
| 시각적 일관성 | 4 | 디자인 토큰 잘 준수, 칩/입력 패턴 일관 |
| 접근성 | 3 | 필수 필드 표시(*) 있으나, 미디어 삭제 라벨 없음 |
| 정보 밀도 | 5 | 적절한 섹션 분리, 한 화면에 과부하 없음 |
| 전체 사용성 | 3 | 기본 폼은 양호하나 에지 케이스와 상태 처리 부족 |

---

### Critical (즉시 수정 필요)

#### 1. 수정 모드에서 로딩 중 빈 폼이 표시됨 — 데이터 덮어쓰기 위험
- **위치**: `ManualRegisterView.vue:308-321` (`onMounted`)
- **문제**: `isEditMode`일 때 `fetchManual`을 호출하지만, 로딩 동안 빈 폼이 보임. 사용자가 기존 데이터 로드 전에 입력을 시작하면, `fetchManual` 완료 후 입력 내용이 덮어써짐. 특히 네트워크가 느린 모바일 환경에서 발생 확률 높음
- **개선안**: 수정 모드에서 데이터 로드 완료 전까지 폼 대신 스켈레톤 UI 표시
```html
<div v-if="isEditMode && loading" class="manual-reg__body-loading">
  <AppSkeleton type="line" :count="3" />
  <AppSkeleton type="rect" height="100px" />
  <AppSkeleton type="line" :count="2" />
</div>
<div v-else class="manual-reg__body">
  <!-- 기존 폼 -->
</div>
```

#### 2. 미저장 이탈 방지(route leave guard)가 없음
- **위치**: `ManualRegisterView.vue` 전체
- **문제**: `TodayWorkoutView`에는 `onBeforeRouteLeave` 가드가 있지만, ManualRegisterView에는 없음. 사용자가 긴 매뉴얼 설명과 여러 사진을 첨부한 후 실수로 뒤로가기를 누르면 모든 데이터가 손실됨. 특히 미디어 파일 첨부는 시간이 걸리는 작업이므로 데이터 유실의 사용자 불만이 큼
- **개선안**: TodayWorkoutView의 패턴 적용. 기존 `useConfirm.js` + `AppConfirmDialog.vue` 시스템 활용 (window.confirm 사용 금지)
```js
const isDirty = computed(() => {
  return form.title.trim() || form.description.trim() ||
         mediaFiles.value.length > 0 || form.category
})
onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && !justSaved.value) {
    // useConfirm 사용
  } else {
    next()
  }
})
```

---

### Major (높은 우선순위)

#### 3. 미디어 삭제 버튼(22px) — 심각한 터치 타겟 미달
- **위치**: `ManualRegisterView.css:267-268` (`.manual-reg__media-remove { width: 22px; height: 22px }`)
- **사용자 영향**: 100px 썸네일 우상단의 22px 버튼을 정확히 누르기 매우 어려움. 실수로 썸네일을 탭하게 됨
- **개선안**: `width: 28px; height: 28px`로 확대하되, 실제 터치 영역은 `padding`으로 더 넓게 잡기
```css
.manual-reg__media-remove {
  width: 28px;
  height: 28px;
  margin: -4px -4px 0 0;
  padding: 4px;
}
```

#### 4. 카테고리 미선택 시 에러 메시지가 토스트로만 표시 — 인라인 에러와의 비일관성
- **위치**: `ManualRegisterView.vue:271-273`
- **문제**: `showError('카테고리는 필수 선택 항목입니다')`로 토스트 표시하지만, 카테고리 섹션은 화면 상단에 있을 수 있어 사용자가 어디를 수정해야 하는지 모름. 제목은 인라인 에러 메시지(`titleError`)가 있는데 카테고리에는 없는 비일관성
- **개선안**: 카테고리에도 인라인 에러 메시지 추가 + 해당 섹션으로 `scrollIntoView`
```html
<p v-if="categoryError" class="form-error-text">카테고리를 선택해주세요</p>
```

#### 5. 영상 1개 제한 로직에 UX 문제 — 이미 선택한 이미지까지 버려짐
- **위치**: `ManualRegisterView.vue:227-232` (`handleFileChange`)
- **문제**: 파일 선택기에서 여러 파일을 고를 때 영상이 포함되어 있고 이미 영상이 1개 있으면, `return`으로 전체 추가가 취소됨. 사용자가 이미지 5장 + 영상 1개를 동시에 선택했는데 기존 영상 때문에 이미지 5장까지 모두 버려지는 상황
- **개선안**: 영상만 건너뛰고 이미지는 정상 추가
```js
for (const file of toAdd) {
  if (file.type.startsWith('video/') && hasVideo.value) {
    showError('영상은 1개만 등록할 수 있습니다')
    continue  // return 대신 continue
  }
  // ... 추가 로직
}
```

#### 6. 저장 버튼 disabled 조건이 제목만 체크 — 카테고리 필수인데 반영 안 됨
- **위치**: `ManualRegisterView.vue:165` (`:disabled="!form.title.trim() || loading"`)
- **문제**: 카테고리가 필수(`handleSave`에서 체크)인데 disabled 조건에는 빠져있음. 사용자가 제목만 입력하고 저장 시도 -> 에러 토스트 -> 혼란
- **개선안**: `:disabled="!form.title.trim() || !form.category || loading"`

#### 7. YouTube URL 유효성 검증 없음
- **위치**: `ManualRegisterView.vue:147` (`type="url"`)
- **문제**: `type="url"`만으로는 YouTube URL 형식을 검증하지 않음. 잘못된 URL을 입력해도 저장됨
- **개선안**: YouTube URL 패턴 검증 추가 (필수는 아니므로 빈 값은 허용). 유효한 URL이면 실시간으로 썸네일 미리보기 표시하면 추가 UX 개선

#### 8. [신규] 저장 후 800ms 자동 뒤로가기 — 앱 전체 공통 안티패턴
- **위치**: `ManualRegisterView.vue:291` (수정 모드), `:303` (등록 모드)
- **문제**: 저장 성공 후 800ms 뒤 자동 이동하는 패턴이 앱 전체에 반복됨 (`MemoWriteView`, `PaymentWriteView`, `TrainerProfileEditView`, `WorkTimeSettingView` 등). 수정 모드는 `safeBack`, 등록 모드는 `router.push({ name: 'trainer-manual' })`로 이동 대상이 다르지만 패턴은 동일
- **개선안**: 앱 전체 저장 후 이동 정책 통일 필요

---

### Minor (개선 권장)

#### 9. 카테고리 칩 높이 36px — 최소 기준에 근접하지만 약간 부족
- **위치**: `ManualRegisterView.css:166` (`.manual-reg__chip { height: 36px }`)
- **개선안**: `height: 40px`으로 변경

#### 10. "메뉴얼"과 "매뉴얼" 표기 혼용
- **위치**: `ManualRegisterView.vue:37` ("메뉴얼 이름"), `:43` ("메뉴얼 제목을 입력하세요"), `:259,267` ("메뉴얼 이름을 입력해주세요")
- **문제**: 파일명과 헤더 타이틀은 "매뉴얼"인데 폼 라벨과 에러 메시지에서는 "메뉴얼"로 표기. 사용자에게 혼란
- **개선안**: 전체 "매뉴얼"로 통일. 코드와 UI 문자열 모두 일괄 치환

#### 11. 기존 미디어 삭제 시 확인 없이 즉시 제거
- **위치**: `ManualRegisterView.vue:251-255` (`removeExistingMedia`)
- **문제**: 수정 모드에서 기존 첨부 파일을 삭제할 때 확인 없이 UI에서 즉시 제거. 실수로 삭제 후 저장하면 복구 불가
- **개선안**: 삭제 시 토스트 + "되돌리기" 옵션 (Undo 패턴). 또는 기존 `useConfirm` 시스템으로 삭제 확인

#### 12. 설명 textarea에 글자 수 제한 표시 없음
- **위치**: `ManualRegisterView.vue:54-59`
- **개선안**: 제목처럼 `maxlength` 설정 + 현재 글자 수 표시

#### 13. footer 하단 fixed 버튼과 body 하단 100px spacer의 하드코딩
- **위치**: `ManualRegisterView.vue:158` (`height: 100px`)
- **문제**: footer 높이 변경 시 spacer도 수동 수정 필요. footer 실제 높이는 `var(--btn-height) + 24px + env(safe-area-inset-bottom)` ≈ 76~90px
- **개선안**: CSS 변수 활용 또는 footer 높이 기반 동적 계산. 주석으로 계산 근거 명시

#### 14. [신규] 미디어 삭제 버튼에 접근성 라벨 없음
- **위치**: `ManualRegisterView.vue:98-102`, `:119-123`
- **개선안**: `aria-label="미디어 삭제"` 추가

---

### Good (잘된 점)
- 필수 필드에 빨간 `*` 표시가 시각적으로 명확
- 미디어 섹션에 "사진 최대 10장, 영상 1개" 안내가 사전에 표시됨
- `totalMediaCount` computed로 미디어 제한을 체계적으로 관리
- YouTube URL 입력에 아이콘이 있어 용도가 직관적
- 입력 필드의 `focus` 상태에 `border-color` 변경과 배경색 변경이 함께 적용되어 명확한 피드백
- footer의 `env(safe-area-inset-bottom)` 처리가 잘 되어 있음
- `existingMedia`와 `removedMediaIds`로 수정 모드의 미디어 관리가 체계적
- 파일 선택 후 `e.target.value = ''` 리셋으로 같은 파일 재선택 가능
- 헤더 뒤로가기 버튼이 44px로 양호

---

### 토스 앱 참고 개선안
1. **저장 버튼 상태 시각화**: 폼이 완성되면 저장 버튼 색상이 변하면서 "저장 가능" 상태를 시각적으로 알림
2. **미디어 업로드 프로그레스**: 저장 시 각 미디어 파일의 업로드 진행률을 표시
3. **실시간 YouTube 미리보기**: URL 입력 후 유효한 YouTube 링크면 썸네일 미리보기 표시
4. **폼 자동 저장(Draft)**: 작성 중 데이터를 localStorage에 임시 저장하여 실수로 이탈해도 복구 가능
5. **Undo 패턴**: 미디어 삭제 시 토스트 + "되돌리기" 옵션

---

### 구조 개선 제안 (참고용)
1. **AppSkeleton 도입**: 수정 모드 로딩 상태에 스켈레톤 UI 적용
2. **폼 유효성 검증 통합**: `titleError`, `categoryError` 등을 하나의 `errors` reactive 객체로 관리하고 `validateAll()` 함수로 통합
3. **미디어 관리 로직 composable 분리**: `useMediaUpload()` 같은 composable로 파일 선택, 미리보기, 삭제 로직을 분리하면 MemoWriteView에서도 재사용 가능
4. **"메뉴얼" -> "매뉴얼" 전체 치환**: 코드와 UI 문자열 모두 통일
5. **기존 확인 시스템 활용**: `useConfirm.js` + `AppConfirmDialog.vue`를 이탈 방지 및 삭제 확인에 활용
