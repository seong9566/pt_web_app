1. Color Palette (색상 정의)
앱 전반에 사용되는 색상 값입니다. 프라이머리 컬러인 파란색을 중심으로 밝고 깨끗한 톤을 유지합니다.

분류	변수명	Hex Code	사용처
Primary	--color-blue-primary	#007AFF	주요 액션 버튼, 활성 탭, 포인트 아이콘, 강조 텍스트
Secondary	--color-blue-light	#E5F1FF	강조 배경(배지), 활성 탭 배경, 읽지 않은 알림 배경
Background	--color-white	#FFFFFF	전체 화면 배경, 카드 컨테이너
Surface	--color-gray-100	#F2F4F7	테두리 없는 입력창 배경, 비활성 버튼 배경
Text Primary	--color-gray-900	#111111	제목, 주요 본문, 강조 텍스트
Text Secondary	--color-gray-600	#666666	설명 문구, 날짜, 서브 텍스트, 비활성 메뉴
Divider	--color-gray-200	#EEEEEE	리스트 구분선, 얇은 테두리
Success	--color-green	#34C759	(필요 시) 완료 상태, 긍정적 메시지
Error	--color-red	#FF3B30	취소됨, 삭제 버튼, 오류 메시지
Warning	--color-yellow	#FFCC00	대기중 상태 점, 주의 알림
2. Typography (타이포그래피)
가독성이 높은 Pretendard 또는 Apple SD Gothic Neo 폰트 사용을 권장합니다.

Style Name	Size	Weight	Line Height	사용처
Display (H1)	24px	700 (Bold)	1.4	스플래시 환영 문구, 대시보드 메인 타이틀
Title (H2)	20px	700 (Bold)	1.4	섹션 타이틀, 상단 앱바 타이틀
Subtitle (H3)	18px	600 (SemiBold)	1.4	리스트 항목 제목, 카드 내 주요 정보
Body 1 (Bold)	16px	600 (SemiBold)	1.5	버튼 텍스트, 강조된 본문, 채팅 메시지
Body 1 (Reg)	16px	400 (Regular)	1.5	일반 본문 정보, 입력창 텍스트
Body 2 (Reg)	14px	400 (Regular)	1.5	보조 설명, 프로필 정보 세부 내역
Caption	12px	400 (Regular)	1.4	날짜, 시간, 하단 내비게이션 레이블
3. UI Pattern & Components (컴포넌트 규격)
코드 구현 시 일관성을 위한 공통 속성입니다.

Border Radius (곡률)
Large: 16px (메인 대시보드 카드, 하단 시트)
Medium: 12px (일반 버튼, 입력창, 리스트 아이템 카드)
Small: 8px (태그, 배지)
Shadow (그림자)
Card Shadow: 0 4px 12px rgba(0, 0, 0, 0.05) (매우 은은하게 처리)
Input Field (입력창)
Border: None (테두리 없음)
Background: --color-gray-100 (#F2F4F7)
Padding: Horizontal 16px, Vertical 14px
Button (버튼)
Height: 52px (주요 버튼 기준)
Padding: Horizontal 20px
Primary State: Background --color-blue-primary, Text --color-white
Bottom Navigation Bar
Height: 64px ~ 72px
Icon Size: 24px
Active Color: --color-blue-primary
Inactive Color: --color-gray-600
4. Layout (레이아웃 가이드)
Side Margin: 20px (화면 좌우 여백 기본값)
Vertical Spacing: 섹션 간 간격 24px ~ 32px, 항목 간 간격 12px ~ 16px

5. 폰트
https://github.com/fonts-archive/AppleSDGothicNeo