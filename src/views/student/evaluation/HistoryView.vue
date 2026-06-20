<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getMyEvaluations } from '@/api/evaluation'
import CoverImage from '@/components/common/CoverImage.vue'

defineOptions({ name: 'StudentEvaluationHistoryView' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const evaluations = ref([])
const statusFilter = ref('all')
const currentPage = ref(1)
const pageSize = 6

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审核' },
  { value: 'modifiable', label: '可修改' },
  { value: 'locked', label: '已锁定' },
]

const filteredEvaluations = computed(() => {
  if (statusFilter.value === 'all') return evaluations.value
  return evaluations.value.filter(e => e.display_status === statusFilter.value)
})

const statusCounts = computed(() => {
  const counts = { all: evaluations.value.length, draft: 0, pending: 0, modifiable: 0, locked: 0 }
  for (const e of evaluations.value) {
    if (counts[e.display_status] !== undefined) counts[e.display_status]++
  }
  return counts
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEvaluations.value.slice(start, start + pageSize)
})

const statusLabelMap = {
  draft: '草稿',
  pending: '待审核',
  submitted: '已提交',
  modifiable: '可修改',
  locked: '已锁定',
}

const statusTypeMap = {
  draft: 'info',
  pending: 'warning',
  submitted: 'success',
  modifiable: 'warning',
  locked: 'danger',
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return dateStr.replace('T', ' ').slice(0, 16)
}

function typeLabel(type) {
  const map = { teaching: '教学评价', service: '服务评价', instant: '即时评价' }
  return map[type] || type
}

function handleAction(row) {
  router.push({ name: 'StudentEvalSubmit', params: { taskId: row.form_id } })
}

function actionLabel(row) {
  if (row.display_status === 'draft') return '继续填写'
  if (row.display_status === 'modifiable') return '修改评价'
  return '查看详情'
}

/** 是否即将截止（3天内） */
function isUrgent(row) {
  if (!row.modifiable_until) return false
  const end = new Date(row.modifiable_until)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
}

async function loadData() {
  loading.value = true
  const userId = userStore.userInfo?.id
  const tenantId = userStore.tenantId
  const schoolId = userStore.schoolId
  if (!userId || !tenantId) { loading.value = false; return }

  try {
    const context = { tenantId, schoolId, userId, role: 'student' }
    evaluations.value = await getMyEvaluations(context)
  } catch (err) {
    console.error('加载评价记录失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="page-container">
    <div class="page-header-area">
      <h2 class="page-title">我的评价</h2>
      <p class="page-subtitle">查看和管理已提交的评价记录</p>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <div
        v-for="opt in statusOptions"
        :key="opt.value"
        class="filter-chip"
        :class="{ active: statusFilter === opt.value }"
        @click="statusFilter = opt.value; currentPage = 1"
      >
        {{ opt.label }}
        <span class="filter-count">{{ statusCounts[opt.value] || 0 }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 列表 -->
    <div v-else-if="filteredEvaluations.length > 0" class="eval-list">
      <div
        v-for="item in pagedList"
        :key="item.id"
        class="eval-card"
      >
        <CoverImage
          :src="item.cover_img"
          :alt="item.form_title"
          width="140px"
          height="88px"
          radius="var(--radius-md)"
          class="eval-cover"
        />
        <div class="eval-body">
          <div class="eval-body-top">
            <h3 class="eval-title">{{ item.form_title }}</h3>
            <el-tag :type="statusTypeMap[item.display_status] || 'info'" size="small" effect="plain">
              {{ statusLabelMap[item.display_status] || item.status }}
            </el-tag>
          </div>
          <div class="eval-meta">
            <span class="meta-dept">{{ item.dept_name }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-target">{{ item.target_name }}</span>
          </div>
          <div class="eval-info-grid">
            <div class="eval-info-item">
              <span class="eval-info-label">类型</span>
              <span class="eval-info-value">{{ typeLabel(item.form_type) }}</span>
            </div>
            <div class="eval-info-item">
              <span class="eval-info-label">提交时间</span>
              <span class="eval-info-value">{{ formatDateTime(item.submitted_at) }}</span>
            </div>
            <div class="eval-info-item">
              <span class="eval-info-label">更新时间</span>
              <span class="eval-info-value">{{ formatDateTime(item.updated_at) }}</span>
            </div>
            <div v-if="item.display_status === 'modifiable'" class="eval-info-item eval-info-highlight">
              <span class="eval-info-label">可修改至</span>
              <span class="eval-info-value">
                {{ formatDateTime(item.modifiable_until) }}
                <span v-if="isUrgent(item)" class="urgent-tag">
                  <el-icon :size="12"><WarningFilled /></el-icon>
                  即将截止
                </span>
              </span>
            </div>
          </div>
        </div>
        <div class="eval-action">
          <el-tag size="small" effect="plain" class="action-type-tag">{{ typeLabel(item.form_type) }}</el-tag>
          <el-button
            size="small"
            :type="item.display_status === 'draft' || item.display_status === 'modifiable' ? 'primary' : 'default'"
            :plain="item.display_status === 'locked' || item.display_status === 'pending'"
            class="eval-action-btn"
            @click="handleAction(item)"
          >
            {{ actionLabel(item) }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无评价记录">
        <el-button type="primary" @click="router.push({ name: 'StudentEvaluationTasks' })">去评价中心</el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div v-if="filteredEvaluations.length > 1" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredEvaluations.length"
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
  gap: var(--space-5);
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: var(--space-8);
}

.page-header-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.page-title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  color: var(--color-text-body);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip:hover {
  border-color: var(--color-primary-200);
}

.filter-chip.active {
  background: var(--color-primary-50);
  border-color: var(--color-accent-user-700);
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-medium);
}

.filter-count {
  font-size: var(--font-2xs);
  background: var(--color-bg-light);
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

.filter-chip.active .filter-count {
  background: var(--color-accent-user-100);
}

.loading-skeleton {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

/* 评价卡片列表 */
.eval-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.eval-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  transition: all 0.2s;
  min-height: 120px;
}

.eval-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-primary-100);
}

.eval-cover {
  flex-shrink: 0;
}

.eval-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  justify-content: center;
}

.eval-body-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.eval-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  line-height: var(--line-height-tight);
}

.eval-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.meta-sep {
  color: var(--color-text-placeholder);
}

.eval-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-1) var(--space-5);
}

.eval-info-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.eval-info-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.eval-info-value {
  font-size: var(--font-sm);
  color: var(--color-text-heading);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.eval-info-highlight .eval-info-value {
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-semibold);
}

.urgent-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-xs);
}

.eval-action {
  width: 130px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: var(--space-2);
}

.action-type-tag {
  align-self: flex-end;
}

.eval-action :deep(.el-tag) {
  align-self: flex-end;
}

.eval-action-btn {
  width: 100%;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: var(--space-2);
}

.empty-state {
  padding: var(--space-10) 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .eval-card {
    flex-direction: column;
    align-items: stretch;
  }
  .eval-cover {
    align-self: center;
  }
  .eval-action {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
