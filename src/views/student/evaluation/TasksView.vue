<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getEvaluationWindowsApi, getEvaluationFormsApi, getEvaluationSubmissionsApi,
  getCoursesApi, getServiceItemsApi, getCourseEnrollmentsApi,
  getTeachingOrgUnitsApi, getFileResourcesApi,
} from '@/api/evaluation'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import EvaluationTaskCard from '@/components/student/EvaluationTaskCard.vue'

defineOptions({ name: 'StudentEvaluationTasksView' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const evaluationList = ref([])
const searchText = ref('')
const filterStatus = ref('all')
const filterType = ref('all')
const sortBy = ref('deadline')
const currentPage = ref(1)
const pageSize = 8

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(5, 10)
}

function computeTaskStatus(window, submission) {
  const now = new Date()
  const start = new Date(window.start_at)
  const end = new Date(window.end_at)
  if (now < start) return { label: '未开始', type: 'info' }
  if (now > end) {
    if (submission?.status === 'submitted') return { label: '已完成', type: 'success' }
    return { label: '已截止', type: 'info' }
  }
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

// 状态胶囊配置
const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待评价' },
  { key: 'active', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'editable', label: '可修改' },
  { key: 'closed', label: '已截止' },
]

// 统计各状态数量
const stats = computed(() => {
  const list = evaluationList.value
  return {
    all: list.length,
    pending: list.filter(e => e.status === '待评价').length,
    active: list.filter(e => e.status === '进行中').length,
    done: list.filter(e => e.status === '已完成').length,
    editable: list.filter(e => e.status === '可修改').length,
    closed: list.filter(e => e.status === '已截止').length,
  }
})

// 状态优先级排序权重
const statusOrder = { '待评价': 0, '可修改': 1, '进行中': 2, '未开始': 3, '已完成': 4, '已截止': 5 }

const filteredList = computed(() => {
  let list = [...evaluationList.value]
  if (filterStatus.value !== 'all') {
    const statusMap = { pending: '待评价', active: '进行中', done: '已完成', closed: '已截止', editable: '可修改' }
    const target = statusMap[filterStatus.value]
    if (target) list = list.filter(e => e.status === target)
  }
  if (filterType.value !== 'all') {
    list = list.filter(e => e.typeKey === filterType.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(e =>
      e.title.toLowerCase().includes(kw) ||
      e.target.toLowerCase().includes(kw) ||
      e.dept.toLowerCase().includes(kw) ||
      e.type.toLowerCase().includes(kw)
    )
  }
  if (sortBy.value === 'deadline') {
    list.sort((a, b) => a.endDate.localeCompare(b.endDate))
  } else if (sortBy.value === 'latest') {
    list.sort((a, b) => b.startDate.localeCompare(a.startDate))
  } else if (sortBy.value === 'status') {
    list.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))
  }
  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

function handleReset() {
  searchText.value = ''
  filterStatus.value = 'all'
  filterType.value = 'all'
  sortBy.value = 'deadline'
  currentPage.value = 1
}

function handleCardClick(ev) {
  router.push({ name: 'StudentEvalSubmit', params: { taskId: ev.form_id } })
}

async function loadData() {
  loading.value = true
  const userId = userStore.userInfo?.id
  const tenantId = userStore.tenantId
  const roleType = userStore.userRole || 'student'
  if (!userId || !tenantId) { loading.value = false; return }

  try {
    const [windows, forms, submissions, courses, enrollments, serviceItems, orgUnits, files] = await Promise.all([
      getEvaluationWindowsApi(tenantId),
      getEvaluationFormsApi(tenantId),
      getEvaluationSubmissionsApi(tenantId, userId),
      getCoursesApi(tenantId),
      getCourseEnrollmentsApi(tenantId, userId),
      getServiceItemsApi(tenantId),
      getTeachingOrgUnitsApi(tenantId),
      getFileResourcesApi(tenantId),
    ])

    const fileMap = {}; files.forEach(f => { fileMap[f.id] = f })
    const formsMap = {}; forms.forEach(f => { formsMap[f.id] = f })
    const coursesMap = {}; courses.forEach(c => { coursesMap[c.id] = c })
    const serviceMap = {}; serviceItems.forEach(s => { serviceMap[s.id] = s })
    const orgMap = {}; orgUnits.forEach(o => { orgMap[o.id] = o })
    const submissionMap = {}; submissions.forEach(s => { submissionMap[s.form_id] = s })
    const enrolledCourseIds = enrollments.map(e => e.course_id)

    evaluationList.value = windows
      .filter(w => {
        const form = formsMap[w.form_id]
        if (!form) return false
        if (form.type === 'teaching' && form.course_id && !enrolledCourseIds.includes(form.course_id)) return false
        if (form.publish_scope === 'all_staff' && roleType === 'student') return false
        return true
      })
      .map(w => {
        const form = formsMap[w.form_id]
        const submission = submissionMap[w.form_id]
        const statusInfo = computeTaskStatus(w, submission)
        let dept = '', target = ''
        if (form.type === 'teaching' && form.course_id) {
          const course = coursesMap[form.course_id]
          const org = course ? orgMap[course.teaching_org_id] : null
          dept = org ? org.name : '教务处'
          target = course ? course.course_name : ''
        } else if (form.service_item_id) {
          const si = serviceMap[form.service_item_id]
          const org = si ? orgMap[si.service_org_id] : null
          dept = org ? org.name : '后勤管理处'
          target = si ? si.name : ''
        }
        return {
          id: w.id,
          title: form ? form.title : '评价任务',
          type: w.type === 'teaching' ? '教学评价' : w.type === 'instant' ? '即时评价' : '后勤服务',
          typeKey: w.type,
          dept, target,
          startDate: formatShortDate(w.start_at),
          endDate: formatShortDate(w.end_at),
          status: statusInfo.label,
          statusType: statusInfo.type,
          img: form?.cover_file_id && fileMap[form.cover_file_id] ? fileMap[form.cover_file_id].url : '',
          form_id: w.form_id,
        }
      })
  } catch (err) {
    console.error('加载评价任务失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="page-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">评价中心</h1>
      <p class="page-subtitle">
        查看并参与当前可用的教学评价、后勤服务评价与即时评价
        <span class="hint-tag">当前仅展示你可参与的评价任务</span>
      </p>
    </div>

    <!-- 统一筛选面板 -->
    <div class="filter-panel">
      <!-- 第一行：状态胶囊 + 结果统计 -->
      <div class="filter-row-top">
        <div class="status-pills">
          <button
            v-for="item in statusFilters"
            :key="item.key"
            class="pill-btn"
            :class="{ 'is-active': filterStatus === item.key }"
            @click="filterStatus = item.key; currentPage = 1"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="result-summary">
          共 <strong>{{ filteredList.length }}</strong> 个评价任务
          <template v-if="stats.pending > 0 && filterStatus === 'all'">，<strong>{{ stats.pending }}</strong> 个待评价</template>
        </div>
      </div>

      <!-- 第二行：搜索 + 类型 + 排序 + 重置 -->
      <div class="filter-row-bottom">
        <el-input
          v-model="searchText"
          placeholder="搜索评价、课程、服务、发布部门"
          :prefix-icon="Search"
          clearable
          class="search-input"
          @input="currentPage = 1"
        />
        <el-select v-model="filterType" placeholder="类型" class="filter-select" @change="currentPage = 1">
          <el-option label="全部类型" value="all" />
          <el-option label="教学评价" value="teaching" />
          <el-option label="后勤服务" value="service" />
          <el-option label="即时评价" value="instant" />
        </el-select>
        <el-select v-model="sortBy" placeholder="排序" class="filter-select">
          <el-option label="即将截止" value="deadline" />
          <el-option label="最新发布" value="latest" />
          <el-option label="状态优先" value="status" />
        </el-select>
        <el-button text type="primary" size="small" @click="handleReset">
          <el-icon :size="14"><RefreshRight /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 评价任务列表 -->
    <div v-else-if="filteredList.length" class="eval-list">
      <EvaluationTaskCard
        v-for="ev in pagedList"
        :key="ev.id"
        :task="ev"
        @click="handleCardClick"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <EmptyPlaceholder text="暂无评价任务" description="当前没有符合条件的评价任务" />
    </div>

    <!-- 分页 -->
    <div v-if="filteredList.length > 1" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredList.length"
        layout="prev, pager, next"
        small
      />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
}

.page-container > .page-header {
  margin-bottom: var(--space-6);
}

.page-container > .filter-panel {
  margin-bottom: var(--space-5);
}

/* ===== 页面标题区 ===== */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-heading);
  margin: 0;
  line-height: var(--line-height-tight);
}

.page-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.hint-tag {
  display: inline-block;
  padding: 2px var(--space-2);
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

/* ===== 统一筛选面板 ===== */
.filter-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.filter-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

/* 状态胶囊按钮 */
.status-pills {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full, 999px);
  background: transparent;
  color: var(--color-text-body);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
  height: 36px;
}

.pill-btn:hover {
  border-color: var(--color-primary-200);
  color: var(--color-accent-user-700);
}

.pill-btn.is-active {
  background: var(--color-primary-50);
  border-color: var(--color-accent-user-700);
  color: var(--color-accent-user-700);
  font-weight: 600;
}

/* 结果统计 */
.result-summary {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  white-space: nowrap;
}

.result-summary strong {
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-semibold);
}

/* 第二行筛选控件 */
.filter-row-bottom {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.search-input {
  width: 340px;
  flex-shrink: 0;
}

.filter-select {
  width: 140px;
  flex-shrink: 0;
}

/* ===== 加载 / 列表 / 空状态 ===== */
.loading-skeleton {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.eval-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.empty-state {
  padding: var(--space-10) 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: var(--space-2);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .filter-row-bottom {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input {
    width: 100%;
  }
  .filter-select {
    width: 100%;
  }
}

@media (max-width: 1366px) {
  .filter-row-bottom {
    flex-wrap: wrap;
  }
  .search-input {
    width: 280px;
  }
}
</style>
