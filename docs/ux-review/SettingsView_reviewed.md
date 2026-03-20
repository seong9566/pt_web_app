# SettingsView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/SettingsView.md
> 참조한 소스 파일: src/views/trainer/SettingsView.vue, src/views/trainer/SettingsView.css, src/components/AppBottomSheet.vue, src/composables/useProfile.js, src/stores/auth.js, src/router/index.js, src/main.js
> 리뷰 라운드: 3회 (최종 판정: 리뷰 문서 확정 - 소스 코드 수정은 별도 작업)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | Critical 2번 과장, Major 4번 추정 기반, Major 5번 제목 오류, 누락 이슈 5건 |
| 2 | NEEDS_IMPROVEMENT | 계정 삭제 성공 피드백 부재 근거 보강, :focus-visible 부재 추가, 키보드 가림 항목 분리 |
| 3 | 문서 확정 | GPT가 리뷰 문서의 모든 지적 사항이 소스 코드에서 실제로 존재함을 확인. 리뷰 문서 정확성 검증 완료. |

---

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 2 | 에러 상태 처리 부재 |
| 터치 타겟 | 4 | 메뉴 행 터치 영역 적절 |
| 스크롤/인터랙션 | 3 | 기본 동작은 양호 |
| 시각적 일관성 | 4 | 디자인 토큰 잘 준수 |
| 접근성 | 2 | aria 레이블 및 label 누락 |
| 정보 밀도 | 4 | 적절한 그루핑 |
| 전체 사용성 | 3 | 안정적이나 세부 미흡 |

---

## 최종 리뷰 내용

### Critical (즉시 수정 필요)

#### 1. 계정 삭제 실패 시 사용자 피드백 부재
- **위치**: `SettingsView.vue:193-202`
- **문제**: `softDeleteAccount()`가 실패(`ok === false`)할 경우 `deleting.value = false`만 설정하고, 사용자에게 실패 이유를 알려주는 토스트나 에러 메시지가 전혀 없다. `useProfile`의 `error` ref에 에러가 설정되지만 화면에 바인딩되어 있지 않다.
- **개선안**: `useToast`를 import하고 실패 시 `showToast(error.value || '계정 삭제에 실패했습니다.', 'error')`를 호출한다.

#### 2. 삭제 바텀시트에 명시적 취소 버튼 부재
- **위치**: `SettingsView.vue:139-147`
- **문제**: 계정 삭제라는 파괴적 액션의 바텀시트에 명시적 "취소" 버튼이 없다. 오버레이 탭으로만 닫을 수 있어, 사용자가 의도적으로 취소하려는 액션이 불명확하다.
- **개선안**: `취소 / 삭제` 2버튼 구조로 변경한다. `.settings__sheet-actions` 컨테이너 안에 취소 버튼과 삭제 버튼을 나란히 배치한다.

#### 3. 삭제 진행 중 바텀시트 닫기 가능
- **위치**: `SettingsView.vue:139`, `AppBottomSheet.vue:4`
- **문제**: `deleting` 상태에서도 `AppBottomSheet`의 오버레이 클릭으로 시트를 닫을 수 있다. 삭제 요청이 서버에서 진행 중인데 시트가 사라지면 사용자는 결과를 알 수 없다.
- **개선안**: `deleting` 중에는 오버레이 dismiss를 막거나, `AppBottomSheet`에 `closable` prop을 추가하여 제어한다.

### Major (높은 우선순위)

#### 4. 로그아웃 버튼 터치 타겟 크기 부족
- **위치**: `SettingsView.css:234-248`
- **문제**: 로그아웃 버튼의 padding이 `8px 16px`으로, 전체 높이가 약 36px 정도이다. 모바일 최소 권장 터치 타겟 44px에 미달한다.
- **개선안**: `min-height: 44px; padding: 12px 16px; display: inline-flex; align-items: center; justify-content: center;`로 변경한다.

#### 5. 계정 삭제 성공 시 스토어 미초기화 및 성공 피드백 부재
- **위치**: `SettingsView.vue:193-203`, `useProfile.js` (`softDeleteAccount` 함수)
- **문제**: 로그아웃 시에는 여러 Pinia 스토어를 `$reset()`하지만, 계정 삭제 성공 시에는 스토어 초기화 없이 바로 로그인 화면으로 이동한다. 메모리에 이전 사용자 데이터가 남을 수 있다. 또한 삭제 성공 시 사용자에게 "계정 삭제가 예약되었습니다" 같은 명시적 성공 피드백이 없다.
- **개선안**: 로그아웃과 삭제가 동일한 세션 정리 함수를 공유하도록 추출하고, 삭제 성공 시 성공 토스트를 표시한 후 로그인 화면으로 이동한다.

#### 6. 역할 뱃지 fallback 부정확
- **위치**: `SettingsView.vue:169-171`
- **문제**: `auth.role === 'trainer' ? '트레이너' : '회원'`으로 처리하여, role이 `null`이거나 예외 상태에서도 '회원'으로 표시된다.
- **개선안**: `auth.role === 'trainer' ? '트레이너' : auth.role === 'member' ? '회원' : ''`처럼 처리하고, 미확정 상태는 숨기거나 skeleton으로 대체한다.

### Minor (개선 권장)

#### 7. 프로필 조회 실패 시 기본값이 조용히 노출
- **위치**: `SettingsView.vue:13-26`
- **문제**: `auth.initialize()`가 완료된 후 앱이 마운트되고 라우터 가드도 `auth.loading`을 대기하므로 초기 깜빡임은 발생하지 않는다. 다만, 프로필 조회가 실패하거나 예외가 발생한 경우 이름은 "사용자"로, 이메일은 빈 문자열로 표시되는데, 이것이 에러인지 정상인지 사용자가 구분할 수 없다.
- **개선안**: 프로필 로딩 실패 시 에러 상태를 표시하거나, 재시도 버튼을 제공한다.

#### 8. 바텀시트 닫을 때 입력값 미초기화
- **위치**: `SettingsView.vue:139-147`
- **문제**: 바텀시트를 오버레이 클릭으로 닫은 후 다시 열면 이전에 입력한 '탈퇴' 텍스트가 남아있다.
- **개선안**: `watch(showDeleteSheet, open => { if (!open) { deleteConfirmInput.value = ''; deleting.value = false } })`를 추가한다.

#### 9. "메뉴얼" 오탈자
- **위치**: `SettingsView.vue:94, 103`
- **문제**: "메뉴얼"은 "매뉴얼"의 오탈자이다.
- **개선안**: "매뉴얼"로 수정한다.

#### 10. 미사용 profile-edit 라우팅 분기 (dead code)
- **위치**: `SettingsView.vue:182-183`
- **문제**: `handleNav` 함수에 `profile-edit` 분기가 있지만 템플릿에서 이 값으로 호출하는 곳이 없다. dead code이다.
- **개선안**: 사용되지 않는 분기를 제거하여 코드를 정리한다.

#### 11. 계정 삭제 입력창에 명시적 label 부재
- **위치**: `SettingsView.vue:141`
- **문제**: `<input>` 요소에 placeholder만 있고 명시적 `<label>` 또는 `aria-label`이 없다. 스크린 리더 사용자가 입력 목적을 파악하기 어렵다.
- **개선안**: `aria-label="계정 삭제 확인 입력"`을 추가한다.

#### 12. 키보드 올라올 때 바텀시트 내 버튼 가림 가능성 (재현 필요)
- **위치**: `SettingsView.vue:141`
- **문제**: 바텀시트 내 `<input>` 요소에 포커스가 가면 모바일 키보드가 올라오면서 "삭제" 버튼이 가려질 수 있다. `AppBottomSheet`가 `100dvh`와 내부 스크롤을 사용하고 있어 코드만으로는 확정하기 어려우며 실기기 테스트가 필요하다.
- **개선안**: iOS Safari/Android Chrome에서 재현 시 `scrollIntoView()` 또는 `visualViewport` resize 이벤트 대응을 추가한다.

#### 13. :focus-visible 스타일 부재
- **위치**: `SettingsView.css` 전반
- **문제**: 키보드 네비게이션 시 포커스 인디케이터가 표시되지 않는다. 메뉴 행 버튼, 로그아웃 버튼, 바텀시트 내 입력/버튼 모두 `:focus-visible` 스타일이 없다.
- **개선안**: 인터랙티브 요소에 `:focus-visible { outline: 2px solid var(--color-blue-primary); outline-offset: 2px; }` 스타일을 추가한다.

#### 14. 뒤로가기 버튼 미제공
- **위치**: `SettingsView.vue:6-8`
- **문제**: 헤더에 뒤로가기 버튼이 없다. 현재 IA에서는 바텀 네비게이션 탭의 최상위 화면이므로 허용 가능하다.
- **개선안**: 딥링크 진입 정책이 생기면 재검토 필요.

### Good (잘된 점)

- **프로필 카드 구성**: 아바타, 이름, 이메일, 역할 배지가 한 줄에 잘 정리되어 있고 이메일 overflow 처리(`text-overflow: ellipsis`)가 되어 있다.
- **메뉴 그루핑**: "내 계정", "매뉴얼", "계정 관리"로 논리적으로 잘 분류되어 있다.
- **위험 액션 분리**: 계정 삭제를 별도 섹션으로 분리하고, 빨간색 아이콘과 텍스트로 위험성을 시각적으로 전달한다.
- **계정 삭제 확인 패턴**: '탈퇴' 입력 확인을 통한 이중 확인 패턴이 적절하다.
- **로그아웃 시 스토어 초기화**: 로그아웃 경로에서 관련 Pinia 스토어를 `$reset()`하여 데이터 누수를 방지한다. (단, 삭제 경로에는 미적용)

### 토스 앱 참고 개선안

1. **프로필 카드 탭 가능하게**: 프로필 카드 자체를 `@click` 이벤트로 프로필 뷰로 이동시키면 더 직관적이다.
2. **피드백 애니메이션**: 메뉴 항목 탭 시 `transform: scale(0.98)` 정도의 미세한 효과를 추가하면 인터랙션 품질이 향상된다.
3. **섹션 간격 확대**: 카드 그룹 간 간격을 좀 더 넓히면 시각적 구분이 명확해진다.

### 구조 개선 제안 (참고용)

1. **handleNav 함수 리팩토링**: `if-else` 체인 대신 라우트 이름을 직접 매핑하는 객체를 사용하면 가독성이 높아진다.
2. **인라인 SVG 컴포넌트화**: 동일한 chevron 아이콘이 4번 반복된다. 별도 컴포넌트로 추출하면 유지보수성이 향상된다.
