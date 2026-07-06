<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, View, ChatDotRound, CircleClose, Clock, User, Document } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  getSchoolHelpTicketsApi,
  getSchoolHelpTicketSummaryApi,
  replySchoolHelpTicketApi,
  closeSchoolHelpTicketApi,
} from '@/api/schoolHelp'

defineOptions({ name: 'SchoolHelpTicketListView' })

const userStore = useUserStore()

const loading = ref(false)
const tickets = ref([])
const summary = ref({ total: 0, pending: 0, replied: 0, closed: 0 })

const filters = ref({ keyword: '', status: 'all', priority: 'all', category: 'all' })
const page = ref(1)
const pageSize = ref(10)

const paginatedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return tickets.value.slice(start, start + pageSize.value)
})

// 详情抽屉
const drawerVisible = ref(false)
const currentTicket = ref(null)

// 回复弹窗
const replyVisible = ref(false)
const replyContent = ref('')
const replyTicketId = ref(null)

const statusTagType = (code) => {
  const map = { pending: 'warning', replied: 'success', processing: 'info', closed: 'default' }
  return map[code] || 'info'
}

const priorityTagType = (code) => {
  const map = { normal: 'info', urgent: 'warning', critical: 'danger' }
  return map[code] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const tid = userStore.tenantId
    const [list, sum] = await Promise.all([
      getSchoolHelpTicketsApi(tid, filters.value),
      getSchoolHelpTicketSummaryApi(tid),
    ])
    tickets.value = list
    summary.value = sum
  } catch (e) {
    console.error('加载工单列表失败', e)
    ElMessage.error('加载工单列表失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = { keyword: '', status: 'all', priority: 'all', category: 'all' }
  loadData()
}

function openDetail(ticket) {
  currentTicket.value = ticket
  drawerVisible.value = true
}

function openReply(ticket) {
  replyTicketId.value = ticket.id
  replyContent.value = ''
  replyVisible.value = true
}

async function submitReply() {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请填写回复内容')
    return
  }
  if (replyContent.value.trim().length < 10) {
    ElMessage.warning('回复内容不少于10个字')
    return
  }
  try {
    await replySchoolHelpTicketApi(
      userStore.tenantId, userStore.schoolId,
      replyTicketId.value, userStore.userInfo?.id,
      replyContent.value.trim()
    )
    ElMessage.success('回复成功')
    replyVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('回复失败')
  }
}

async function handleClose(ticket) {
  try {
    await ElMessageBox.confirm('确认关闭该工单？关闭后将无法继续回复。', '关闭工单', {
      confirmButtonText: '确认关闭',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await closeSchoolHelpTicketApi(userStore.tenantId, userStore.schoolId, ticket.id, userStore.userInfo?.id)
    ElMessage.success('工单已关闭')
    loadData()
  } catch (e) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') ElMessage.error('关闭失败')
  }
}

function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => loadData())
</script>

<template>
  <div class="page">
    <PageHeader title="帮助工单管理" description="查看和回复来自学生与教职工的帮助工单">
      <template #actions>
        <el-button :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
      </template>
    </PageHeader>

    <div class="summary-bar">
      <div class="s"><em>{{ summary.total }}</em>全部工单</div>
      <div class="s s-w"><em>{{ summary.pending }}</em>待处理</div>
      <div class="s s-ok"><em>{{ summary.replied }}</em>已回复</div>
      <div class="s"><em>{{ summary.closed }}</em>已关闭</div>
    </div>

    <div class="filters">
      <el-input v-model="filters.keyword" placeholder="搜索标题、描述、提交人…" :prefix-icon="Search" clearable @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="filters.status" @change="loadData">
        <el-option label="全部状态" value="all" />
        <el-option label="待处理" value="pending" />
        <el-option label="已回复" value="replied" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-select v-model="filters.priority" @change="loadData">
        <el-option label="全部优先级" value="all" />
        <el-option label="普通" value="normal" />
        <el-option label="较急" value="urgent" />
        <el-option label="紧急" value="critical" />
      </el-select>
      <el-select v-model="filters.category" @change="loadData">
        <el-option label="全部分类" value="all" />
        <el-option label="系统问题" value="system" />
        <el-option label="权限申请" value="permission" />
        <el-option label="反馈处理" value="feedback" />
        <el-option label="消息通知" value="notification" />
        <el-option label="评价相关" value="evaluation" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-button text type="primary" @click="resetFilters">重置</el-button>
    </div>

    <div class="list-box" v-loading="loading">
      <el-table :data="paginatedList" stripe style="width: 100%" :header-cell-style="{ background: 'var(--color-bg-light)', color: 'var(--color-text-secondary)', fontSize: '13px' }">
        <el-table-column prop="ticket_no" label="工单编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="submitter_name" label="提交人" width="90" />
        <el-table-column prop="submitter_role" label="角色" width="80">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.submitter_role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="priorityTagType(row.priority_code)" effect="plain">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status_code)" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" :icon="View" @click="openDetail(row)">查看</el-button>
            <el-button v-if="row.status_code === 'pending'" text type="primary" size="small" :icon="ChatDotRound" @click="openReply(row)">回复</el-button>
            <el-button v-if="row.status_code !== 'closed'" text type="warning" size="small" :icon="CircleClose" @click="handleClose(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar" v-if="tickets.length > 0">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="tickets.length" layout="prev, pager, next, total" />
      </div>

      <div v-if="!loading && tickets.length === 0" class="empty">
        <el-icon :size="48" color="var(--color-text-placeholder)"><Document /></el-icon>
        <p>暂无帮助工单</p>
        <span>学生和教职工提交的帮助工单将在这里展示。</span>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="工单详情" size="600px">
      <template v-if="currentTicket">
        <div class="ds">
          <h3 class="ds-title">基础信息</h3>
          <div class="dg">
            <div class="di"><span class="dl">工单编号</span><span class="dv">{{ currentTicket.ticket_no }}</span></div>
            <div class="di"><span class="dl">状态</span><span class="dv"><el-tag size="small" :type="statusTagType(currentTicket.status_code)">{{ currentTicket.status }}</el-tag></span></div>
            <div class="di"><span class="dl">提交人</span><span class="dv">{{ currentTicket.submitter_name }}（{{ currentTicket.submitter_role }}）</span></div>
            <div class="di"><span class="dl">优先级</span><span class="dv"><el-tag size="small" :type="priorityTagType(currentTicket.priority_code)">{{ currentTicket.priority }}</el-tag></span></div>
            <div class="di"><span class="dl">分类</span><span class="dv">{{ currentTicket.category }}</span></div>
            <div class="di"><span class="dl">提交时间</span><span class="dv">{{ formatTime(currentTicket.created_at) }}</span></div>
          </div>
        </div>
        <div class="ds">
          <h3 class="ds-title">问题描述</h3>
          <div class="desc-block">{{ currentTicket.content }}</div>
        </div>
        <div v-if="currentTicket.reply_content" class="ds">
          <h3 class="ds-title">回复内容</h3>
          <div class="desc-block reply">{{ currentTicket.reply_content }}</div>
          <div class="reply-meta">回复时间：{{ formatTime(currentTicket.replied_at) }}</div>
        </div>
      </template>
      <template #footer>
        <el-button v-if="currentTicket?.status_code === 'pending'" type="primary" @click="openReply(currentTicket)">回复工单</el-button>
        <el-button @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复工单" width="560px" :close-on-click-modal="false">
      <el-input v-model="replyContent" type="textarea" :rows="6" maxlength="500" show-word-limit placeholder="请填写回复内容（不少于10个字）" />
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确认回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.summary-bar {
  display: flex; align-items: center; gap: var(--space-6);
  background: var(--color-bg-card); border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card); padding: var(--space-3) var(--space-5);
}
.summary-bar .s { display: inline-flex; align-items: baseline; gap: 4px; font-size: var(--font-sm); color: var(--color-text-muted); }
.summary-bar .s em { font-style: normal; font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-heading); }
.s-w em { color: var(--color-warning) !important; }
.s-ok em { color: var(--color-success) !important; }

.filters {
  display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
  background: var(--color-bg-card); border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card); padding: var(--space-3) var(--space-4);
}
.filters .el-input { width: 260px; }
.filters .el-select { width: 130px; }

.list-box {
  background: var(--color-bg-card); border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card); padding: var(--space-4); min-height: 300px;
}
.pagination-bar { display: flex; justify-content: flex-end; padding: var(--space-4) 0 0; }

.empty { display: flex; flex-direction: column; align-items: center; padding: var(--space-12); gap: var(--space-2); }
.empty p { font-size: var(--font-base); color: var(--color-text-secondary); margin: 0; }
.empty span { font-size: var(--font-sm); color: var(--color-text-placeholder); }

.ds { margin-bottom: var(--space-5); }
.ds-title { font-size: var(--font-base); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-border-lighter); }
.dg { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.di { display: flex; flex-direction: column; gap: var(--space-1); }
.dl { font-size: var(--font-xs); color: var(--color-text-placeholder); }
.dv { font-size: var(--font-sm); color: var(--color-text-body); }
.desc-block { padding: var(--space-3); background: var(--color-bg-light); border-radius: var(--radius-sm); font-size: var(--font-sm); line-height: 1.6; }
.desc-block.reply { border-left: 3px solid var(--color-primary); }
.reply-meta { margin-top: var(--space-2); font-size: var(--font-xs); color: var(--color-text-placeholder); }
</style>
