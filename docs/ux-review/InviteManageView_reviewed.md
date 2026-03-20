# InviteManageView UX 리뷰 - 리뷰 완료

> 리뷰 일시: 2026-03-20
> 리뷰 모델: GPT (codex exec)
> 원본 파일: docs/ux-review/InviteManageView.md
> 참조한 소스 파일: src/views/invite/InviteManageView.vue, src/views/invite/InviteManageView.css, src/composables/useInvite.js, src/composables/useToast.js, src/utils/navigation.js
> 리뷰 라운드: 3회 (최종 판정: 리뷰 문서 확정 - 소스 코드 수정은 별도 작업)

---

## 리뷰 이력
| 라운드 | 판정 | 주요 지적 사항 |
|--------|------|----------------|
| 1 | NEEDS_IMPROVEMENT | aria-label 위치 오차, 클립보드 실패 범위 부족, 누락 이슈 5건 |
| 2 | NEEDS_IMPROVEMENT | 회원 아바타 alt 확장, useInvite.js 라인 보정, 공용 loading/error 표현 다듬기 |
| 3 | 문서 확정 | GPT가 리뷰 문서의 모든 지적 사항이 소스 코드에서 실제로 존재함을 확인. 리뷰 문서 정확성 검증 완료. |

---

## 종합 평가
| 항목 | 점수 (1-5) | 상태 |
|------|-----------|------|
| 로딩/에러/빈 상태 | 3 | 스켈레톤 적절하나, 에러/빈 상태 구분 없음 |
| 터치 타겟 | 4 | 버튼 크기 적절 |
| 스크롤/인터랙션 | 3 | 기본 동작 양호 |
| 시각적 일관성 | 3 | 일부 불일치 |
| 접근성 | 2 | 뒤로가기 aria-label, type 누락, 아이콘 alt 부적절 |
| 정보 밀도 | 4 | 적절한 정보량 |
| 전체 사용성 | 3 | 기능적이나 에러 대응과 상태 관리 미흡 |

---

## 최종 리뷰 내용

### Critical (즉시 수정 필요)

#### 1. "전체보기" 버튼 동작 미구현
- **위치**: `InviteManageView.vue:52`
- **문제**: "전체보기" 버튼에 `@click` 이벤트 핸들러가 없다. 파란색 텍스트로 클릭 가능해 보이지만 아무 반응이 없다.
- **개선안**: 전체보기 기능을 구현하거나, 전체 목록 화면이 없다면 버튼을 숨긴다. 전체 개수가 미리보기 개수 이하일 때도 숨기는 것이 좋다.

#### 2. 초대 코드 없는 상태에서 공유/복사 버튼 활성화
- **위치**: `InviteManageView.vue:21-35`
- **문제**: `inviteCode`가 null이고 "생성 중..."이 표시되는 상태에서도 "코드 복사", "링크 공유", "초대 링크 공유" 버튼이 활성화되어 보인다. 탭해도 guard 조건에 의해 아무 일도 일어나지 않아 고장난 것처럼 느껴진다.
- **개선안**: `inviteCode`가 없으면 모든 공유/복사 버튼을 `:disabled="!inviteCode?.code"`로 비활성화한다.

#### 3. 초대 코드 생성 실패 시 "생성 중..." 영구 표시
- **위치**: `InviteManageView.vue:21`, `useInvite.js:21-50`
- **문제**: `fetchInviteCode`와 `generateInviteCode`가 모두 실패하면 "생성 중..."이 영구적으로 표시된다. 재시도 수단이 없다.
- **개선안**: `loading / ready / error` 상태를 분리하고, 에러 시 인라인 에러 메시지와 "다시 시도" 버튼을 제공한다.

#### 4. 조회 실패와 코드 미존재 상태 미구분
- **위치**: `InviteManageView.vue:152-156`, `useInvite.js:35`
- **문제**: `fetchInviteCode()`가 에러로 실패해도 `!inviteCode.value`이면 새 코드 생성을 시도한다. 네트워크 에러와 실제로 코드가 없는 상태를 구분하지 않아 불필요한 생성 요청이 발생할 수 있다.
- **개선안**: `fetchInviteCode()`가 `success/no-data/error`를 반환하도록 변경하고, `no-data`일 때만 자동 생성한다.

### Major (높은 우선순위)

#### 5. 공유 기능 UI 중복
- **위치**: `InviteManageView.vue:23-48`
- **문제**: 코드 카드 안의 "링크 공유"(클립보드 복사)와 하단의 "초대 링크 공유"(Web Share API + 폴백 클립보드 복사)가 사용자 관점에서 거의 동일하게 보인다.
- **개선안**: "코드 복사" + "공유하기" 2축으로 단순화한다. 공유는 Web Share 우선 + 클립보드 폴백으로 하나의 버튼에 통합한다.

#### 6. 클립보드 API 실패 처리 없음
- **위치**: `InviteManageView.vue:118-130`, `InviteManageView.vue:145-148`
- **문제**: `handleCopyCode`, `handleShareLink`, `handleShare`의 폴백 복사 모두 `navigator.clipboard.writeText()`를 `.catch()` 없이 호출한다. HTTPS가 아닌 환경이나 권한 부재 시 실패한다.
- **개선안**: 세 함수 모두 `try-catch`로 감싸고, 실패 시 에러 토스트와 "코드를 직접 복사해주세요" 안내를 표시한다.

#### 7. 회원 목록 조회 실패가 빈 상태로 오인
- **위치**: `InviteManageView.vue:58-60`, `InviteManageView.vue:160`
- **문제**: 회원 목록 fetch가 실패해도 `recentMembers`가 빈 배열로 남아 "아직 연결된 회원이 없습니다"로 표시된다. 에러 토스트는 잠깐 뜨고 사라지므로 사용자가 놓칠 수 있다.
- **개선안**: 회원 섹션에도 `loading / empty / error / data` 상태를 분리하고, 에러 시 "다시 불러오기" 버튼을 제공한다.

#### 8. `loading`과 `error`가 코드 카드와 회원 목록에 공용 (상태 오염 위험)
- **위치**: `useInvite.js:15-18`
- **문제**: 하나의 `loading`과 `error` ref가 초대 코드와 회원 목록 양쪽에 공유되어 상태가 서로 오염된다. 예: `fetchRecentMembers()` 실행 시 `loading`이 true가 되면 코드 카드에도 영향을 줄 수 있고, 한쪽 에러가 다른 쪽 UI에 표시될 수 있다. 현재도 영향이 있으며, 특히 회원이 많을 때 `fetchRecentMembers`가 느려지면 코드 카드 스켈레톤이 다시 나타나는 문제가 발생한다.
- **개선안**: `inviteLoading`, `membersLoading`, `inviteError`, `membersError`로 분리한다.

#### 9. 뒤로가기 버튼 aria-label 및 type 누락
- **위치**: `InviteManageView.vue:5`
- **문제**: 뒤로가기 버튼에 `aria-label`과 `type="button"`이 없다. 다른 화면들은 제공하고 있어 일관성이 부족하다.
- **개선안**: `aria-label="뒤로 가기"` 및 `type="button"`을 추가한다.

### Minor (개선 권장)

#### 10. "가입" 텍스트의 의미 모호
- **위치**: `InviteManageView.vue:81`
- **문제**: `connected_at` 필드를 사용하면서 "가입"이라고 표기하여 혼동을 줄 수 있다. 실제로는 트레이너와 "연결"된 날짜이다.
- **개선안**: "가입"을 "연결"로 변경한다.

#### 11. 초대 코드 폰트 크기 견고성
- **위치**: `InviteManageView.css:67-73`
- **문제**: 초대 코드 폰트 크기가 `36px`이고 `letter-spacing: 4px`이 추가되어 있다. 현재는 6자리 고정 코드이므로 문제없지만, 코드 길이가 변경될 경우를 대비한 견고성이 부족하다.
- **개선안**: `font-size: min(36px, 8vw)` 같은 반응형 값이나 `clamp()` 적용을 검토한다. 긴급도는 낮다.

#### 12. 아이콘/아바타 alt 속성 부적절
- **위치**: `InviteManageView.vue:25, 29` (버튼 아이콘), `InviteManageView.vue:67, 74` (회원 아바타)
- **문제**: 버튼 아이콘의 `alt="copy"`, `alt="share"`는 한국어 UI에서 불필요하며 버튼 텍스트와 중복된다. 회원 아바타의 `alt="member"`도 마찬가지로 의미가 부족하다.
- **개선안**: 장식용 아이콘은 `alt="" aria-hidden="true"`로 변경한다. 회원 아바타는 `:alt="member.profiles?.name || '회원'"` 등 이름 기반 alt를 사용한다.

#### 13. 회원 목록 스켈레톤 개수
- **위치**: `InviteManageView.vue:56`
- **문제**: 항상 3개 스켈레톤이 표시된다. 일반적인 패턴이므로 큰 문제는 아니다.
- **개선안**: 후순위. 에러/상태 관련 이슈 해결이 우선이다.

### Good (잘된 점)

- **스켈레톤 UI**: 코드 카드와 회원 목록에 각각 적절한 형태의 스켈레톤 UI가 구현되어 있다.
- **빈 상태 처리**: 연결된 회원이 없을 때 안내 메시지와 행동 유도 텍스트를 제공한다.
- **Web Share API 활용**: 네이티브 공유를 우선 시도하고, 미지원 시 클립보드 폴백으로 처리하는 패턴이 적절하다. `handleShare`의 폴백도 잘 구현되어 있다.
- **코드 카드 디자인**: 초대 코드를 시각적으로 강조하고, 밑줄과 큰 폰트로 핵심 정보를 명확히 전달한다.
- **자동 코드 생성**: 마운트 시 코드가 없으면 자동 생성하여 사용자가 별도 조작 없이 바로 사용 가능하다.

### 토스 앱 참고 개선안

1. **코드 복사 성공 피드백 강화**: 버튼 텍스트를 잠시 "복사됨"으로 변경하는 인라인 피드백을 추가하면 더 직관적이다.
2. **공유 카드 디자인**: 카카오톡 공유를 직접 지원하면 한국 사용자에게 더 편리하다.
3. **연결 회원 수 뱃지**: "최근 연결된 회원" 타이틀 옆에 전체 회원 수를 뱃지로 표시하면 현황을 빠르게 파악할 수 있다.

### 구조 개선 제안 (참고용)

1. **`handleShare`와 `handleShareLink` 통합**: 두 함수를 하나로 합치고 템플릿에서 하나의 버튼만 사용한다.
2. **에러 처리 일관성**: 모든 사용자 액션에 대한 에러 처리를 일관되게 `try-catch` + 토스트로 적용한다.
3. **상태 분리**: `useInvite` composable의 `loading`/`error`를 코드와 회원 목록 각각으로 분리한다.
