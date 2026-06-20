<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAnnouncementsApi } from '@/api/announcement'
import {
  getEvaluationWindowsApi, getEvaluationFormsApi, getEvaluationSubmissionsApi,
  getCoursesApi, getServiceItemsApi, getCourseEnrollmentsApi,
  getTeachingOrgUnitsApi, getFileResourcesApi, getDashboardOverviewApi,
} from '@/api/evaluation'
import { getMyComplaintsApi, getComplaintProcessRecordsApi } from '@/api/complaint'
import EvaluationTaskCard from '@/components/student/EvaluationTaskCard.vue'

defineOptions({ name: 'StudentDashboardView' })

const router = useRouter()
const userStore = useUserStore()

// ===== 加载状态 =====
const loading = ref(true)

// ===== 轮播联动 =====
const carouselRef = ref(null)
const activeAnnounceIdx = ref(0)
const hoveredAnnounceIdx = ref(-1)

// ===== 数据状态 =====
const announcements = ref([])
const fileResourceMap = ref({})
const overviewStats = ref({ completedCount: 0, pendingCount: 0, processingFeedbackCount: 0, participationRate: 0 })
const pendingTasks = ref([])
const calendarEvents = ref([])
const feedbackItems = ref([])
const evaluationList = ref([])

// ===== 工具函数 =====
function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(5, 10)
}

function getCoverUrl(fileId) {
  if (!fileId) return ''
  const file = fileResourceMap.value[fileId]
  return file ? file.url : ''
}

function getEvalCoverUrl(formId) {
  const form = evaluationFormsMap.value[formId]
  if (!form?.cover_file_id) return ''
  const file = fileResourceMap.value[form.cover_file_id]
  return file ? file.url : ''
}

// 计算任务状态
function computeTaskStatus(window, submission) {
  const now = new Date()
  const start = new Date(window.start_at)
  const end = new Date(window.end_at)
  if (now < start) return { label: '未开始', type: 'info' }
  if (now > end) {
    if (submission && submission.status === 'submitted') return { label: '已完成', type: 'success' }
    return { label: '已截止', type: 'info' }
  }
  // 窗口开放中
  if (submission) {
    if (submission.status === 'submitted') {
      if (submission.locked_at) return { label: '已完成', type: 'success' }
      if (submission.modifiable_until && now <= new Date(submission.modifiable_until)) {
        return { label: '可修改', type: 'warning' }
      }
      return { label: '已完成', type: 'success' }
    }
    return { label: '进行中', type: 'primary' }
  }
  return { label: '待评价', type: 'warning' }
}

// 评价表单映射（用于关联查询）
const evaluationFormsMap = ref({})
const coursesMap = ref({})
const serviceItemsMap = ref({})
const orgUnitsMap = ref({})

// 最新发布的评价任务（取前6条）
const latestEvaluationList = computed(() => {
  return [...evaluationList.value]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 6)
})

// ===== 数据加载 =====
async function loadDashboard() {
  loading.value = true
  const userId = userStore.userInfo?.id
  const tenantId = userStore.tenantId
  const roleType = userStore.userRole || 'student'

  console.log('[Dashboard] 用户信息:', { userId, tenantId, roleType, userInfo: userStore.userInfo })

  if (!userId || !tenantId) {
    console.warn('[Dashboard] 缺少 userId 或 tenantId，无法加载数据')
    loading.value = false
    return
  }

  try {
    // 并行请求所有数据
    const [
      annList, windows, forms, submissions,
      courses, enrollments, serviceItems, orgUnits, files,
      overview, complaints,
    ] = await Promise.all([
      getAnnouncementsApi(tenantId, roleType),
      getEvaluationWindowsApi(tenantId),
      getEvaluationFormsApi(tenantId),
      getEvaluationSubmissionsApi(tenantId, userId),
      getCoursesApi(tenantId),
      getCourseEnrollmentsApi(tenantId, userId),
      getServiceItemsApi(tenantId),
      getTeachingOrgUnitsApi(tenantId),
      getFileResourcesApi(tenantId),
      getDashboardOverviewApi(userId, tenantId),
      getMyComplaintsApi(tenantId, userId),
    ])

    // 构建映射表
    fileResourceMap.value = {}
    files.forEach(f => { fileResourceMap.value[f.id] = f })

    evaluationFormsMap.value = {}
    forms.forEach(f => { evaluationFormsMap.value[f.id] = f })

    coursesMap.value = {}
    courses.forEach(c => { coursesMap.value[c.id] = c })

    serviceItemsMap.value = {}
    serviceItems.forEach(s => { serviceItemsMap.value[s.id] = s })

    orgUnitsMap.value = {}
    orgUnits.forEach(o => { orgUnitsMap.value[o.id] = o })

    // 1. 公告数据
    announcements.value = annList.map(n => ({
      id: n.id,
      title: n.title,
      desc: n.content,
      tag: n.tag,
      time: formatDate(n.publish_time),
      img: getCoverUrl(n.cover_file_id),
    }))

    // 2. 概览统计
    overviewStats.value = overview || { completedCount: 0, pendingCount: 0, processingFeedbackCount: 0, participationRate: 0 }

    // 3. 构建 submission 映射 (form_id -> submission)
    const submissionMap = {}
    submissions.forEach(s => { submissionMap[s.form_id] = s })

    // 4. 当前待办（窗口开放中且未提交的，按截止时间升序取前3）
    const now = new Date()
    const openWindows = windows.filter(w => {
      const start = new Date(w.start_at)
      const end = new Date(w.end_at)
      return start <= now && end >= now && !submissionMap[w.form_id]
    }).sort((a, b) => new Date(a.end_at) - new Date(b.end_at))

    pendingTasks.value = openWindows.slice(0, 3).map(w => {
      const form = forms.find(f => f.id === w.form_id)
      return {
        id: w.id,
        title: form ? form.title : '评价任务',
        deadline: formatShortDate(w.end_at),
        type: w.type === 'teaching' ? '教学评价' : w.type === 'instant' ? '即时评价' : '后勤服务',
        urgent: (new Date(w.end_at) - now) < 3 * 24 * 60 * 60 * 1000, // 3天内截止
        form_id: w.form_id,
      }
    })

    // 5. 评价开放日历
    const allWindows = windows
      .filter(w => !w.deleted)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))

    calendarEvents.value = allWindows.slice(0, 6).map(w => {
      const form = forms.find(f => f.id === w.form_id)
      const start = new Date(w.start_at)
      const end = new Date(w.end_at)
      let status = '进行中'
      let urgent = false
      if (now < start) { status = '即将开始' }
      else if (now > end) { status = '已截止' }
      else if ((end - now) < 3 * 24 * 60 * 60 * 1000) { status = '即将截止'; urgent = true }
      return {
        id: w.id,
        date: formatShortDate(w.end_at),
        title: (form ? form.title : '评价任务') + (status === '即将截止' ? '截止' : status === '已截止' ? '已截止' : ''),
        status,
        urgent,
      }
    })

    // 6. 反馈处理进度
    const sortedComplaints = complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const latestComplaint = sortedComplaints[0]
    if (latestComplaint) {
      let latestRecord = null
      try {
        const records = await getComplaintProcessRecordsApi(tenantId, latestComplaint.id)
        if (records?.length) {
          records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          latestRecord = records[0]
        }
      } catch { /* 忽略 */ }
      const statusMap = { pending: '待处理', processing: '处理中', resolved: '已办结', rejected: '已驳回', cancelled: '已撤销' }
      const statusTypeMap = { pending: 'warning', processing: '', resolved: 'success', rejected: 'danger', cancelled: 'info' }
      feedbackItems.value = [{
        title: latestComplaint.title,
        status: statusMap[latestComplaint.status] || latestComplaint.status,
        statusType: statusTypeMap[latestComplaint.status] || 'info',
        progress: latestRecord ? latestRecord.content : '已提交，等待学校相关部门处理',
        eta: latestComplaint.status === 'resolved' ? '已办结' : latestComplaint.status === 'cancelled' ? '已撤销' : '预计 3 个工作日内反馈',
      }]
    } else {
      feedbackItems.value = []
    }

    // 7. 全部评价任务
    const enrolledCourseIds = enrollments.map(e => e.course_id)
    evaluationList.value = windows
      .filter(w => {
        const form = forms.find(f => f.id === w.form_id)
        if (!form) return false
        // 过滤：教学评价只展示已选课程的
        if (form.type === 'teaching' && form.course_id && !enrolledCourseIds.includes(form.course_id)) return false
        // 过滤：教职工评价不展示给学生
        if (form.publish_scope === 'all_staff' && roleType === 'student') return false
        return true
      })
      .map(w => {
        const form = forms.find(f => f.id === w.form_id)
        const submission = submissionMap[w.form_id]
        const statusInfo = computeTaskStatus(w, submission)
        let dept = ''
        let target = ''
        if (form.type === 'teaching' && form.course_id) {
          const course = coursesMap.value[form.course_id]
          const org = course ? orgUnitsMap.value[course.teaching_org_id] : null
          dept = org ? org.name : '教务处'
          target = course ? course.course_name : ''
        } else if (form.service_item_id) {
          const si = serviceItemsMap.value[form.service_item_id]
          const org = si ? orgUnitsMap.value[si.service_org_id] : null
          dept = org ? org.name : '后勤管理处'
          target = si ? si.name : ''
        }
        return {
          id: w.id,
          title: form ? form.title : '评价任务',
          type: w.type === 'teaching' ? '教学评价' : w.type === 'instant' ? '即时评价' : '后勤服务',
          typeKey: w.type,
          dept,
          target,
          startDate: formatShortDate(w.start_at),
          endDate: formatShortDate(w.end_at),
          status: statusInfo.label,
          statusType: statusInfo.type,
          img: getEvalCoverUrl(w.form_id),
          form_id: w.form_id,
        }
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate))

  } catch (err) {
    console.error('加载首页数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 轮播联动
function handleCarouselChange(idx) { activeAnnounceIdx.value = idx }
function handleAnnounceHover(idx) {
  hoveredAnnounceIdx.value = idx
  activeAnnounceIdx.value = idx
  carouselRef.value?.setActiveItem(idx)
}
function handleAnnounceClick(item) {
  if (item?.id) {
    router.push({ name: 'StudentAnnouncementDetail', params: { id: item.id } })
  }
}

function handleEvalCardClick(ev) {
  if (ev.status === '已完成' || ev.status === '可修改') {
    router.push({ name: 'StudentEvalSubmit', params: { taskId: ev.form_id }, query: { mode: 'view' } })
  } else {
    router.push({ name: 'StudentEvalSubmit', params: { taskId: ev.form_id } })
  }
}

onMounted(() => { loadDashboard() })
</script>

<template>
  <div class="dashboard">
    <!-- 加载状态 -->
    <div v-if="loading" class="dashboard-loading">
      <el-skeleton :rows="5" animated />
    </div>
    <template v-else>
    <!-- 1. 校园公告 -->
    <div class="announce-section">
      <div class="module-header">
        <h2 class="module-title">校园公告</h2>
        <el-button text type="primary" size="small" @click="router.push({ name: 'StudentAnnouncementList' })">
          查看更多 <el-icon :size="14"><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="announce-grid">
        <div class="carousel-card">
          <template v-if="announcements.length > 0">
            <el-carousel ref="carouselRef" :active-index="activeAnnounceIdx" height="360px" :interval="5000" arrow="hover" indicator-position="none" class="announcement-carousel" @change="handleCarouselChange">
              <el-carousel-item v-for="item in announcements" :key="item.id">
                <div class="announce-slide" @click="handleAnnounceClick(item)">
                  <img :src="item.img" :alt="item.title" class="slide-bg" />
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
            <!-- 自定义指示器圆点（仅点击切换） -->
            <div class="carousel-indicators">
              <button
                v-for="(_, idx) in announcements"
                :key="idx"
                class="indicator-dot"
                :class="{ 'is-active': idx === activeAnnounceIdx }"
                @click="carouselRef?.setActiveItem(idx)"
              />
            </div>
          </template>
          <div v-else class="carousel-empty">
            <el-empty description="暂无公告" :image-size="80" />
          </div>
        </div>
        <div class="announce-list-card">
          <div v-for="(item, idx) in announcements" :key="item.id" class="announce-list-item" :class="{ active: idx === activeAnnounceIdx || idx === hoveredAnnounceIdx }" @mouseenter="handleAnnounceHover(idx)" @mouseleave="hoveredAnnounceIdx = -1" @click="handleAnnounceClick(item)">
            <div class="list-item-content">
              <span class="list-item-tag">{{ item.tag }}</span>
              <span class="list-item-title">{{ item.title }}</span>
            </div>
            <span class="list-item-time">{{ item.time.slice(5) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 两栏：左侧(待办+评价列表) / 右侧(概览+日历+反馈) -->
    <div class="content-two-col">
      <!-- 左：当前待办 + 评价列表 -->
      <div class="col-left">
        <div class="section-card">
          <div class="section-header">
            <div class="section-header-text">
              <div class="section-title-row">
                <h3 class="section-title">当前待办</h3>
                <el-tag type="warning" size="small" effect="plain">{{ pendingTasks.length }} 项待完成</el-tag>
              </div>
              <p class="section-hint">优先处理即将截止的评价任务</p>
            </div>
            <el-button text type="primary" size="small" @click="router.push({ name: 'StudentEvaluationTasks' })">
              查看更多 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="task-list">
            <div v-for="task in pendingTasks" :key="task.id" class="task-row" @click="router.push({ name: 'StudentEvalSubmit', params: { taskId: task.form_id } })">
              <span class="task-title">{{ task.title }}</span>
              <el-tag size="small" effect="plain">{{ task.type }}</el-tag>
              <span class="task-deadline" :class="{ urgent: task.urgent }">
                <el-icon :size="14"><Clock /></el-icon>
                {{ task.deadline }}
              </span>
              <el-button type="primary" size="small" @click.stop="router.push({ name: 'StudentEvalSubmit', params: { taskId: task.form_id } })">去评价</el-button>
            </div>
          </div>
        </div>

        <div class="section-card eval-section">
          <div class="section-header">
            <h3 class="section-title">最新评价任务</h3>
            <el-button text type="primary" size="small" @click="router.push({ name: 'StudentEvaluationTasks' })">
              查看更多 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="eval-list">
            <EvaluationTaskCard
              v-for="ev in latestEvaluationList"
              :key="ev.id"
              :task="ev"
              @click="handleEvalCardClick"
            />
          </div>
        </div>
      </div>

      <!-- 右：概览 + 日历 + 反馈 -->
      <div class="col-right">
        <div class="section-card overview-card">
          <h3 class="section-title">本学期概览</h3>
          <div class="overview-stats">
            <div class="stat-item">
              <span class="stat-value">{{ overviewStats.completedCount }}</span>
              <span class="stat-label">已完成</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ overviewStats.pendingCount }}</span>
              <span class="stat-label">待完成</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ overviewStats.processingFeedbackCount }}</span>
              <span class="stat-label">处理中</span>
            </div>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">参与率</span>
              <span class="progress-value">{{ Math.round(overviewStats.participationRate) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: overviewStats.participationRate + '%' }" />
            </div>
          </div>
        </div>

        <div class="section-card calendar-card">
          <h3 class="section-title">评价开放日历</h3>
          <div class="calendar-list">
            <div v-for="event in calendarEvents" :key="event.id" class="calendar-item">
              <div class="calendar-date">
                <span class="calendar-day">{{ event.date.split('-')[1] }}</span>
                <span class="calendar-month">{{ event.date.split('-')[0] }}月</span>
              </div>
              <div class="calendar-info">
                <span class="calendar-text" :class="{ urgent: event.urgent }">{{ event.title }}</span>
                <span class="calendar-status" :class="{ urgent: event.urgent }">{{ event.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card feedback-card">
          <div class="section-header">
            <h3 class="section-title">反馈处理进度</h3>
            <el-button text type="primary" size="small" @click="router.push({ name: 'StudentComplaint' })">
              查看更多 <el-icon :size="14"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-for="item in feedbackItems" :key="item.title" class="feedback-item" @click="router.push({ name: 'StudentComplaint' })">
            <div class="feedback-header">
              <span class="feedback-title">{{ item.title }}</span>
              <el-tag :type="item.statusType" size="small" effect="plain">{{ item.status }}</el-tag>
            </div>
            <p class="feedback-progress">{{ item.progress }}</p>
            <p class="feedback-eta">{{ item.eta }}</p>
          </div>
          <div v-if="!feedbackItems.length" class="feedback-empty">暂无反馈记录</div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

.dashboard-loading {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
}

/* ===== 模块标题 ===== */
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  align-items: stretch;
}

.carousel-card {
  position: relative;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  height: var(--carousel-height);
  max-height: var(--carousel-height);
}

.carousel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--color-bg-card);
}

.announcement-carousel {
  border-radius: var(--radius-xl);
}

.announcement-carousel :deep(.el-carousel__container) {
  height: var(--carousel-height) !important;
}

.announcement-carousel :deep(.el-carousel__arrow) {
  background: var(--color-bg-card);
  color: var(--color-accent-user-700);
  box-shadow: var(--shadow-sm);
}

.announcement-carousel :deep(.el-carousel__indicators--outside) {
  display: none;
}

.carousel-indicators {
  position: absolute;
  bottom: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-2);
  z-index: 2;
}

.indicator-dot {
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
  border: none;
  background: rgba(255, 255, 255, 0.5);
  opacity: 1;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.25s, transform 0.25s, background 0.25s;
}

.indicator-dot:hover {
  background: rgba(255, 255, 255, 0.8);
}

.indicator-dot.is-active {
  transform: scale(1.3);
  background: #fff;
}

.announce-slide {
  position: relative;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
}

.slide-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--carousel-gradient-height);
  background: linear-gradient(to top, var(--color-carousel-gradient-dark-1), var(--color-carousel-gradient-dark-2), var(--color-carousel-gradient-dark-3));
}

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
  line-height: var(--line-height-tight);
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

.announce-list-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-3) var(--spacing-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: var(--carousel-height);
  overflow: hidden;
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

.announce-list-item:hover,
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
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
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
  color: var(--color-text-placeholder);
  flex-shrink: 0;
  margin-left: var(--space-3);
}

/* ===== 两栏内容 ===== */
.content-two-col {
  display: grid;
  grid-template-columns: var(--grid-main-col) 1fr;
  gap: var(--grid-gap);
  align-items: start;
}

.col-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
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
  padding: var(--space-5) var(--spacing-lg);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.section-header-text {
  flex: 1;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

.section-hint {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  margin: var(--space-1) 0 0;
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
  height: var(--task-row-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: var(--border-light);
  cursor: pointer;
  transition: all 0.15s;
}

.task-row:hover {
  background: var(--color-primary-50);
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
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.task-deadline.urgent {
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}

.task-row .el-button {
  height: var(--task-btn-height);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

/* ===== 评价列表（左栏内） ===== */
.eval-section {
  display: flex;
  flex-direction: column;
}

.eval-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* ===== 本学期概览 ===== */
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
  background: var(--color-primary-50);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.stat-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.progress-section {
  padding-top: var(--space-3);
  border-top: var(--border-light);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-2);
}

.progress-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.progress-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-user-700);
}

.progress-bar {
  height: var(--progress-bar-height);
  background: var(--color-primary-50);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-success), var(--color-accent-user-700));
  border-radius: var(--radius-sm);
}

/* ===== 评价开放日历 ===== */
.calendar-card .section-title {
  margin-bottom: var(--space-3);
}

.calendar-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.calendar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-light);
  border: var(--border-light);
  transition: all 0.15s;
}

.calendar-item:hover {
  border-color: var(--color-primary-100);
}

.calendar-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: var(--calendar-date-min-width);
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary-50);
  border-radius: var(--radius-sm);
}

.calendar-day {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-user-700);
  line-height: 1;
}

.calendar-month {
  font-size: var(--font-2xs);
  color: var(--color-text-muted);
}

.calendar-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--calendar-info-gap);
  min-width: 0;
}

.calendar-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-text.urgent {
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}

.calendar-status {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.calendar-status.urgent {
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}

/* ===== 反馈处理进度 ===== */
.feedback-card .section-title {
  margin-bottom: var(--space-3);
}

.feedback-item {
  padding: var(--space-3);
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
  border: var(--border-light);
  cursor: pointer;
  transition: all 0.15s;
}

.feedback-item:hover {
  border-color: var(--color-primary-100);
  background: var(--color-primary-50);
}

.feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.feedback-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
}

.feedback-progress {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  margin: 0 0 var(--space-1);
}

.feedback-eta {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.feedback-empty {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .content-two-col {
    grid-template-columns: 1fr;
  }
}
</style>
