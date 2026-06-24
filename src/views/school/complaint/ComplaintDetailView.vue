<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Clock, ChatDotRound, User, OfficeBuilding,
  Document, CircleCheck,
} from '@element-plus/icons-vue'
import {
  getComplaintDetailApi, updateComplaintStatusApi,
  getComplaintTypeLabel, getComplaintStatusLabel, getPriorityLabel,
} from '@/api/schoolComplaint'

defineOptions({ name: 'ComplaintDetailView' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const detail = ref(null)
const processRecords = ref([])

// 处理表单
const handleVisible = ref(false)
const handleForm = ref({
  to_status: '',
  content: '',
})
const handleLoading = ref(false)

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
]

function getTypeTagType(type) {
  const map = { complaint: 'danger', suggestion: 'success', inquiry: 'info', praise: 'warning' }
  return map[type] || 'info'
}

function getStatusTagType(status) {
  const map = { pending: 'warning', processing: '', resolved: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

function getPriorityTagType(priority) {
  const map = { high: 'danger', normal: '', low: 'info' }
  return map[priority] || 'info'
}

function getRecordStatusType(status) {
  const map = { pending: 'warning', processing: '', resolved: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goBack() {
  router.push({ name: 'SchoolComplaintStats' })
}

function openHandleDialog() {
  if (!detail.value) return
  handleForm.value = {
    to_status: detail.value.status === 'pending' ? 'processing' : 'resolved',
    content: '',
  }
  handleVisible.value = true
}

async function submitHandle() {
  if (!handleForm.value.content.trim()) {
    ElMessage.warning('请填写处理说明')
    return
  }

  handleLoading.value = true
  try {
    const tenantId = userStore.tenantId
    await updateComplaintStatusApi(tenantId, detail.value.id, {
      from_status: detail.value.status,
      ...handleForm.value,
      handler_id: userStore.userInfo?.id || null,
    })
    ElMessage.success('处理成功')
    handleVisible.value = false
    // 重新加载详情
    await loadDetail()
  } catch (err) {
    console.error('处理失败:', err)
    ElMessage.error('处理失败，请重试')
  } finally {
    handleLoading.value = false
  }
}

async function loadDetail() {
  loading.value = true
  try {
    const tenantId = userStore.tenantId
    const complaintId = route.query.id
    if (!tenantId || !complaintId) return

    const data = await getComplaintDetailApi(tenantId, Number(complaintId))
    if (!data) {
      ElMessage.error('未找到该投诉记录')
      goBack()
      return
    }
    detail.value = data
    processRecords.value = data.processRecords || []
  } catch (err) {
    console.error('加载投诉详情失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading" class="page-container">
    <!-- 返回 -->
    <div class="back-bar">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回投诉列表
      </el-button>
    </div>

    <template v-if="detail">
      <!-- 标题区 -->
      <div class="detail-header">
        <div class="detail-title-row">
          <h2 class="detail-title">{{ detail.title }}</h2>
          <div class="detail-tags">
            <el-tag :type="getTypeTagType(detail.complaint_type)" size="small" effect="plain">
              {{ getComplaintTypeLabel(detail.complaint_type) }}
            </el-tag>
            <el-tag :type="getPriorityTagType(detail.priority)" size="small" effect="plain">
              {{ getPriorityLabel(detail.priority) }}优先级
            </el-tag>
            <el-tag :type="getStatusTagType(detail.status)" size="small" effect="dark">
              {{ getComplaintStatusLabel(detail.status) }}
            </el-tag>
            <el-tag v-if="detail.anonymous_to_handler" type="info" size="small">
              <el-icon :size="12"><ChatDotRound /></el-icon>
              匿名
            </el-tag>
          </div>
        </div>
        <span class="detail-meta">
          提交于 {{ formatDate(detail.created_at) }}
        </span>
      </div>

      <div class="detail-grid">
        <!-- 左侧：投诉内容 -->
        <div class="detail-main">
          <div class="info-card">
            <div class="info-card-header">
              <el-icon class="info-card-icon" color="var(--color-primary)"><Document /></el-icon>
              <h3 class="info-card-title">投诉内容</h3>
            </div>
            <div class="info-card-body">
              <p class="content-text">{{ detail.content || '暂无内容' }}</p>
            </div>
          </div>

          <!-- 提交人信息（仅非匿名时展示） -->
          <div v-if="detail.submitterInfo" class="info-card">
            <div class="info-card-header">
              <el-icon class="info-card-icon" color="var(--color-success)"><User /></el-icon>
              <h3 class="info-card-title">提交人信息</h3>
            </div>
            <div class="info-card-body">
              <div class="info-row">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ detail.submitterInfo.realName || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">角色</span>
                <span class="info-value">{{ detail.submitterInfo.roleType === 'student' ? '学生' : detail.submitterInfo.roleType === 'staff' ? '教职工' : detail.submitterInfo.roleType }}</span>
              </div>
            </div>
          </div>

          <!-- 匿名提示 -->
          <div v-else class="info-card anonymous-hint">
            <div class="info-card-body">
              <el-icon :size="20" color="var(--color-text-placeholder)"><ChatDotRound /></el-icon>
              <p>该投诉为匿名提交，提交人信息已隐藏</p>
            </div>
          </div>

          <!-- 关联部门 -->
          <div v-if="detail.orgInfo" class="info-card">
            <div class="info-card-header">
              <el-icon class="info-card-icon" color="var(--color-warning)"><OfficeBuilding /></el-icon>
              <h3 class="info-card-title">关联部门</h3>
            </div>
            <div class="info-card-body">
              <div class="info-row">
                <span class="info-label">部门名称</span>
                <span class="info-value">{{ detail.orgInfo.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">部门类型</span>
                <span class="info-value">{{ detail.orgInfo.type === 'teaching' ? '教学院系' : '服务部门' }}</span>
              </div>
            </div>
          </div>

          <!-- 处理记录时间线 -->
          <div class="info-card">
            <div class="info-card-header">
              <el-icon class="info-card-icon" color="var(--color-chart-info)"><Clock /></el-icon>
              <h3 class="info-card-title">处理记录</h3>
            </div>
            <div class="info-card-body">
              <el-timeline v-if="processRecords.length">
                <el-timeline-item
                  v-for="record in processRecords"
                  :key="record.id"
                  :timestamp="formatDate(record.created_at)"
                  placement="top"
                >
                  <div class="timeline-content">
                    <div class="timeline-status">
                      <el-tag v-if="record.from_status" :type="getRecordStatusType(record.from_status)" size="small">
                        {{ getComplaintStatusLabel(record.from_status) }}
                      </el-tag>
                      <span class="timeline-arrow">→</span>
                      <el-tag :type="getRecordStatusType(record.to_status)" size="small" effect="dark">
                        {{ getComplaintStatusLabel(record.to_status) }}
                      </el-tag>
                    </div>
                    <p class="timeline-text">{{ record.content }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无处理记录" :image-size="60" />
            </div>
          </div>
        </div>

        <!-- 右侧：操作区 -->
        <div class="detail-sidebar">
          <div class="info-card">
            <div class="info-card-header">
              <el-icon class="info-card-icon" color="var(--color-primary)"><CircleCheck /></el-icon>
              <h3 class="info-card-title">快速操作</h3>
            </div>
            <div class="info-card-body">
              <div class="sidebar-info">
                <div class="sidebar-info-row">
                  <span class="sidebar-label">投诉编号</span>
                  <span class="sidebar-value">#{{ detail.id }}</span>
                </div>
                <div class="sidebar-info-row">
                  <span class="sidebar-label">当前状态</span>
                  <el-tag :type="getStatusTagType(detail.status)" size="small" effect="dark">
                    {{ getComplaintStatusLabel(detail.status) }}
                  </el-tag>
                </div>
                <div class="sidebar-info-row">
                  <span class="sidebar-label">提交时间</span>
                  <span class="sidebar-value">{{ formatDate(detail.created_at) }}</span>
                </div>
                <div v-if="detail.resolved_at" class="sidebar-info-row">
                  <span class="sidebar-label">解决时间</span>
                  <span class="sidebar-value">{{ formatDate(detail.resolved_at) }}</span>
                </div>
              </div>

              <el-divider />

              <el-button
                v-if="detail.status !== 'resolved' && detail.status !== 'cancelled'"
                type="primary"
                class="handle-btn"
                @click="openHandleDialog"
              >
                处理此投诉
              </el-button>
              <el-tag v-else type="success" effect="plain" class="status-done-tag">
                <el-icon><CircleCheck /></el-icon>
                已处理完毕
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- 处理弹窗 -->
  <el-dialog v-model="handleVisible" title="处理投诉" width="480px" :close-on-click-modal="false">
    <el-form label-width="80px">
      <el-form-item label="目标状态">
        <el-select v-model="handleForm.to_status" class="full-width">
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
            :disabled="opt.value === detail?.status"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="处理说明" required>
        <el-input
          v-model="handleForm.content"
          type="textarea"
          :rows="4"
          placeholder="请填写处理说明..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleVisible = false">取消</el-button>
      <el-button type="primary" :loading="handleLoading" @click="submitHandle">确认处理</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.page-container {
  padding: var(--space-6) var(--space-4);
  max-width: var(--page-max-width);
  margin-inline: auto;
}

.back-bar {
  margin-bottom: var(--space-4);
}

/* 标题区 */
.detail-header {
  margin-bottom: var(--space-5);
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-2);
}

.detail-title {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.detail-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.detail-meta {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 布局 */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-4);
  align-items: start;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.detail-sidebar {
  position: sticky;
  top: var(--space-4);
}

/* 信息卡片 */
.info-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  overflow: hidden;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-lighter);
}

.info-card-icon { font-size: var(--font-xl); }

.info-card-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0;
}

.info-card-body {
  padding: var(--space-4);
}

.content-text {
  font-size: var(--font-base);
  color: var(--color-text-body);
  line-height: var(--line-height-loose);
  margin: 0;
  white-space: pre-wrap;
}

/* 匿名提示 */
.anonymous-hint .info-card-body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

.anonymous-hint .info-card-body p {
  margin: 0;
}

/* 信息行 */
.info-row {
  display: flex;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: var(--border-lighter);
  gap: var(--space-2);
}

.info-row:last-child { border-bottom: none; padding-bottom: 0; }
.info-row:first-child { padding-top: 0; }

.info-label {
  width: var(--info-label-width);
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.info-value {
  font-size: var(--font-sm);
  color: var(--color-text-title);
  flex: 1;
}

/* 时间线 */
.timeline-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.timeline-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.timeline-arrow {
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

.timeline-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  margin: 0;
  line-height: var(--line-height-normal);
}

/* 侧边栏 */
.sidebar-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sidebar-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.sidebar-value {
  font-size: var(--font-sm);
  color: var(--color-text-title);
}

.handle-btn {
  width: 100%;
}

.status-done-tag {
  width: 100%;
  justify-content: center;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
}

.full-width {
  width: 100%;
}

/* 响应式 */
@media (max-width: 1366px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: var(--space-4) var(--space-3);
  }
  .detail-title-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
