<!-- 트레이너 홈 대시보드. 오늘 예약 현황, 회원 수, 주간 통계 표시 -->
<template>
  <div class="trainer-home">
    <header class="home-header">
      <div class="home-header__profile">
        <div class="profile-avatar">
          <img src="@/assets/icons/person.svg" alt="avatar" />
          <div class="status-dot"></div>
        </div>
        <div class="profile-text">
          <p class="greeting">환영합니다</p>
          <h1 class="name">마커스 코치님</h1>
        </div>
      </div>
      <button class="btn-bell">
        <img src="@/assets/icons/bell.svg" alt="알림" width="24" height="24" />
        <span class="bell-dot"></span>
      </button>
    </header>

    <div class="action-card-dark floating-card" v-if="reservationCount > 0">
      <div class="action-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16H18M17 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="action-text">
        <h3 class="action-title">새로운 예약 요청</h3>
        <p class="action-desc">승인 대기 중 {{ reservationCount }}건</p>
      </div>
      <div class="action-arrow">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <section class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__head">
          <div class="stat-icon stat-icon--blue">
            <img src="@/assets/icons/trainer.svg" width="16" height="16" alt="up" />
          </div>
          <span class="stat-badge">오늘</span>
        </div>
        <div class="stat-card__body">
          <div class="stat-value">8</div>
          <div class="stat-label">총 세션</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__head">
          <div class="stat-icon stat-icon--blue">
            <img src="@/assets/icons/up.svg" width="16" height="16" alt="up" />
          </div>
          <span class="stat-badge">이번주</span>
        </div>
        <div class="stat-card__body">
          <div class="stat-value">92%</div>
          <div class="stat-label">완료율</div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title">오늘의 일정</h2>
        <a href="#" class="section-link">전체보기</a>
      </div>
      
      <div class="date-tabs">
        <button class="date-tab date-tab--active">오늘</button>
        <button class="date-tab">내일</button>
        <button class="date-tab">토, 14일</button>
        <button class="date-tab">일, 15일</button>
      </div>

      <div class="schedule-list">
        <!-- Schedule Card 1 -->
        <div class="schedule-card schedule-card--active">
          <div class="schedule-card__main">
            <div class="schedule-avatar"><img src="@/assets/icons/person.svg" alt="" /></div>
            <div class="schedule-info">
              <h3 class="schedule-name">김앨리스</h3>
              <p class="schedule-time">09:00 AM 수업 시작</p>
            </div>
          </div>
          <div class="schedule-card__divider"></div>
          <div class="schedule-card__desc">
            <p class="desc-label">오늘의 운동 요약</p>
            <p class="desc-text">바벨 스쿼트 5x5, 레그 프레스 4x12, 런지 3x15 진행 예정. 하체 중심 스트렝스 훈련.</p>
          </div>
        </div>

        <!-- Schedule Card 2 -->
        <div class="schedule-card">
          <div class="schedule-card__main">
            <div class="schedule-avatar"><img src="@/assets/icons/person.svg" alt="" /></div>
            <div class="schedule-info">
              <h3 class="schedule-name">이재임스</h3>
              <p class="schedule-time">10:30 AM 수업 시작</p>
            </div>
          </div>
          <div class="schedule-card__divider"></div>
          <div class="schedule-card__desc">
            <p class="desc-label">오늘의 운동 요약</p>
            <p class="desc-text">HIIT 타바타 20분 및 버피 테스트 3세트. 심폐 지구력 강화 위주.</p>
          </div>
        </div>

        <!-- Schedule Card 3 -->
        <div class="schedule-card">
          <div class="schedule-card__main">
            <div class="schedule-avatar"><img src="@/assets/icons/person.svg" alt="" /></div>
            <div class="schedule-info">
              <h3 class="schedule-name">박사라</h3>
              <p class="schedule-time">01:00 PM 수업 시작</p>
            </div>
          </div>
          <div class="schedule-card__divider"></div>
          <div class="schedule-card__desc">
            <p class="desc-label">오늘의 운동 요약</p>
            <p class="desc-text">체성분 측정 및 상담 후 기초 체력 테스트 진행. 초기 데이터 확보.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title">최근 메시지</h2>
        <span class="badge-red">3</span>
      </div>
      
      <div class="message-list">
        <div class="message-card">
          <div class="message-avatar">
            <img src="@/assets/icons/person.svg" alt="" />
            <div class="status-dot"></div>
          </div>
          <div class="message-content">
            <div class="message-head">
              <h3 class="message-name">최마이클</h3>
              <span class="message-time">2분 전</span>
            </div>
            <p class="message-preview">안녕하세요! 내일 세션 일정을 변경할 수 있을까요? 시간 조정 부탁드립니다.</p>
          </div>
        </div>

        <div class="message-card">
          <div class="message-avatar">
            <img src="@/assets/icons/person.svg" alt="" />
          </div>
          <div class="message-content">
            <div class="message-head">
              <h3 class="message-name">장엠마</h3>
              <span class="message-time">1시간 전</span>
            </div>
            <p class="message-preview">식단 업데이트 감사합니다! 아주 좋네요. 다음 주에도 이대로 진행하겠습니다.</p>
          </div>
        </div>
      </div>
    </section>

    <div style="height: calc(var(--nav-height) + 24px);" />

  </div>
</template>

<script setup>
import { ref } from 'vue'


// Mock data: set > 0 to see the card, 0 to hide it
const reservationCount = ref(2)
</script>

<style src="./TrainerHomeView.css" scoped></style>
