<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Refresh } from '@element-plus/icons-vue'
import { getStaffRoleCodes, getStaffRoleNames } from '@/utils/staffPermission'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import StaffFeedbackStatusCards from '@/components/staff/feedback/StaffFeedbackStatusCards.vue'
import StaffFeedbackFilterBar from '@/components/staff/feedback/StaffFeedbackFilterBar.vue'
import StaffFeedbackCard from '@/components/staff/feedback/StaffFeedbackCard.vue'
import StaffFeedbackDetailDrawer from '@/components/staff/feedback/StaffFeedbackDetailDrawer.vue'
import FeedbackActionDialog from '@/components/staff/feedback/FeedbackActionDialog.vue'
import {
  getStaffFeedbackListApi,
  getStaffFeedbackStatsApi,
  getFeedbackDetailApi,
  getFeedbackProcessRecordsApi,
  acceptFeedbackApi,
  updateFeedbackProgressApi,
  transferFeedbackApi,
  resolveFeedbackApi,
  rejectFeedbackApi,
  getFeedbackRelatedObjectsApi,
  createFeedbackNotificationApi,
} from '@/api/staffFeedback'

defineOptions({ name: 'StaffFeedbackView' })

const route = useRoute()
const userStore = useUserStore()

// 权限检查
const roleCodes = getStaffRoleCodes(userStore.userInfo)
const roleNames = getStaffRoleNames(roleCodes)
const hasPermission = roleCodes.some(c => ['service_admin', 'feedback_handler', 'teaching_admin', 'form_publisher', 'service_window_manager'].includes(c))

// 数据状态
const loading = ref(false)
const feedbackList = ref([])
const stats = ref({ pending: 0, processing: 0, resolved: 0, rejected: 0, total: 0 })
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(6)

// 筛选
const filters = reactive({
  keyword: '',
  complaintType: 'all',
  status: route.query.status || 'all',
  targetType: 'all',
  sort: 'latest_submit',
})

// 抽屉
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const currentDetail = ref({})
const processRecords = ref([])

// 操作弹窗
const actionDialogVisible = ref(false)
const currentAction = ref('')
const actionItem = ref({})

// 关联对象
const orgOptions = ref([])
const relatedObjects = ref({ serviceItems: [], courses: [], serviceOrgs: [], teachingOrgs: [] })

const otherTargetMap = {
  service_center: '学校服务中心',
  it_center: '信息化服务中心',
  other: '其他问题',
}

// 计算属性
const context = computed(() => ({
  tenantId: userStore.tenantId,
  userId: userStore.userInfo?.id,
}))

// 解析反馈对象名称
function resolveTargetName(item) {
  const { serviceItems, courses, serviceOrgs, teachingOrgs } = relatedObjects.value
  const sItemMap = Object.fromEntries(serviceItems.map(s => [s.id, s]))
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
  const sOrgMap = Object.fromEntries(serviceOrgs.map(o => [o.id, o]))
  const tOrgMap = Object.fromEntries(teachingOrgs.map(o => [o.id, o]))

  if (item.target_type === 'logistics') {
    return sItemMap[item.service_item_id]?.name || sOrgMap[item.service_org_id]?.name || '未指定对象'
  } else if (item.target_type === 'teaching') {
    return courseMap[item.course_id]?.course_name || tOrgMap[item.teaching_org_id]?.name || '未指定对象'
  } else if (item.target_type === 'other') {
    return otherTargetMap[item.target_id] || '未指定对象'
  }
  return '未指定对象'
}

// 解析所属组织
function resolveOrgName(item) {
  const { serviceOrgs, teachingOrgs } = relatedObjects.value
  const sOrgMap = Object.fromEntries(serviceOrgs.map(o => [o.id, o]))
  const tOrgMap = Object.fromEntries(teachingOrgs.map(o => [o.id, o]))

  if (item.target_type === 'logistics') {
    return sOrgMap[item.service_org_id]?.name || ''
  } else if (item.target_type === 'teaching') {
    return tOrgMap[item.teaching_org_id]?.name || ''
  }
  return ''
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const [listRes, statsRes] = await Promise.all([
      getStaffFeedbackListApi(context.value, {
        ...filters,
        page: currentPage.value,
        pageSize: pageSize.value,
      }),
      getStaffFeedbackStatsApi(context.value),
    ])
    // 解析对象名称
    feedbackList.value = listRes.list.map(item => ({
      ...item,
      _target_name: resolveTargetName(item),
      _org_name: resolveOrgName(item),
    }))
    total.value = listRes.total
    stats.value = statsRes
  } catch (err) {
    console.error('加载反馈列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 加载关联对象
async function loadRelatedObjects() {
  try {
    const data = await getFeedbackRelatedObjectsApi(userStore.tenantId)
    relatedObjects.value = data
    // 合并服务组织和教学组织作为转交选项
    orgOptions.value = [
      ...data.serviceOrgs.map(o => ({ id: o.id, name: o.name })),
      ...data.teachingOrgs.map(o => ({ id: o.id, name: o.name })),
    ]
  } catch { /* ignore */ }
}

// 查看详情
async function handleView(item) {
  drawerVisible.value = true
  drawerLoading.value = true
  try {
    const [detail, records] = await Promise.all([
      getFeedbackDetailApi(context.value, item.id),
      getFeedbackProcessRecordsApi(context.value, item.id),
    ])
    const resolved = detail || item
    currentDetail.value = {
      ...resolved,
      _target_name: resolveTargetName(resolved),
      _org_name: resolveOrgName(resolved),
    }
    processRecords.value = records
  } catch (err) {
    console.error('加载详情失败:', err)
    currentDetail.value = { ...item, _target_name: resolveTargetName(item), _org_name: resolveOrgName(item) }
  } finally {
    drawerLoading.value = false
  }
}

// 处理操作
function handleProcess(item) {
  actionItem.value = item
  if (item.status === 'pending') {
    currentAction.value = 'accept'
  } else {
    currentAction.value = 'progress'
  }
  actionDialogVisible.value = true
}

// 抽屉内操作
function handleDrawerAction(action) {
  actionItem.value = currentDetail.value
  currentAction.value = action
  actionDialogVisible.value = true
}

// 确认操作
async function handleActionConfirm({ action, content, targetOrgId, reason }) {
  try {
    switch (action) {
      case 'accept':
        await acceptFeedbackApi(context.value, actionItem.value.id)
        break
      case 'progress':
        await updateFeedbackProgressApi(context.value, actionItem.value.id, content)
        break
      case 'transfer':
        await transferFeedbackApi(context.value, actionItem.value.id, targetOrgId, reason)
        break
      case 'resolve':
        await resolveFeedbackApi(context.value, actionItem.value.id, content)
        break
      case 'reject':
        await rejectFeedbackApi(context.value, actionItem.value.id, content)
        break
    }

    // 发送通知给学生
    try {
      const notificationMap = {
        accept: {
          title: '你的反馈已被受理',
          content: `你提交的《${actionItem.value.title}》已被受理，相关部门正在处理中。`,
        },
        progress: {
          title: '你的反馈有新的处理进度',
          content: `你提交的《${actionItem.value.title}》有新的处理进度，请查看详情。`,
        },
        transfer: {
          title: '你的反馈已转交处理',
          content: `你提交的《${actionItem.value.title}》已转交至相关部门继续处理。`,
        },
        resolve: {
          title: '你的反馈已办结',
          content: `你提交的《${actionItem.value.title}》已处理完成，请查看处理结果。`,
        },
        reject: {
          title: '你的反馈未予受理',
          content: `你提交的《${actionItem.value.title}》未予受理，请查看驳回原因。`,
        },
      }
      const notify = notificationMap[action] || { title: '反馈处理通知', content: '' }
      await createFeedbackNotificationApi({
        tenant_id: userStore.tenantId,
        school_id: userStore.userInfo?.school_id || null,
        receiver_user_id: actionItem.value.submitter_id,
        type: 'complaint',
        title: notify.title,
        content: notify.content,
        read_status: 'unread',
        link: '/student/complaint',
        biz_type: 'complaint',
        biz_id: actionItem.value.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted: false,
      })
    } catch { /* notification creation is optional */ }

    actionDialogVisible.value = false
    drawerVisible.value = false

    // 刷新数据
    await loadData()
  } catch (err) {
    console.error('操作失败:', err)
  }
}

// 筛选变化
function handleFilterUpdate(newFilters) {
  Object.assign(filters, newFilters)
  currentPage.value = 1
  loadData()
}

function handleReset() {
  filters.keyword = ''
  filters.complaintType = 'all'
  filters.status = 'all'
  filters.targetType = 'all'
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

onMounted(async () => {
  if (hasPermission) {
    await loadRelatedObjects()
    loadData()
  }
})
</script>

<template>
  <div class="feedback-page">
    <!-- 无权限 -->
    <div v-if="!hasPermission" class="no-permission">
      <EmptyPlaceholder text="当前账号暂无反馈处理权限" description="请联系管理员分配相应权限" />
    </div>

    <!-- 主内容 -->
    <template v-else>
      <!-- 页面标题 -->
      <PageHeader title="反馈处理" description="处理学生提交的投诉、建议、咨询与表扬，跟进授权范围内的服务质量问题">
        <template #actions>
          <span class="role-badge">{{ roleNames }}</span>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        </template>
      </PageHeader>

      <!-- 状态概览 -->
      <StaffFeedbackStatusCards
        :stats="stats"
        :active-status="filters.status"
        @status-change="handleStatusChange"
      />

      <!-- 筛选 + 列表 + 分页（合并到大盒子） -->
      <el-card shadow="never" class="section-card list-card">
        <!-- 筛选工具栏 -->
        <StaffFeedbackFilterBar
          :filters="filters"
          @update:filters="handleFilterUpdate"
          @reset="handleReset"
        />

        <!-- 反馈列表 -->
        <div v-loading="loading" class="feedback-list">
          <template v-if="feedbackList.length > 0">
            <StaffFeedbackCard
              v-for="item in feedbackList"
              :key="item.id"
              :item="item"
              @view="handleView"
              @process="handleProcess"
            />
          </template>
          <EmptyPlaceholder v-else-if="!loading" text="暂无待处理反馈" description="筛选条件下没有匹配的反馈记录" />
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

      <!-- 详情抽屉 -->
      <StaffFeedbackDetailDrawer
        v-model:visible="drawerVisible"
        :detail="currentDetail"
        :process-records="processRecords"
        :loading="drawerLoading"
        @action="handleDrawerAction"
      />

      <!-- 操作弹窗 -->
      <FeedbackActionDialog
        v-model:visible="actionDialogVisible"
        :action="currentAction"
        :item="actionItem"
        :org-options="orgOptions"
        @confirm="handleActionConfirm"
      />
    </template>
  </div>
</template>

<style scoped>
.feedback-page {
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

/* 筛选栏嵌入时去掉自身背景/阴影 */
.list-card :deep(.filter-bar) {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-bottom: 1px solid var(--color-border-lighter);
  padding-bottom: var(--space-4);
}

.feedback-list {
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
</style>
