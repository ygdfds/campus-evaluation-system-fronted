<script setup>
import { useRouter } from 'vue-router'
import {
  DataAnalysis, ChatDotRound, Tickets, QuestionFilled,
  Clock, ArrowRight,
} from '@element-plus/icons-vue'

defineOptions({ name: 'StaffDashboardView' })

const router = useRouter()

// 轮播公告数据
const announcements = [
  {
    id: 1,
    title: '2026 春季学期教学评价进行中',
    desc: '请及时查看学生评价反馈，处理待回复事项与工单',
    tag: '评价进行中',
    time: '2026-06-01',
    img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=400&fit=crop',
  },
  {
    id: 2,
    title: '您有 2 条新评价待回复',
    desc: '「高等数学」和「线性代数」课程评价结果已发布，请尽快回复',
    tag: '待回复',
    time: '2026-05-30',
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=400&fit=crop',
  },
  {
    id: 3,
    title: '工单处理提醒',
    desc: '教室设备报修工单 #1024 已等待 3 天，请及时处理',
    tag: '工单提醒',
    time: '2026-05-28',
    img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&h=400&fit=crop',
  },
]

// 待处理事项
const pendingItems = [
  { id: 1, title: '回复「高等数学」课程评价反馈', deadline: '06-08', type: '评价回复', urgent: true },
  { id: 2, title: '处理工单 #1024：教室设备报修', deadline: '06-10', type: '工单', urgent: false },
  { id: 3, title: '确认「大学物理」期末评价结果', deadline: '06-15', type: '结果确认', urgent: false },
]

// 服务提醒
const serviceReminders = [
  { id: 1, text: '评价回复建议 3 个工作日内完成', urgent: false },
  { id: 2, text: '工单处理情况将纳入学期考核', urgent: true },
]

// 最近动态
const recentActivities = [
  { id: 1, action: '发布', title: '「高等数学」课程评价结果', time: '06-01', status: '待回复', statusType: 'warning' },
  { id: 2, action: '回复', title: '「线性代数」课程评价反馈', time: '05-28', status: '已回复', statusType: 'success' },
  { id: 3, action: '处理', title: '工单 #1020：实验室空调故障', time: '05-25', status: '已处理', statusType: 'success' },
]
</script>

<template>
  <div class="dashboard">
    <!-- 1. 公告区：左轮播 + 右列表 -->
    <div class="announce-section">
      <div class="module-header">
        <h2 class="module-title">校园公告</h2>
        <el-button text type="primary" size="small" @click="router.push('/staff/announcements')">
          查看更多 <el-icon :size="14"><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="announce-grid">
        <!-- 左侧轮播 760px -->
        <div class="carousel-card">
          <el-carousel
            height="360px"
            :interval="5000"
            arrow="hover"
            indicator-position="outside"
            class="announcement-carousel"
          >
            <el-carousel-item v-for="item in announcements" :key="item.id">
              <div class="announce-slide" @click="router.push('/staff/announcements')">
                <img :src="item.img" :alt="item.title" class="slide-bg" />
                <!-- 底部深色渐变遮罩 -->
                <div class="slide-gradient" />
                <div class="slide-text">
                  <h3 class="slide-title">{{ item.title }}</h3>
                  <div class="slide-meta">
                    <span class="slide-tag">{{ item.tag }}</span>
                    <span class="slide-time">{{ item.time }}</span>
                  </div>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

        <!-- 右侧公告列表 416px -->
        <div class="announce-list-card">
          <div
            v-for="(item, idx) in announcements"
            :key="item.id"
            class="announce-list-item"
            :class="{ active: idx === 0 }"
            @click="router.push('/staff/announcements')"
          >
            <div class="list-item-content">
              <span class="list-item-tag">{{ item.tag }}</span>
              <span class="list-item-title">{{ item.title }}</span>
            </div>
            <span class="list-item-time">{{ item.time.slice(5) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 常用服务入口 -->
    <div class="module-header">
      <h2 class="module-title">常用服务</h2>
    </div>
    <div class="entries-row">
      <div class="entry-card entry-primary" @click="router.push('/staff/evaluation/results')">
        <div class="entry-icon">
          <el-icon :size="24"><DataAnalysis /></el-icon>
        </div>
        <div class="entry-info">
          <span class="entry-title">我的评价结果</span>
          <span class="entry-desc">查看本学期评价数据</span>
        </div>
        <el-icon class="entry-arrow" :size="16"><ArrowRight /></el-icon>
      </div>
      <div class="entry-card" @click="router.push('/staff/evaluation/replies')">
        <div class="entry-icon icon-orange">
          <el-icon :size="22"><ChatDotRound /></el-icon>
        </div>
        <span class="entry-label">待回复</span>
      </div>
      <div class="entry-card" @click="router.push('/staff/work-orders')">
        <div class="entry-icon icon-green">
          <el-icon :size="22"><Tickets /></el-icon>
        </div>
        <span class="entry-label">工单处理</span>
      </div>
      <div class="entry-card" @click="router.push('/staff/help')">
        <div class="entry-icon icon-gray">
          <el-icon :size="22"><QuestionFilled /></el-icon>
        </div>
        <span class="entry-label">帮助中心</span>
      </div>
    </div>

    <!-- 3. 两栏内容 -->
    <div class="content-two-col">
      <!-- 左侧：待处理事项 -->
      <div class="section-card col-left">
        <div class="section-header">
          <h3 class="section-title">待处理事项</h3>
          <el-tag type="warning" size="small" effect="plain">{{ pendingItems.length }} 项待处理</el-tag>
        </div>
        <div class="task-list">
          <div v-for="task in pendingItems" :key="task.id" class="task-row">
            <span class="task-title">{{ task.title }}</span>
            <el-tag size="small" effect="plain">{{ task.type }}</el-tag>
            <span class="task-deadline" :class="{ urgent: task.urgent }">
              <el-icon :size="14"><Clock /></el-icon>
              {{ task.deadline }}
            </span>
            <el-button type="primary" size="small" @click="router.push('/staff/evaluation/replies')">去处理</el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：概览 + 提醒 -->
      <div class="col-right">
        <div class="section-card overview-card">
          <h3 class="section-title">本学期评价概览</h3>
          <div class="overview-stats">
            <div class="stat-item">
              <span class="stat-value">28</span>
              <span class="stat-label">收到评价</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">4.3</span>
              <span class="stat-label">平均评分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">2</span>
              <span class="stat-label">待回复</span>
            </div>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">回复率</span>
              <span class="progress-value">92%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 92%" />
            </div>
          </div>
        </div>

        <div class="section-card reminders-card">
          <h3 class="section-title">服务提醒</h3>
          <div class="reminder-list">
            <div v-for="item in serviceReminders" :key="item.id" class="reminder-item">
              <span class="reminder-dot" :class="{ urgent: item.urgent }" />
              <span class="reminder-text">{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 最近动态 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">最近动态</h3>
      </div>
      <div class="timeline">
        <div v-for="item in recentActivities" :key="item.id" class="timeline-item">
          <div class="timeline-dot" />
          <div class="timeline-content">
            <div class="timeline-main">
              <span class="timeline-action">{{ item.action }}</span>
              <span class="timeline-title">{{ item.title }}</span>
            </div>
            <span class="timeline-time">{{ item.time }}</span>
          </div>
          <el-tag :type="item.statusType" size="small" effect="plain" class="timeline-status">
            {{ item.status }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ===== 模块标题 ===== */
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(-1 * var(--space-2));
}

.module-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

/* ===== 公告区 ===== */
.announce-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.announce-grid {
  display: grid;
  grid-template-columns: var(--grid-main-col) 1fr;
  gap: var(--grid-gap);
}

/* 左侧轮播 */
.carousel-card {
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.announcement-carousel {
  border-radius: var(--radius-xl);
}

.announcement-carousel :deep(.el-carousel__container) {
  height: 360px !important;
}

.announcement-carousel :deep(.el-carousel__arrow) {
  background: var(--color-overlay-white-90);
  color: var(--color-accent-user-700);
  box-shadow: var(--shadow-sm);
}

.announcement-carousel :deep(.el-carousel__indicators--outside) {
  margin-top: var(--space-3);
}

.announcement-carousel :deep(.el-carousel__button) {
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
}

.announce-slide {
  position: relative;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
}

/* 图片满铺 */
.slide-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 底部深色渐变遮罩 */
.slide-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(
    to top,
    var(--color-carousel-gradient-dark-1),
    var(--color-carousel-gradient-dark-2),
    var(--color-carousel-gradient-dark-3)
  );
}

/* 底部文字 */
.slide-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-5) var(--spacing-lg);
}

.slide-title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-white);
  margin: 0 0 var(--space-2);
  line-height: var(--line-height-snug);
}

.slide-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.slide-tag {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: var(--color-carousel-tag-bg);
  color: var(--color-accent-user-700);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
}

.slide-time {
  font-size: var(--font-sm);
  color: var(--color-carousel-time-text);
}

/* 右侧公告列表 */
.announce-list-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.announce-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--spacing-base);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}

.announce-list-item:hover {
  background: var(--color-bg-primary-hover);
}

.announce-list-item.active {
  background: var(--color-primary-50);
}

.list-item-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.list-item-tag {
  flex-shrink: 0;
  padding: var(--tag-padding);
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
  font-size: var(--font-2xs);
  font-weight: var(--tag-font-weight);
  border-radius: var(--tag-border-radius);
}

.list-item-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item-time {
  font-size: var(--font-sm);
  color: var(--color-text-muted-light);
  flex-shrink: 0;
  margin-left: var(--space-3);
}

/* ===== 常用服务入口 ===== */
.entries-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: var(--space-3);
}

.entry-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--spacing-base) var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: var(--border-lighter);
  cursor: pointer;
  transition: all 0.2s;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-100);
}

.entry-primary {
  background: var(--color-accent-user-700);
  border: none;
}

.entry-primary:hover {
  background: var(--color-primary-700);
  border: none;
}

.entry-primary .entry-icon {
  width: 40px;
  height: 40px;
  background: var(--color-overlay-white-20);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-white);
}

.entry-primary .entry-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.entry-primary .entry-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-white);
}

.entry-primary .entry-desc {
  font-size: var(--font-xs);
  color: var(--color-overlay-white-70);
}

.entry-primary .entry-arrow {
  color: var(--color-overlay-white-60);
}

.entry-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-green {
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
}

.icon-orange {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.icon-gray {
  background: var(--color-info-light);
  color: var(--color-accent-sys-500);
}

.entry-label {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}

/* ===== 两栏内容 ===== */
.content-two-col {
  display: grid;
  grid-template-columns: var(--grid-main-col) 1fr;
  gap: var(--grid-gap);
}

.col-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

/* ===== 通用卡片 ===== */
.section-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--card-section-padding);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
}

.section-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

/* ===== 待办任务 ===== */
.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 52px;
  padding: 0 var(--space-3);
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
  border: var(--border-lighter);
  cursor: pointer;
  transition: all 0.15s;
}

.task-row:hover {
  background: var(--color-bg-primary-hover);
  border-color: var(--color-primary-100);
}

.task-title {
  flex: 1;
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.task-deadline.urgent {
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}

.task-row .el-button {
  height: 30px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

/* ===== 概览卡片 ===== */
.overview-card .section-title {
  margin-bottom: var(--space-3);
}

.overview-stats {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--spacing-base);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.stat-label {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.progress-section {
  padding-top: var(--space-3);
  border-top: var(--border-lighter);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-2);
}

.progress-label {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.progress-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-user-700);
}

.progress-bar {
  height: 7px;
  background: var(--color-primary-50);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-success), var(--color-accent-user-700));
  border-radius: var(--radius-sm);
}

/* ===== 服务提醒（轻量化） ===== */
.reminders-card .section-title {
  margin-bottom: var(--space-3);
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-md);
  border: var(--border-light);
}

.reminder-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-text-muted-light);
  flex-shrink: 0;
}

.reminder-dot.urgent {
  background: var(--color-warning);
}

.reminder-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-normal);
}

/* ===== 时间线 ===== */
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 52px;
  border-bottom: var(--border-lighter);
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-dot {
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-accent-user-700);
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.timeline-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.timeline-action {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-user-700);
  flex-shrink: 0;
}

.timeline-title {
  font-size: var(--font-base);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-time {
  font-size: var(--font-sm);
  color: var(--color-text-muted-light);
  flex-shrink: 0;
  margin: 0 var(--space-3);
}

.timeline-status {
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 900px) {
  .content-two-col {
    grid-template-columns: 1fr;
  }
  .entries-row {
    grid-template-columns: 1fr 1fr;
  }
  .entry-primary {
    grid-column: span 2;
  }
}

@media (max-width: 600px) {
  .entries-row {
    grid-template-columns: 1fr;
  }
  .entry-primary {
    grid-column: span 1;
  }
}
</style>
