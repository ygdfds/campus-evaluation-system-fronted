<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Refresh } from '@element-plus/icons-vue'
import { getStaffRoleCodes, getStaffRoleNames, getStaffRoleScope } from '@/utils/staffPermission'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import AppealSummaryCards from '@/components/staff/appeals/AppealSummaryCards.vue'
import AppealFilterBar from '@/components/staff/appeals/AppealFilterBar.vue'
import AppealList from '@/components/staff/appeals/AppealList.vue'
import AppealDetailDrawer from '@/components/staff/appeals/AppealDetailDrawer.vue'
import AppealActionDialog from '@/components/staff/appeals/AppealActionDialog.vue'
import {
  getStaffAppealContextApi,
  getStaffAppealListApi,
  getStaffAppealSummaryApi,
  getStaffAppealDetailApi,
} from '@/api/staffAppeals'

defineOptions({ name: 'StaffAppealsView' })

const route = useRoute()
const userStore = useUserStore()

// 权限
const roleCodes = getStaffRoleCodes(userStore.userInfo)
const roleNames = getStaffRoleNames(roleCodes)
const isSchoolAdmin = roleCodes.includes('school_admin')
const hasPermission = isSchoolAdmin || roleCodes.some(c =>
  ['teaching_admin', 'service_admin', 'course_owner', 'feedback_handler'].includes(c)
)

// 数据状态
const loading = ref(false)
const ctxData = ref(null)
const appealList = ref([])
const summary = ref({})
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

// 筛选
const filters = reactive({
  keyword: '',
  status: route.query.status || 'all',
  appealType: 'all',
  targetType: 'all',
  timeRange: 'all',
  startDate: '',
  endDate: '',
  sort: 'latest_submit',
})

// 详情抽屉
const drawerVisible = ref(false)
const drawerDetail = ref(null)

// 操作弹窗
const dialogVisible = ref(false)
const dialogAction = ref('')
const dialogItem = ref({})

// 用户上下文
const userContext = computed(() => ({
  tenantId: userStore.tenantId,
  userId: userStore.userInfo?.id,
  schoolId: userStore.userInfo?.school_id || null,
}))

// 权限范围
const scope = computed(() => {
  if (!ctxData.value) return null
  const s = getStaffRoleScope(userStore, ctxData.value.teachingOrgs, ctxData.value.serviceOrgs)
  return {
    ...s,
    schoolAdmin: isSchoolAdmin,
  }
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    if (!ctxData.value) {
      ctxData.value = await getStaffAppealContextApi(userStore.tenantId)
    }

    const listRes = getStaffAppealListApi(ctxData.value, {
      ...filters,
      page: currentPage.value,
      pageSize: pageSize.value,
    }, scope.value)

    const summaryRes = getStaffAppealSummaryApi(ctxData.value, scope.value, { ...filters })

    appealList.value = listRes.list
    total.value = listRes.total
    summary.value = summaryRes
  } catch (err) {
    console.error('加载申诉列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 查看详情
function handleView(item) {
  if (!ctxData.value) return
  const detail = getStaffAppealDetailApi(ctxData.value, item.id)
  drawerDetail.value = detail
  drawerVisible.value = true
}

// 操作按钮
function handleAction({ action, item }) {
  dialogItem.value = item
  // Map action keys to dialog action keys
  const actionMap = {
    accept: 'accept',
    reject: 'reject',
    supplement: 'supplement',
    trace: 'trace_auth',
    resolve: 'resolve',
    close: 'close',
  }
  dialogAction.value = actionMap[action] || action
  dialogVisible.value = true
}

// 操作成功回调
async function handleActionSuccess() {
  // 重新加载上下文（数据已变更）
  ctxData.value = null
  drawerVisible.value = false
  await loadData()
}

// 筛选变化
function handleFilterUpdate(newFilters) {
  Object.assign(filters, newFilters)
  currentPage.value = 1
  loadData()
}

function handleReset() {
  filters.keyword = ''
  filters.status = 'all'
  filters.appealType = 'all'
  filters.targetType = 'all'
  filters.timeRange = 'all'
  filters.startDate = ''
  filters.endDate = ''
  filters.sort = 'latest_submit'
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

onMounted(() => {
  if (hasPermission) {
    loadData()
  }
})
</script>

<template>
  <div class="appeals-page">
    <!-- 无权限 -->
    <div v-if="!hasPermission" class="no-permission">
      <EmptyPlaceholder text="当前账号暂无申诉处理权限" description="请联系管理员分配相应权限" />
    </div>

    <!-- 主内容 -->
    <template v-else>
      <!-- 页面标题 -->
      <PageHeader title="申诉处理" description="处理授权范围内的评价申诉，必要时发起匿名评价追溯授权">
        <template #actions>
          <span class="role-badge">{{ roleNames }}</span>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        </template>
      </PageHeader>

      <!-- 状态概览 -->
      <AppealSummaryCards
        :summary="summary"
        :active-status="filters.status"
        @status-change="handleStatusChange"
      />

      <!-- 筛选工具栏 -->
      <AppealFilterBar
        :filters="filters"
        @update:filters="handleFilterUpdate"
        @reset="handleReset"
      />

      <!-- 申诉列表 -->
      <div v-loading="loading" class="appeal-list-wrap">
        <template v-if="appealList.length > 0">
          <AppealList
            :list="appealList"
            @view="handleView"
            @action="handleAction"
          />
        </template>
        <EmptyPlaceholder
          v-else-if="!loading"
          text="暂无申诉记录"
          description="当前筛选范围内暂无需要处理的评价申诉。"
        />
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 详情抽屉 -->
      <AppealDetailDrawer
        v-model="drawerVisible"
        :detail="drawerDetail"
      />

      <!-- 操作弹窗 -->
      <AppealActionDialog
        v-model="dialogVisible"
        :action="dialogAction"
        :appeal-item="dialogItem"
        :user-context="userContext"
        @success="handleActionSuccess"
      />
    </template>
  </div>
</template>

<style scoped>
.appeals-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
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

.appeal-list-wrap {
  min-height: 200px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0;
}
</style>
