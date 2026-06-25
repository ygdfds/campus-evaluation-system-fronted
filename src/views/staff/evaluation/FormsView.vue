<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStaffRoleCodes, getStaffRoleNames } from '@/utils/staffPermission'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import StaffFormStatusCards from '@/components/staff/evaluation/StaffFormStatusCards.vue'
import StaffFormFilterBar from '@/components/staff/evaluation/StaffFormFilterBar.vue'
import StaffEvalFormCard from '@/components/staff/evaluation/StaffEvalFormCard.vue'
import StaffEvalFormDrawer from '@/components/staff/evaluation/StaffEvalFormDrawer.vue'
import StaffEvalFormDetailDrawer from '@/components/staff/evaluation/StaffEvalFormDetailDrawer.vue'
import SubmitAuditDialog from '@/components/staff/evaluation/SubmitAuditDialog.vue'
import StaffEvalFormDataDrawer from '@/components/staff/evaluation/StaffEvalFormDataDrawer.vue'
import {
  getStaffEvalFormsApi,
  getStaffEvalFormStatsApi,
  getEvalFormDetailApi,
  getEvalQuestionsByFormApi,
  deleteDraftEvalFormApi,
  submitFormForAuditApi,
  withdrawAuditApi,
  updateEvalFormApi,
  updateEvalWindowApi,
} from '@/api/staffEvaluationForms'

defineOptions({ name: 'StaffEvalFormsView' })

const userStore = useUserStore()

// 权限检查
const roleCodes = getStaffRoleCodes(userStore.userInfo)
const roleNames = getStaffRoleNames(roleCodes)
const hasPermission = roleCodes.some(c => ['teaching_admin', 'service_admin', 'form_publisher', 'school_admin'].includes(c))

// 数据状态
const loading = ref(false)
const formList = ref([])
const stats = ref({ draft: 0, pending_review: 0, published: 0, rejected: 0, closed: 0, total: 0 })
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(6)

// 筛选
const filters = reactive({
  keyword: '',
  type: 'all',
  status: 'all',
  targetType: 'all',
  sort: 'latest_update',
})

// 新建/编辑抽屉
const drawerVisible = ref(false)
const drawerMode = ref('create')
const currentFormData = ref({})

// 详情抽屉
const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref({})

// 提交审核弹窗
const auditDialogVisible = ref(false)
const auditFormItem = ref({})

// 数据抽屉
const dataDrawerVisible = ref(false)
const dataDrawerItem = ref({})

// 上下文
const context = computed(() => ({
  tenantId: userStore.tenantId,
  userId: userStore.userInfo?.id,
  schoolId: userStore.userInfo?.school_id,
  roleCodes,
}))

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const [listRes, statsRes] = await Promise.all([
      getStaffEvalFormsApi(context.value, {
        ...filters,
        page: currentPage.value,
        pageSize: pageSize.value,
      }),
      getStaffEvalFormStatsApi(context.value),
    ])
    formList.value = listRes.list
    total.value = listRes.total
    stats.value = statsRes
  } catch (err) {
    console.error('加载评价表单列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 新建
function handleCreate() {
  drawerMode.value = 'create'
  currentFormData.value = { _context: context.value }
  drawerVisible.value = true
}

// 编辑
function handleEdit(item) {
  drawerMode.value = 'edit'
  currentFormData.value = { ...item, _context: context.value }
  drawerVisible.value = true
}

// 查看详情
async function handleView(item) {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const [detail, questions] = await Promise.all([
      getEvalFormDetailApi(context.value, item.id),
      getEvalQuestionsByFormApi(context.value, item.id),
    ])
    currentDetail.value = {
      ...(detail || item),
      _questions: questions,
    }
  } catch (err) {
    console.error('加载详情失败:', err)
    currentDetail.value = { ...item, _questions: [] }
  } finally {
    detailLoading.value = false
  }
}

// 删除草稿
async function handleDelete(item) {
  try {
    await ElMessageBox.confirm('确认删除该表单？删除后不可恢复。', '确认删除', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteDraftEvalFormApi(context.value, item.id)
    ElMessage.success('已删除')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') console.error('删除失败:', err)
  }
}

// 提交审核
function handleSubmitAudit(item) {
  auditFormItem.value = item
  auditDialogVisible.value = true
}

// 确认提交审核
async function handleAuditConfirm({ submit_reason }) {
  try {
    await submitFormForAuditApi(context.value, auditFormItem.value.id, {
      submit_reason,
      form_title: auditFormItem.value.title,
    })
    auditDialogVisible.value = false
    ElMessage.success('已提交审核申请')
    await loadData()
  } catch (err) {
    console.error('提交审核失败:', err)
  }
}

// 查看数据
function handleViewData(item) {
  dataDrawerItem.value = item
  dataDrawerVisible.value = true
}

// 撤回审核
async function handleWithdrawAudit(item) {
  try {
    await ElMessageBox.confirm(
      '撤回后表单将回到草稿状态，可继续编辑后重新提交审核。',
      '确认撤回审核申请？',
      {
        confirmButtonText: '确认撤回',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await withdrawAuditApi(context.value, item.id)
    ElMessage.success('已撤回审核申请')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') console.error('撤回失败:', err)
  }
}

// 查看驳回原因
function handleViewRejectReason(item) {
  // 打开详情抽屉并滚动到审核记录区域
  handleView(item)
}

// 有限修改（已发布表单）
function handleLimitedEdit(item) {
  drawerMode.value = 'edit'
  currentFormData.value = { ...item, _context: context.value, _limitedEdit: true }
  drawerVisible.value = true
}

// 关闭窗口
async function handleCloseWindow(item) {
  try {
    await ElMessageBox.confirm('确认关闭该表单的评价窗口？关闭后学生将无法继续提交评价。', '关闭窗口', {
      confirmButtonText: '确认关闭',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // 更新表单状态为 closed
    await updateEvalFormApi(context.value, item.id, { status: 'closed' })
    // 如果有窗口，也更新窗口状态
    if (item._window) {
      await updateEvalWindowApi(context.value, item._window.id, { status: 'closed' })
    }
    ElMessage.success('已关闭窗口')
    await loadData()
  } catch (err) {
    if (err !== 'cancel') console.error('关闭窗口失败:', err)
  }
}

// 筛选变化
function handleFilterUpdate(newFilters) {
  Object.assign(filters, newFilters)
  currentPage.value = 1
  loadData()
}

function handleReset() {
  Object.assign(filters, {
    keyword: '',
    type: 'all',
    status: 'all',
    targetType: 'all',
    sort: 'latest_update',
  })
  currentPage.value = 1
  loadData()
}

function handleStatusChange(status) {
  filters.status = status
  currentPage.value = 1
  loadData()
}

function handlePageChange(page) {
  currentPage.value = page
  loadData()
}

// 保存后刷新
function handleSaved() {
  loadData()
}

onMounted(() => {
  if (hasPermission) {
    loadData()
  }
})
</script>

<template>
  <div class="forms-page">
    <!-- 无权限 -->
    <div v-if="!hasPermission" class="no-permission">
      <EmptyPlaceholder text="当前账号暂无评价管理权限" description="请联系管理员分配相应权限" />
    </div>

    <!-- 主内容 -->
    <template v-else>
      <!-- 页面标题 -->
      <PageHeader title="评价管理" description="创建、编辑和发布评价表单，管理评价窗口与审核流程">
        <template #actions>
          <span class="role-badge">{{ roleNames }}</span>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button class="btn-primary-green" :icon="Plus" @click="handleCreate">新建表单</el-button>
        </template>
      </PageHeader>

      <!-- 状态概览 -->
      <StaffFormStatusCards
        :stats="stats"
        :active-status="filters.status"
        @status-change="handleStatusChange"
      />

      <!-- 筛选 + 列表 + 分页（合并到大盒子） -->
      <el-card shadow="never" class="section-card list-card">
        <!-- 筛选工具栏 -->
        <StaffFormFilterBar
          :filters="filters"
          @update:filters="handleFilterUpdate"
          @reset="handleReset"
        />

        <!-- 表单列表 -->
        <div v-loading="loading" class="form-list">
          <template v-if="formList.length > 0">
            <StaffEvalFormCard
              v-for="item in formList"
              :key="item.id"
              :item="item"
              @view="handleView"
              @edit="handleEdit"
              @delete="handleDelete"
              @submit-audit="handleSubmitAudit"
              @view-data="handleViewData"
              @withdraw-audit="handleWithdrawAudit"
              @view-reject-reason="handleViewRejectReason"
              @limited-edit="handleLimitedEdit"
              @close-window="handleCloseWindow"
            />
          </template>
          <EmptyPlaceholder v-else-if="!loading" text="暂无评价表单" description="点击「新建表单」开始创建" />
        </div>

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

      <!-- 新建/编辑抽屉 -->
      <StaffEvalFormDrawer
        v-model:visible="drawerVisible"
        :mode="drawerMode"
        :form-data="currentFormData"
        @saved="handleSaved"
      />

      <!-- 详情抽屉 -->
      <StaffEvalFormDetailDrawer
        v-model:visible="detailVisible"
        :detail="currentDetail"
        :loading="detailLoading"
        @edit="handleEdit"
        @submit-audit="handleSubmitAudit"
      />

      <!-- 提交审核弹窗 -->
      <SubmitAuditDialog
        v-model:visible="auditDialogVisible"
        :form-item="auditFormItem"
        @confirm="handleAuditConfirm"
      />

      <!-- 数据统计抽屉 -->
      <StaffEvalFormDataDrawer
        v-model:visible="dataDrawerVisible"
        :form-item="dataDrawerItem"
        :context="context"
      />
    </template>
  </div>
</template>

<style scoped>
.forms-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1480px;
  margin-inline: auto;
}

.no-permission {
  padding: var(--space-12) 0;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
  font-size: var(--font-xs);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
}

/* 大盒子 */
.section-card {
  border: 1px solid var(--color-border-lighter) !important;
  border-radius: var(--radius-card) !important;
  box-shadow: var(--shadow-card) !important;
  overflow: hidden;
}

.list-card :deep(.el-card__body) {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 筛选栏嵌入大盒子内时去掉自身背景/阴影 */
.list-card :deep(.filter-bar) {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-bottom: 1px solid var(--color-border-lighter);
  padding-bottom: var(--space-4);
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pagination-bar {
  display: flex;
  justify-content: center;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-lighter);
}

.btn-primary-green {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
}

.btn-primary-green:hover {
  background: var(--color-primary-600, var(--color-primary)) !important;
  border-color: var(--color-primary-600, var(--color-primary)) !important;
}
</style>
