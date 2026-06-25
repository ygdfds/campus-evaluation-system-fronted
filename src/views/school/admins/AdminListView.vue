<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Search, Plus, User,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  getSchoolAdminListApi,
  getSchoolAdminDetailApi,
  createSchoolAdminApi,
  toggleSchoolAdminStatusApi,
  deleteSchoolAdminApi,
  resetSchoolAdminPasswordApi,
  getSchoolAdminLogsApi,
  adminStatusMap,
} from '@/api/schoolAdmins'

defineOptions({ name: 'SchoolAdminListView' })

const userStore = useUserStore()
const tenantId = computed(() => userStore.userInfo?.tenant_id || userStore.userInfo?.school_id || 2)
const currentUserId = computed(() => userStore.userInfo?.id || userStore.userInfo?.user_id || null)

// ==================== 状态 ====================
const loading = ref(false)
const adminList = ref([])
const searchKeyword = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 统计
const stats = ref({ total: 0, primary: 0, sub: 0, disabled: 0 })

// 抽屉
const drawerVisible = ref(false)
const drawerFormRef = ref(null)
const drawerForm = ref({})
const drawerLoading = ref(false)

// 详情抽屉
const detailVisible = ref(false)
const detailData = ref(null)
const detailLoading = ref(false)
const adminLogs = ref([])

// 重置密码弹窗
const resetPwVisible = ref(false)
const resetPwForm = ref({ profileId: null, realName: '', newPassword: '' })
const resetPwLoading = ref(false)

// 状态映射
const statusMap = adminStatusMap

const roleFilterOptions = [
  { value: 'initial_admin', label: '初始管理员' },
  { value: 'sub_admin', label: '子管理员' },
]

// 表单校验
const drawerRules = {
  real_name: [
    { required: true, message: '请填写姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名 2-20 字', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请填写用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名 3-30 字', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只允许字母、数字、下划线', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

// ==================== 数据加载 ====================
async function loadData() {
  loading.value = true
  try {
    const data = await getSchoolAdminListApi(tenantId.value)
    adminList.value = data

    stats.value = {
      total: data.length,
      primary: data.filter(a => a.admin_type === 'initial_admin').length,
      sub: data.filter(a => a.admin_type === 'sub_admin').length,
      disabled: data.filter(a => a.account_status === 'disabled').length,
    }
  } catch {
    ElMessage.error('加载管理员列表失败')
  } finally {
    loading.value = false
  }
}

// ==================== 筛选 ====================
function handleSearch() {
  currentPage.value = 1
}

function handleReset() {
  searchKeyword.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

// 筛选
const filteredData = computed(() => {
  let data = adminList.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    data = data.filter(a =>
      (a.real_name && a.real_name.toLowerCase().includes(kw)) ||
      (a.username && a.username.toLowerCase().includes(kw))
    )
  }
  if (filterRole.value === 'initial_admin') {
    data = data.filter(a => a.admin_type === 'initial_admin')
  } else if (filterRole.value === 'sub_admin') {
    data = data.filter(a => a.admin_type === 'sub_admin')
  }
  if (filterStatus.value) {
    data = data.filter(a => a.account_status === filterStatus.value)
  }

  return data
})

const filteredTotal = computed(() => filteredData.value.length)

// 分页
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

// ==================== 安全检查 ====================
function isInitialAdmin(row) {
  return row.admin_type === 'initial_admin' || row.is_primary
}

function isSelf(row) {
  return currentUserId.value && Number(row.user_id) === Number(currentUserId.value)
}

// ==================== 抽屉操作 ====================
function openCreateDrawer() {
  drawerForm.value = {
    real_name: '',
    username: '',
    phone: '',
    email: '',
    gender: '',
    intro: '',
    must_change_password: true,
  }
  drawerVisible.value = true
}

async function handleDrawerSubmit() {
  try {
    await drawerFormRef.value?.validate()
  } catch {
    return
  }

  drawerLoading.value = true
  try {
    await createSchoolAdminApi(tenantId.value, drawerForm.value, currentUserId.value)
    ElMessage.success('子管理员创建成功')
    drawerVisible.value = false
    await loadData()
  } catch (err) {
    ElMessage.error(err.message || '创建失败')
  } finally {
    drawerLoading.value = false
  }
}

// ==================== 状态切换 ====================
async function handleToggleStatus(row) {
  // 安全检查
  if (isInitialAdmin(row)) {
    ElMessage.warning('初始管理员不可停用')
    return
  }
  if (isSelf(row)) {
    ElMessage.warning('不能停用当前登录账号')
    return
  }

  const newStatus = row.account_status === 'active' ? 'disabled' : 'active'
  const isDisable = newStatus === 'disabled'

  const title = isDisable ? '确认停用' : '确认启用'
  const message = isDisable
    ? '确认停用该管理员？停用后该账号将无法登录学校管理端，历史操作记录仍会保留。'
    : '确认启用该管理员？启用后该账号可重新登录学校管理端。'

  try {
    await ElMessageBox.confirm(message, title, {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
    await toggleSchoolAdminStatusApi(tenantId.value, row.id, newStatus, currentUserId.value)
    ElMessage.success(isDisable ? '停用成功' : '启用成功')
    await loadData()
  } catch { /* cancelled or error */ }
}

// ==================== 删除 ====================
async function handleDelete(row) {
  // 安全检查
  if (isInitialAdmin(row)) {
    ElMessage.warning('初始管理员不可删除')
    return
  }
  if (isSelf(row)) {
    ElMessage.warning('不能删除当前登录账号')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确认删除该管理员？删除后该账号将不再显示，历史操作记录仍会保留。',
      '确认删除',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
    await deleteSchoolAdminApi(tenantId.value, row.id, currentUserId.value)
    ElMessage.success('删除成功')
    await loadData()
  } catch { /* cancelled */ }
}

// ==================== 重置密码 ====================
function openResetPassword(row) {
  // 安全检查
  if (isInitialAdmin(row)) {
    ElMessage.warning('不能重置初始管理员密码')
    return
  }

  // 生成随机密码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 8; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  resetPwForm.value = { profileId: row.id, realName: row.real_name, newPassword: pw }
  resetPwVisible.value = true
}

async function handleResetPassword() {
  if (!resetPwForm.value.newPassword || resetPwForm.value.newPassword.length < 6) {
    ElMessage.warning('密码长度不少于 6 位')
    return
  }
  resetPwLoading.value = true
  try {
    await resetSchoolAdminPasswordApi(
      tenantId.value,
      resetPwForm.value.profileId,
      resetPwForm.value.newPassword,
      currentUserId.value,
    )
    ElMessage.success('密码重置成功，已要求该管理员首次登录时修改密码')
    resetPwVisible.value = false
  } catch (err) {
    ElMessage.error(err.message || '重置失败')
  } finally {
    resetPwLoading.value = false
  }
}

// ==================== 详情 ====================
async function openDetail(row) {
  detailLoading.value = true
  detailVisible.value = true
  adminLogs.value = []
  try {
    const [detail, logs] = await Promise.all([
      getSchoolAdminDetailApi(tenantId.value, row.id),
      getSchoolAdminLogsApi(tenantId.value, row.id),
    ])
    detailData.value = detail
    adminLogs.value = logs
  } catch {
    ElMessage.error('加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ==================== 工具函数 ====================
function formatDateTime(dt) {
  if (!dt || dt === '-') return '-'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function regeneratePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 8; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  resetPwForm.value.newPassword = pw
}

// ==================== 初始化 ====================
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <PageHeader title="管理员管理" description="管理学校管理员账号与权限">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreateDrawer">新增子管理员</el-button>
      </template>
    </PageHeader>

    <div class="stats-strip">
      <div class="strip-item">
        <span class="strip-value tone-primary">{{ stats.total }}</span>
        <span class="strip-label">总管理员</span>
      </div>
      <div class="strip-item">
        <span class="strip-value tone-warning">{{ stats.primary }}</span>
        <span class="strip-label">初始管理员</span>
      </div>
      <div class="strip-item">
        <span class="strip-value tone-success">{{ stats.sub }}</span>
        <span class="strip-label">子管理员</span>
      </div>
      <div class="strip-item">
        <span class="strip-value tone-danger">{{ stats.disabled }}</span>
        <span class="strip-label">已停用</span>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <el-card shadow="never" class="section-card filter-card">
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          :prefix-icon="Search"
          placeholder="搜索姓名/用户名"
          clearable
          class="filter-search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filterRole"
          placeholder="管理员类型"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option v-for="opt in roleFilterOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="账号状态"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="启用" value="active" />
          <el-option label="停用" value="disabled" />
        </el-select>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="section-card table-card">
      <el-table :data="pagedData" v-loading="loading" stripe style="width: 100%">
        <el-table-column label="头像" width="70" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" :src="row.avatar_url || undefined" :icon="User" />
          </template>
        </el-table-column>
        <el-table-column prop="real_name" label="姓名" width="110">
          <template #default="{ row }">{{ row.real_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="130">
          <template #default="{ row }">{{ row.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="管理员类型" width="120">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.admin_type === 'initial_admin' ? 'warning' : 'primary'"
              effect="plain"
            >
              {{ row.role_tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="联系电话" width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="160">
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <StatusTag :status="row.account_status" :status-map="statusMap" />
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ row.admin_type === 'initial_admin' ? '-' : (row.creator_name || '-') }}
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">{{ formatDateTime(row.last_login_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">查看详情</el-button>
            <template v-if="!isInitialAdmin(row)">
              <el-button link type="primary" size="small" @click="openResetPassword(row)">重置密码</el-button>
              <el-button
                link
                :type="row.account_status === 'active' ? 'warning' : 'success'"
                size="small"
                @click="handleToggleStatus(row)"
              >
                {{ row.account_status === 'active' ? '停用' : '启用' }}
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar" v-if="filteredTotal > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredTotal"
          layout="prev, pager, next"
        />
      </div>

      <!-- 空状态 -->
      <EmptyPlaceholder v-if="!loading && adminList.length === 0" text="暂无管理员数据" />
    </el-card>

    <!-- 新增子管理员抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="新增子管理员"
      size="560px"
      :close-on-click-modal="false"
    >
      <div class="drawer-notice-top">
        <p>子管理员创建后拥有学校管理端同等管理权限，可访问审核中心、组织架构、用户管理、评价表单、数据概览等页面。所有操作将记录日志。</p>
      </div>
      <el-form
        ref="drawerFormRef"
        :model="drawerForm"
        :rules="drawerRules"
        label-width="100px"
        v-loading="drawerLoading"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="drawerForm.real_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="drawerForm.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="drawerForm.phone" placeholder="选填" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="drawerForm.email" placeholder="选填" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="drawerForm.intro" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
        <el-divider content-position="left">安全设置</el-divider>
        <el-form-item label="强制改密">
          <el-switch v-model="drawerForm.must_change_password" active-text="是" inactive-text="否" />
          <span class="form-hint">开启后首次登录需修改密码</span>
        </el-form-item>
        <div class="drawer-notice">
          <p>初始密码将自动生成，创建后请通知该管理员登录并修改密码。</p>
        </div>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="drawerLoading" @click="handleDrawerSubmit">创建</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="管理员详情"
      size="560px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detailData">
          <div class="detail-header">
            <el-avatar :size="64" :src="detailData.avatar_url || undefined" :icon="User" />
            <div class="detail-header-info">
              <h4 class="detail-header-name">{{ detailData.real_name || '-' }}</h4>
              <el-tag
                size="small"
                :type="detailData.admin_type === 'initial_admin' ? 'warning' : 'primary'"
                effect="plain"
              >
                {{ detailData.role_tag }}
              </el-tag>
            </div>
          </div>
          <div class="detail-section">
            <h4 class="detail-section-title">基础信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="姓名">{{ detailData.real_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="用户名">{{ detailData.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="管理员类型">
                <el-tag
                  size="small"
                  :type="detailData.admin_type === 'initial_admin' ? 'warning' : 'primary'"
                  effect="plain"
                >
                  {{ detailData.role_tag }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detailData.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="简介">{{ detailData.intro || '-' }}</el-descriptions-item>
              <el-descriptions-item v-if="detailData.admin_type === 'sub_admin'" label="创建人">{{ detailData.creator_name || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="detail-section">
            <h4 class="detail-section-title">账号信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="账号状态">
                <StatusTag :status="detailData.account_status" :status-map="statusMap" />
              </el-descriptions-item>
              <el-descriptions-item label="最后登录">{{ formatDateTime(detailData.last_login_at) }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(detailData.created_at) }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-if="adminLogs.length > 0" class="detail-section">
            <h4 class="detail-section-title">操作记录（最近 10 条）</h4>
            <div class="log-list">
              <div v-for="log in adminLogs" :key="log.id" class="log-item">
                <span class="log-time">{{ formatDateTime(log.created_at) }}</span>
                <div class="log-body">
                  <span class="log-content">{{ log.content || '-' }}</span>
                  <span class="log-operator">操作人：{{ log.operator_name || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="detail-section">
            <h4 class="detail-section-title">操作记录</h4>
            <p class="no-logs">暂无操作记录</p>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetPwVisible" title="重置管理员密码" width="420px" :close-on-click-modal="false">
      <div class="reset-pw-content">
        <p class="reset-pw-hint">为管理员「{{ resetPwForm.realName }}」设置新密码：</p>
        <div class="reset-pw-row">
          <el-input v-model="resetPwForm.newPassword" placeholder="输入或生成新密码" class="reset-pw-input" />
          <el-button @click="regeneratePassword">重新生成</el-button>
        </div>
        <p class="reset-pw-note">重置后该管理员将被要求首次登录时修改密码。</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetPwVisible = false">取消</el-button>
          <el-button type="primary" :loading="resetPwLoading" @click="handleResetPassword">确认重置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* 统计卡片 */
.stats-strip {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
}

.strip-item {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.strip-item + .strip-item {
  padding-left: var(--space-5);
  border-left: 1px solid var(--color-border-lighter);
}

.strip-value {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  line-height: 1;
}

.strip-label {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.tone-primary { color: var(--color-primary); }
.tone-warning { color: var(--color-warning); }
.tone-success { color: var(--color-success); }
.tone-danger { color: var(--color-danger); }

/* 筛选栏 */
.filter-card {
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-lighter);
}

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
  width: 160px;
}

/* 表格 */
.table-card {
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-lighter);
}

/* 抽屉 */
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.drawer-notice-top {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-lighter);
  margin-bottom: var(--space-4);
}

.drawer-notice-top p {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed);
}

.drawer-notice {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-lighter);
}

.drawer-notice p {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.form-hint {
  margin-left: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

/* 详情 */
.detail-content {
  padding: var(--space-2) 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-lighter);
}

.detail-header-name {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-display);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-1);
}

.detail-header-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-section {
  margin-bottom: var(--space-6);
}

.detail-section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-display);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-lighter);
}

/* 操作记录 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
}

.log-time {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 120px;
}

.log-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.log-content {
  font-size: var(--font-sm);
  color: var(--color-text-body);
}

.log-operator {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.no-logs {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0;
}

/* 重置密码弹窗 */
.reset-pw-content {
  padding: var(--space-2) 0;
}

.reset-pw-hint {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  margin: 0 0 var(--space-3);
}

.reset-pw-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.reset-pw-input {
  flex: 1;
}

.reset-pw-note {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  margin: var(--space-2) 0 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* 响应式 */
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
/* SaaS refactor overrides */
.page-container {
  max-width: 1480px;
  margin-inline: auto;
  gap: var(--space-4);
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1px;
  overflow: hidden;
  padding: 0;
  background: var(--color-border-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.strip-item {
  min-height: 72px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg-card);
  position: relative;
}

.strip-item + .strip-item {
  padding-left: var(--space-4);
  border-left: 0;
}

.strip-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 3px;
  border-radius: var(--radius-full);
  background: var(--color-border-light);
}

.strip-value {
  font-family: var(--font-family-data);
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.strip-label {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
}

.section-card {
  border: 1px solid var(--color-border-lighter) !important;
  border-radius: var(--radius-card) !important;
  box-shadow: var(--shadow-card) !important;
  overflow: hidden;
}

.filter-card :deep(.el-card__body),
.section-card :deep(.el-card__body) {
  padding: var(--space-4) var(--space-5);
}

.filter-bar {
  gap: var(--space-2);
}

.table-card :deep(.el-card__body) {
  padding: var(--space-3);
}

.table-card :deep(.el-table) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-card :deep(.el-button.is-link) {
  padding: 0 var(--space-1);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.table-card :deep(.el-button.is-link:hover) {
  color: var(--color-primary-600);
}

.detail-section-title,
.section-title {
  letter-spacing: 0;
}

.detail-section-title::before,
.section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  margin-right: var(--space-2);
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, var(--color-primary-500), var(--color-accent-school-500));
  vertical-align: -2px;
}

@media (max-width: 900px) {
  .stats-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

