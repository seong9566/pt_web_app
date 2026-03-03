# 매뉴얼 시스템 재설계 - 학습 노트

## 세션 시작
- Plan: manual-system-redesign
- Started: 2026-02-28

## 통합 데이터 스키마 (Single Source of Truth)

### 상세보기 + 목록 목 데이터
```js
{
  id: Number,
  title: String,
  description: String,
  categories: String[],  // 복수 선택 (배열)
  gradient: String,
  duration: Number | null,
  unit: String,          // '분' 기본값
  difficulty: String | null,
  youtubeUrl: String,
  media: Array<{ type: 'image'|'video', placeholder: String }>
}
```

### 제거된 필드
- sets, muscles[], equipment[], steps[], tips[]

## 주요 변경사항
1. category(단수) -> categories(배열)
2. 등록폼에 duration, difficulty 필드 추가
3. 상세보기에서 media, youtubeUrl 섹션 추가
4. steps/muscles/equipment/tips/sets 제거

## 파일 위치 (변경 없음)
- ManualRegisterView: src/views/trainer/
- ManualDetailView: src/views/member/ (공유 컴포넌트)
- MemberManualView: src/views/member/
- TrainerManualView: src/views/trainer/

## 중요 참고사항
- 두 라우트(trainer-manual-detail, member-manual-detail)가 같은 ManualDetailView.vue 공유
- 외부 URL 금지 - 플레이스홀더 그라디언트만
- YouTube는 iframe 아닌 플레이스홀더 박스 + 링크

## Task 6: Integration Verification Results (2026-02-28)

### Build
- npm run build: PASS (exit 0, 123 modules, built in 1.41s)

### Page Verification
- /trainer/settings/manual/register: All fields render (category, name, description, duration, difficulty, media, YouTube)
- /trainer/settings/manual: 8 cards render, filter works (tested rehab filter -> 2 cards)
- /member/manual: 8 cards render, filter works (tested strength filter -> 3 cards including multi-category)
- /member/manual/1: Detail view with media gallery (2 photos), no YouTube (as expected - no URL in data)
- /member/manual/3: Detail view with media + YouTube section visible

### Navigation
- Card click in member manual list navigates correctly to /member/manual/{id}

### Console
- 0 JS errors, 0 warnings (only favicon 404 on initial load which is expected)

### Key Discovery
- Multi-category items work correctly with filter (e.g. id:6 has categories: ['core', 'strength'])
- YouTube section conditionally renders only when youtubeUrl is non-empty (v-if)

## F1: �÷� �ؼ� ���� (2026-02-28)
- ���� ���� �˻� ���: �ܺ� �̹��� URL/YouTube iframe/TypeScript/Options API ��� �̹߰�
- Task 2/3 ���� ����ġ: id:1 categories�� ���� ī�װ����� �������� ����(�÷� ����: ["��Ȱ", "�ھ�"])
- ���� ���� ����ġ: �÷��� �䱸�� task-1~6 ��ũ���� ���� ���ϸ��� .sisyphus/evidence/�� ����( manual* ���ϵ� ���� )
- ���巹�� ����: CSS�� �ϵ��ڵ� ��/������(��: rgba/px, #d0e8ff) ����
- ����: npm run build PASS

## F4 Scope Fidelity Notes (2026-02-28)
- Task-level scope drift is concentrated in list views and CSS guardrails, not in schema migration itself.
- `src/views/member/MemberManualView.vue` includes broader feature work than Task 2 (handler/nav behavior + full view replacement), causing cross-task contamination.
- `src/views/member/ManualDetailView.css` violates Task 5 guardrail requiring CSS variables only; multiple hardcoded `px`/`rgba(...)` values remain.
- Unaccounted source file changes exist outside Tasks 1-6 scope: `src/router/index.js`, `src/views/member/MemberReservationView.css`, `src/views/member/MemberManualView.css`.
