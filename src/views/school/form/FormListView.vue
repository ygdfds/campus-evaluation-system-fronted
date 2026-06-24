<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Search, Plus,
  Clock,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  getSchoolFormListApi,
  getSchoolFormStatsApi,
  getSchoolFormDetailApi,
  getSchoolFormWindowsApi,
  closeFormApi,
  deleteSchoolFormApi,
  createSchoolFormWindowApi,
  closeSchoolFormWindowApi,
  formTypeMap,
  formStatusMap,
  publishScopeMap,
} from '@/api/schoolForms'

defineOptions({ name: 'SchoolFormListView' })

const userStore = useUserStore()
const router = useRouter()
const tenantId = computed(() => userStore.userInfo?.tenant_id || userStore.userInfo?.school_id || 2)

// ==================== 状态 ====================
const loading = ref(false)
const formList = ref([])
const searchKeyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 统计
const stats = ref({ total: 0, published: 0, pending_review: 0, closed: 0 })

// 筛选选项
const typeOptions = Object.entries(formTypeMap).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(formStatusMap).map(([value, label]) => ({ value, label }))

// 状态标签映射
const statusTagMap = {
  draft: { label: '草稿', type: 'info' },
  pending_review: { label: '待审核', type: 'warning' },
  published: { label: '已发布', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' },
  closed: { label: '已关闭', type: 'info' },
}

const windowStatusTagMap = {
  open: { label: '开放中', type: 'success' },
  scheduled: { label: '待开放', type: 'warning' },
  closed: { label: '已关闭', type: 'info' },
}

// ==================== 详情抽屉 ====================
const detailVisible = ref(false)
const detailData = ref(null)
const detailLoading = ref(false)

// ==================== 窗口管理弹窗 ====================
const windowVisible = ref(false)
const windowFormId = ref(null)
const windowList = ref([])
const windowLoading = ref(false)
const showCreateWindow = ref(false)
const windowFormRef = ref(null)
const windowForm = ref({
  start_at: '',
  end_at: '',
  modifiable_hours: 24,
})
const windowFormRules = {
  start_at: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_at: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

// ==================== 数据加载 ====================
async function loadData() {
  loading.value = true
  try {
    const filters = {
      keyword: searchKeyword.value,
      type: filterType.value || undefined,
      status: filterStatus.value || undefined,
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    const data = await getSchoolFormListApi({ tenantId: tenantId.value }, filters)
    formList.value = data.list
    total.value = data.total
  } catch {
    ElMessage.error('加载表单列表失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const data = await getSchoolFormStatsApi({ tenantId: tenantId.value })
    stats.value = data
  } catch {
    // 统计加载失败不影响页面
  }
}

function handleReset() {
  searchKeyword.value = ''
  filterType.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  loadData()
}

function handlePageChange(page) {
  currentPage.value = page
  loadData()
}

// ==================== 详情 ====================
async function handleViewDetail(row) {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const data = await getSchoolFormDetailApi({ tenantId: tenantId.value }, row.id)
    detailData.value = data
  } catch {
    ElMessage.error('加载表单详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ==================== 审核操作 ====================
function handleAudit() {
  router.push('/school/audit/list')
}

// ==================== 状态管理 ====================
async function handleCloseForm(row) {
  try {
    await ElMessageBox.confirm(
      `确认关闭表单「${row.title}」？关闭后学生将无法继续提交评价。`,
      '关闭表单',
      { type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '取消' },
    )
    await closeFormApi({ tenantId: tenantId.value, userId: userStore.userInfo?.id || 1 }, row.id)
    ElMessage.success('表单已关闭')
    await loadData()
    await loadStats()
  } catch {
    // 用户取消
  }
}

async function handleDeleteForm(row) {
  try {
    await ElMessageBox.confirm(
      `确认删除表单「${row.title}」？删除后不可恢复。`,
      '删除表单',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    await deleteSchoolFormApi({ tenantId: tenantId.value, userId: userStore.userInfo?.id || 1 }, row.id)
    ElMessage.success('表单已删除')
    await loadData()
    await loadStats()
  } catch {
    // 用户取消
  }
}

// ==================== 窗口管理 ====================
async function handleManageWindow(row) {
  windowFormId.value = row.id
  showCreateWindow.value = false
  windowVisible.value = true
  await loadWindows()
}

async function loadWindows() {
  windowLoading.value = true
  try {
    const data = await getSchoolFormWindowsApi({ tenantId: tenantId.value }, windowFormId.value)
    windowList.value = data
  } catch {
    ElMessage.error('加载窗口列表失败')
  } finally {
    windowLoading.value = false
  }
}

function handleCreateWindow() {
  showCreateWindow.value = true
  windowForm.value = {
    start_at: '',
    end_at: '',
    modifiable_hours: 24,
  }
}

async function handleSubmitWindow() {
  try {
    await windowFormRef.value.validate()
  } catch {
    return
  }

  windowLoading.value = true
  try {
    await createSchoolFormWindowApi(
      { tenantId: tenantId.value, userId: userStore.userInfo?.id || 1 },
      {
        form_id: windowFormId.value,
        type: 'service',
        start_at: new Date(windowForm.value.start_at).toISOString(),
        end_at: new Date(windowForm.value.end_at).toISOString(),
        modifiable_hours: windowForm.value.modifiable_hours,
        status: 'scheduled',
      },
    )
    ElMessage.success('窗口创建成功')
    showCreateWindow.value = false
    await loadWindows()
  } catch {
    ElMessage.error('窗口创建失败')
  } finally {
    windowLoading.value = false
  }
}

async function handleCloseWindow(window) {
  try {
    await ElMessageBox.confirm(
      `确认关闭窗口？关闭后学生将无法继续提交评价。`,
      '关闭窗口',
      { type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '取消' },
    )
    await closeSchoolFormWindowApi(
      { tenantId: tenantId.value, userId: userStore.userInfo?.id || 1 },
      window.id,
    )
    ElMessage.success('窗口已关闭')
    await loadWindows()
  } catch {
    // 用户取消
  }
}

// ==================== 工具函数 ====================
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTimeRange(start, end) {
  if (!start || !end) return '-'
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleDateString('zh-CN')} ~ ${e.toLocaleDateString('zh-CN')}`
}

function getQuestionTypeIcon(type) {
  const iconMap = {
    rating: '⭐',
    single: '🔘',
    multiple: '☑️',
    text: '📝',
  }
  return iconMap[type] || '📋'
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadData()
  loadStats()
})
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <PageHeader title="表单管理" description="管理评价表单模板及发布审核">
      <template #actions>
        <el-button type="primary" :icon="Plus">创建表单</el-button>
      </template>
    </PageHeader>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-total">
        <div class="stat-label">总表单数</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div class="stat-card stat-published">
        <div class="stat-label">已发布</div>
        <div class="stat-value">{{ stats.published }}</div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-label">待审核</div>
        <div class="stat-value">{{ stats.pending_review }}</div>
      </div>
      <div class="stat-card stat-closed">
        <div class="stat-label">已关闭</div>
        <div class="stat-value">{{ stats.closed }}</div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <el-card shadow="hover" class="section-card">
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索表单名称"
          :prefix-icon="Search"
          clearable
          class="filter-search"
          @clear="loadData"
          @keyup.enter="loadData"
        />
        <el-select v-model="filterType" placeholder="表单类型" clearable class="filter-select" @change="loadData">
          <el-option label="全部类型" value="" />
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="表单状态" clearable class="filter-select" @change="loadData">
          <el-option label="全部状态" value="" />
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="section-card">
      <el-table v-loading="loading" :data="formList" stripe style="width: 100%">
        <el-table-column prop="title" label="表单名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ formTypeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="_target_name" label="评价对象" min-width="150" show-overflow-tooltip />
        <el-table-column prop="_org_name" label="所属组织" width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="statusTagMap" />
          </template>
        </el-table-column>
        <el-table-column label="评价窗口" width="180">
          <template #default="{ row }">
            <template v-if="row._window">
              <div class="window-info">
                <StatusTag :status="row._window.status" :status-map="windowStatusTagMap" />
                <span class="window-time">{{ formatDateTimeRange(row._window.start_at, row._window.end_at) }}</span>
              </div>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="_question_count" label="题目数" width="80" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'draft'">
              <el-button link type="primary" size="small" @click="handleViewDetail(row)">编辑</el-button>
              <el-button link type="warning" size="small">提交审核</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteForm(row)">删除</el-button>
            </template>
            <template v-else-if="row.status === 'pending_review'">
              <el-button link type="primary" size="small" @click="handleAudit(row)">审核</el-button>
              <el-button link type="info" size="small" @click="handleViewDetail(row)">查看详情</el-button>
            </template>
            <template v-else-if="row.status === 'published'">
              <el-button link type="warning" size="small" @click="handleManageWindow(row)">
                <el-icon><Clock /></el-icon> 窗口
              </el-button>
              <el-button link type="warning" size="small" @click="handleCloseForm(row)">关闭</el-button>
              <el-button link type="info" size="small" @click="handleViewDetail(row)">查看详情</el-button>
            </template>
            <template v-else-if="row.status === 'rejected'">
              <el-button link type="primary" size="small" @click="handleViewDetail(row)">编辑</el-button>
              <el-button link type="warning" size="small">重新提交</el-button>
            </template>
            <template v-else-if="row.status === 'closed'">
              <el-button link type="info" size="small" @click="handleViewDetail(row)">查看详情</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <EmptyPlaceholder v-if="!loading && formList.length === 0" text="暂无评价表单" description="点击「创建表单」开始创建评价表单" />

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- ==================== 详情抽屉 ==================== -->
    <el-drawer v-model="detailVisible" title="表单详情" size="640px" :close-on-click-modal="false">
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detailData">
          <!-- 封面图 -->
          <div v-if="detailData._cover_url" class="detail-cover">
            <img :src="detailData._cover_url" :alt="detailData.title" class="cover-image" />
          </div>

          <!-- 基本信息 -->
          <div class="detail-section">
            <h3 class="section-title">基本信息</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="表单名称">{{ detailData.title }}</el-descriptions-item>
              <el-descriptions-item label="表单类型">
                <el-tag size="small" effect="plain">{{ formTypeMap[detailData.type] || detailData.type }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="评价对象">{{ detailData._target_name }}</el-descriptions-item>
              <el-descriptions-item label="所属组织">{{ detailData._org_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="发布范围">
                {{ publishScopeMap[detailData.publish_scope] || detailData.publish_scope || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="匿名评价">
                {{ detailData.anonymous ? '是' : '否' }}
              </el-descriptions-item>
              <el-descriptions-item label="表单状态">
                <StatusTag :status="detailData.status" :status-map="statusTagMap" />
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(detailData.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDate(detailData.updated_at) }}</el-descriptions-item>
              <el-descriptions-item label="描述" v-if="detailData.description">
                {{ detailData.description }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 评价窗口 -->
          <div v-if="detailData._windows && detailData._windows.length > 0" class="detail-section">
            <h3 class="section-title">评价窗口</h3>
            <div v-for="w in detailData._windows" :key="w.id" class="window-card">
              <div class="window-card-header">
                <StatusTag :status="w.status" :status-map="windowStatusTagMap" />
                <span class="window-card-time">{{ formatDateTimeRange(w.start_at, w.end_at) }}</span>
              </div>
              <div class="window-card-body">
                <span>可修改时长：{{ w.modifiable_hours }} 小时</span>
              </div>
            </div>
          </div>

          <!-- 审核记录 -->
          <div v-if="detailData._audits && detailData._audits.length > 0" class="detail-section">
            <h3 class="section-title">审核记录</h3>
            <el-timeline>
              <el-timeline-item
                v-for="audit in detailData._audits"
                :key="audit.id"
                :timestamp="formatDate(audit.requested_at)"
                placement="top"
              >
                <div class="audit-item">
                  <div class="audit-header">
                    <span class="audit-action">提交发布审核</span>
                    <StatusTag
                      :status="audit.status"
                      :status-map="{
                        pending: { label: '待审核', type: 'warning' },
                        approved: { label: '已通过', type: 'success' },
                        rejected: { label: '已拒绝', type: 'danger' },
                      }"
                    />
                  </div>
                  <p v-if="audit.submit_reason" class="audit-reason">{{ audit.submit_reason }}</p>
                  <template v-if="audit.reviewed_at">
                    <p class="audit-reviewer">审核人：{{ audit.reviewed_by }}</p>
                    <p v-if="audit.review_comment" class="audit-comment">{{ audit.review_comment }}</p>
                  </template>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 题目预览 -->
          <div v-if="detailData._questions && detailData._questions.length > 0" class="detail-section">
            <h3 class="section-title">题目预览（{{ detailData._questions.length }}）</h3>
            <div v-for="(q, idx) in detailData._questions" :key="q.id" class="question-item">
              <div class="question-header">
                <span class="question-index">{{ idx + 1 }}.</span>
                <span class="question-type-icon">{{ getQuestionTypeIcon(q.type) }}</span>
                <span class="question-title">{{ q.title }}</span>
                <el-tag v-if="q.required" size="small" type="danger" effect="plain" class="question-required">必答</el-tag>
              </div>
              <div v-if="q._options && q._options.length > 0" class="question-options">
                <span v-for="opt in q._options" :key="opt.id" class="option-tag">
                  {{ opt.option_text }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- ==================== 窗口管理弹窗 ==================== -->
    <el-dialog v-model="windowVisible" title="评价窗口管理" width="480px" :close-on-click-modal="false">
      <div v-loading="windowLoading" class="window-content">
        <!-- 当前窗口列表 -->
        <div v-if="windowList.length > 0" class="window-list-section">
          <div v-for="w in windowList" :key="w.id" class="window-list-item">
            <div class="window-list-header">
              <StatusTag :status="w.status" :status-map="windowStatusTagMap" />
              <span class="window-list-time">{{ formatDateTimeRange(w.start_at, w.end_at) }}</span>
            </div>
            <div class="window-list-body">
              <span>可修改时长：{{ w.modifiable_hours }} 小时</span>
              <el-button
                v-if="w.status !== 'closed'"
                link
                type="danger"
                size="small"
                @click="handleCloseWindow(w)"
              >
                关闭
              </el-button>
            </div>
          </div>
        </div>
        <EmptyPlaceholder v-else-if="!windowLoading" text="暂无评价窗口" description="点击下方按钮创建新窗口" />

        <!-- 创建窗口表单 -->
        <template v-if="showCreateWindow">
          <el-divider />
          <h4 class="create-window-title">新建评价窗口</h4>
          <el-form ref="windowFormRef" :model="windowForm" :rules="windowFormRules" label-width="90px">
            <el-form-item label="开始时间" prop="start_at">
              <el-date-picker
                v-model="windowForm.start_at"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item label="结束时间" prop="end_at">
              <el-date-picker
                v-model="windowForm.end_at"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
            <el-form-item label="可修改时长">
              <el-input-number
                v-model="windowForm.modifiable_hours"
                :min="0"
                :max="72"
                :step="1"
              />
              <span class="unit-text">小时</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="windowLoading" @click="handleSubmitWindow">
                创建窗口
              </el-button>
              <el-button @click="showCreateWindow = false">取消</el-button>
            </el-form-item>
          </el-form>
        </template>

        <template v-else>
          <el-button type="primary" plain style="width: 100%; margin-top: var(--space-4)" @click="handleCreateWindow">
            <el-icon><Plus /></el-icon> 新建窗口
          </el-button>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ==================== 统计卡片 ==================== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  box-shadow: var(--shadow-sm);
  border: var(--border-lighter);
  transition: box-shadow 0.2s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.stat-total .stat-value { color: var(--color-text-primary); }
.stat-published .stat-value { color: var(--color-success); }
.stat-pending .stat-value { color: var(--color-warning); }
.stat-closed .stat-value { color: var(--color-info); }

/* ==================== 筛选栏 ==================== */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.filter-search {
  width: 240px;
}

.filter-select {
  width: 140px;
}

/* ==================== 通用 ==================== */
.section-card {
  border-radius: var(--radius-lg);
}

.text-muted {
  color: var(--color-text-placeholder);
}

.window-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.window-time {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

/* ==================== 详情抽屉 ==================== */
.detail-content {
  padding: var(--space-2);
}

.detail-cover {
  margin-bottom: var(--space-5);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.detail-section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: var(--border-lighter);
}

.window-card {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}

.window-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.window-card-time {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.window-card-body {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

/* 审核记录 */
.audit-item {
  padding: var(--space-2) 0;
}

.audit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.audit-action {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-regular);
}

.audit-reason {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0;
}

.audit-reviewer {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  margin: var(--space-1) 0;
}

.audit-comment {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  background: var(--color-bg-subtle);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  margin: var(--space-2) 0 0;
}

/* 题目预览 */
.question-item {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.question-index {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  min-width: var(--space-6);
}

.question-type-icon {
  font-size: var(--font-base);
}

.question-title {
  font-size: var(--font-sm);
  color: var(--color-text-regular);
  flex: 1;
}

.question-required {
  flex-shrink: 0;
}

.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-left: var(--space-8);
}

.option-tag {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  background: var(--color-bg-card);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: var(--border-lighter);
}

/* ==================== 窗口管理弹窗 ==================== */
.window-content {
  padding: var(--space-2) 0;
}

.window-list-section {
  margin-bottom: var(--space-4);
}

.window-list-item {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}

.window-list-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.window-list-time {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.window-list-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

.create-window-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-4);
}

.unit-text {
  margin-left: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search,
  .filter-select {
    width: 100%;
  }
}
</style>
