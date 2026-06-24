<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Search, Plus, Upload,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  getSchoolStudentListApi,
  getSchoolStudentDetailApi,
  createSchoolStudentApi,
  updateSchoolStudentApi,
  toggleSchoolStudentStatusApi,
  deleteSchoolStudentApi,
  getSchoolDepartmentOptionsApi,
  getSchoolClassOptionsApi,
} from '@/api/schoolUsers'

defineOptions({ name: 'SchoolStudentListView' })

const userStore = useUserStore()
const tenantId = computed(() => userStore.userInfo?.tenant_id || userStore.userInfo?.school_id || 2)

// ==================== 状态 ====================
const loading = ref(false)
const studentList = ref([])
const searchKeyword = ref('')
const filterDepartment = ref([])
const filterClass = ref([])
const filterStatus = ref('')
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 统计
const stats = ref({ total: 0, active: 0, disabled: 0 })

// 选项
const departmentOptions = ref([])
const classOptions = ref([])

// 抽屉
const drawerVisible = ref(false)
const drawerMode = ref('create')
const drawerFormRef = ref(null)
const drawerForm = ref({})
const drawerLoading = ref(false)

// 详情抽屉
const detailVisible = ref(false)
const detailData = ref(null)
const detailLoading = ref(false)

// 状态映射
const statusMap = {
  active: { label: '在读', type: 'success' },
  disabled: { label: '停用', type: 'danger' },
}

const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
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
}

// ==================== 数据加载 ====================
async function loadData() {
  loading.value = true
  try {
    const filters = {
      keyword: searchKeyword.value,
      department_name: filterDepartment.value,
      class_name: filterClass.value,
      account_status: filterStatus.value || undefined,
    }
    const data = await getSchoolStudentListApi(tenantId.value, filters)
    studentList.value = data
    total.value = data.length

    stats.value = {
      total: data.length,
      active: data.filter(s => s.account_status === 'active').length,
      disabled: data.filter(s => s.account_status === 'disabled').length,
    }
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    const [depts, classes] = await Promise.all([
      getSchoolDepartmentOptionsApi(tenantId.value),
      getSchoolClassOptionsApi(tenantId.value),
    ])
    departmentOptions.value = depts
    classOptions.value = classes
  } catch { /* ignore */ }
}

// ==================== 筛选 ====================
function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleReset() {
  searchKeyword.value = ''
  filterDepartment.value = []
  filterClass.value = []
  filterStatus.value = ''
  currentPage.value = 1
  loadData()
}

// 分页
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return studentList.value.slice(start, start + pageSize.value)
})

// ==================== 抽屉操作 ====================
function openCreateDrawer() {
  drawerMode.value = 'create'
  drawerForm.value = {
    real_name: '',
    username: '',
    no_student: '',
    gender: '',
    phone: '',
    email: '',
    department_name: '',
    class_name: '',
    must_change_password: true,
  }
  drawerVisible.value = true
}

async function openEditDrawer(row) {
  drawerMode.value = 'edit'
  drawerLoading.value = true
  try {
    const detail = await getSchoolStudentDetailApi(tenantId.value, row.id)
    if (detail) {
      drawerForm.value = {
        real_name: detail.real_name || '',
        no_student: detail.no_student || '',
        gender: detail.gender || '',
        phone: detail.account?.phone || '',
        email: detail.account?.email || '',
        department_name: detail.department_name || '',
        class_name: detail.class_name || '',
        must_change_password: detail.account?.must_change_password || false,
      }
    }
    drawerVisible.value = true
  } catch {
    ElMessage.error('加载详情失败')
  } finally {
    drawerLoading.value = false
  }
}

async function handleDrawerSubmit() {
  try {
    await drawerFormRef.value?.validate()
  } catch {
    return
  }

  drawerLoading.value = true
  try {
    if (drawerMode.value === 'create') {
      await createSchoolStudentApi(tenantId.value, drawerForm.value)
      ElMessage.success('新增学生成功')
    } else {
      await updateSchoolStudentApi(tenantId.value, drawerForm.value._id, drawerForm.value)
      ElMessage.success('编辑学生成功')
    }
    drawerVisible.value = false
    await loadData()
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    drawerLoading.value = false
  }
}

// ==================== 状态切换 ====================
async function handleToggleStatus(row) {
  const newStatus = row.account_status === 'active' ? 'disabled' : 'active'
  const actionText = newStatus === 'active' ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}学生「${row.real_name}」的账号吗？`,
      '确认操作',
      { type: 'warning' }
    )
    await toggleSchoolStudentStatusApi(tenantId.value, row.id, newStatus)
    ElMessage.success(`${actionText}成功`)
    await loadData()
  } catch { /* cancelled */ }
}

// ==================== 删除 ====================
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生「${row.real_name}」吗？删除后不可恢复。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await deleteSchoolStudentApi(tenantId.value, row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch { /* cancelled */ }
}

// ==================== 详情 ====================
async function openDetail(row) {
  detailLoading.value = true
  detailVisible.value = true
  try {
    detailData.value = await getSchoolStudentDetailApi(tenantId.value, row.id)
  } catch {
    ElMessage.error('加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ==================== 批量导入 ====================
function handleImport() {
  ElMessage.info('批量导入功能开发中')
}

// ==================== 工具函数 ====================
function formatDateTime(dt) {
  if (!dt || dt === '-') return '-'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ==================== 初始化 ====================
onMounted(() => {
  loadOptions()
  loadData()
})
</script>

<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <PageHeader title="学生管理" description="管理学校学生信息与账号">
      <template #actions>
        <el-button :icon="Upload" @click="handleImport">批量导入</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDrawer">新增学生</el-button>
      </template>
    </PageHeader>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-total">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总人数</div>
      </div>
      <div class="stat-card stat-active">
        <div class="stat-value">{{ stats.active }}</div>
        <div class="stat-label">在读</div>
      </div>
      <div class="stat-card stat-disabled">
        <div class="stat-value">{{ stats.disabled }}</div>
        <div class="stat-label">停用</div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <el-card shadow="hover" class="section-card filter-card">
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          :prefix-icon="Search"
          placeholder="搜索姓名/学号"
          clearable
          class="filter-search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filterDepartment"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="所属院系"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in departmentOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="filterClass"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="班级"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in classOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="账号状态"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="在读" value="active" />
          <el-option label="停用" value="disabled" />
        </el-select>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="section-card table-card">
      <el-table :data="pagedData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="no_student" label="学号" width="130">
          <template #default="{ row }">{{ row.no_student || '-' }}</template>
        </el-table-column>
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column prop="department_name" label="院系" min-width="160">
          <template #default="{ row }">{{ row.department_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="class_name" label="班级" width="140">
          <template #default="{ row }">{{ row.class_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="性别" width="80">
          <template #default="{ row }">{{ row.gender_label || '-' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.account_status" :status-map="statusMap" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="openEditDrawer(row)">编辑</el-button>
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
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>

      <!-- 空状态 -->
      <EmptyPlaceholder v-if="!loading && studentList.length === 0" text="暂无学生数据" description="点击「新增学生」添加第一位学生" />
    </el-card>

    <!-- 新增/编辑抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerMode === 'create' ? '新增学生' : '编辑学生'"
      size="640px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="drawerFormRef"
        :model="drawerForm"
        :rules="drawerRules"
        label-width="100px"
        v-loading="drawerLoading"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="real_name">
              <el-input v-model="drawerForm.real_name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="drawerMode === 'create'">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="drawerForm.username" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input v-model="drawerForm.no_student" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="drawerForm.gender" placeholder="请选择性别" clearable style="width: 100%">
                <el-option v-for="opt in genderOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属院系">
              <el-select v-model="drawerForm.department_name" placeholder="请选择院系" clearable style="width: 100%">
                <el-option
                  v-for="opt in departmentOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级">
              <el-select v-model="drawerForm.class_name" placeholder="请选择班级" clearable style="width: 100%">
                <el-option
                  v-for="opt in classOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="drawerForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="drawerForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="强制改密" v-if="drawerMode === 'create'">
          <el-switch v-model="drawerForm.must_change_password" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="drawerLoading" @click="handleDrawerSubmit">
            {{ drawerMode === 'create' ? '创建' : '保存' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="学生详情"
      size="560px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detailData">
          <div class="detail-section">
            <h4 class="detail-section-title">基础信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="姓名">{{ detailData.real_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="学号">{{ detailData.no_student || '-' }}</el-descriptions-item>
              <el-descriptions-item label="院系">{{ detailData.department_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="班级">{{ detailData.class_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ detailData.gender_label || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="detail-section">
            <h4 class="detail-section-title">账号信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">{{ detailData.account?.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detailData.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="账号状态">
                <StatusTag :status="detailData.account_status" :status-map="statusMap" />
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(detailData.created_at) }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-card {
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-lg);
  border: var(--border-light);
  background: var(--color-bg-card);
}

.stat-card:hover {
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

.stat-total .stat-value { color: var(--color-primary); }
.stat-active .stat-value { color: var(--color-success); }
.stat-disabled .stat-value { color: var(--color-danger); }

/* 筛选栏 */
.filter-card {
  border-radius: var(--radius-lg);
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
  border-radius: var(--radius-lg);
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

/* 抽屉底部 */
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* 详情 */
.detail-content {
  padding: var(--space-2) 0;
}

.detail-section {
  margin-bottom: var(--space-6);
}

.detail-section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: var(--border-lighter);
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
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
