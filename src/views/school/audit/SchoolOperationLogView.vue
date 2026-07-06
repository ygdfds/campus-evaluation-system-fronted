<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Refresh, Search, View, Document } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { getSchoolOperationLogsApi, getSchoolOperationLogSummaryApi } from '@/api/schoolOperationLogs'

defineOptions({ name: 'SchoolOperationLogView' })

const userStore = useUserStore()

const loading = ref(false)
const logs = ref([])
const summary = ref({ total: 0, today: 0, month: 0 })

const filters = ref({ keyword: '', module: 'all', action: 'all', dateRange: null })
const page = ref(1)
const pageSize = ref(15)

const drawerVisible = ref(false)
const currentLog = ref(null)

const moduleOptions = [
  { value: 'all', label: '全部模块' },
  { value: 'audit', label: '审核' },
  { value: 'announcement', label: '公告' },
  { value: 'user', label: '用户' },
  { value: 'org', label: '组织' },
  { value: 'help', label: '帮助' },
  { value: 'form', label: '表单' },
  { value: 'complaint', label: '投诉' },
  { value: 'system', label: '系统' },
]

const actionOptions = [
  { value: 'all', label: '全部操作' },
  { value: 'create', label: '新增' },
  { value: 'edit', label: '编辑' },
  { value: 'delete', label: '删除' },
  { value: 'approve', label: '审核' },
  { value: 'publish', label: '发布' },
  { value: 'reply', label: '回复' },
  { value: 'close', label: '关闭' },
  { value: 'reject', label: '驳回' },
  { value: 'import', label: '导入' },
  { value: 'approve_trace', label: '授权通过' },
  { value: 'reject_trace', label: '授权拒绝' },
]

async function loadData() {
  loading.value = true
  try {
    const tid = userStore.tenantId
    const [list, sum] = await Promise.all([
      getSchoolOperationLogsApi(tid, filters.value),
      getSchoolOperationLogSummaryApi(tid),
    ])
    logs.value = list
    summary.value = sum
  } catch (e) {
    console.error('加载操作日志失败', e)
    ElMessage.error('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = { keyword: '', module: 'all', action: 'all', dateRange: null }
  loadData()
}

function openDetail(log) {
  currentLog.value = log
  drawerVisible.value = true
}

function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const paginatedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return logs.value.slice(start, start + pageSize.value)
})

onMounted(() => loadData())
</script>

<template>
  <div class="page">
    <PageHeader title="操作日志" description="查看本校所有管理员的操作记录，形成追溯闭环">
      <template #actions>
        <el-button :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
      </template>
    </PageHeader>

    <div class="summary-bar">
      <div class="s"><em>{{ summary.total }}</em>总记录</div>
      <div class="s s-w"><em>{{ summary.today }}</em>今日操作</div>
      <div class="s s-ok"><em>{{ summary.month }}</em>本月操作</div>
    </div>

    <div class="filters">
      <el-input v-model="filters.keyword" placeholder="搜索操作者、模块、对象名称…" :prefix-icon="Search" clearable @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="filters.module" @change="loadData">
        <el-option v-for="o in moduleOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-select v-model="filters.action" @change="loadData">
        <el-option v-for="o in actionOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-date-picker v-model="filters.dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="loadData" style="width: 260px" />
      <el-button text type="primary" @click="resetFilters">重置</el-button>
    </div>

    <div class="list-box" v-loading="loading">
      <el-table :data="paginatedList" stripe style="width: 100%" :header-cell-style="{ background: 'var(--color-bg-light)', color: 'var(--color-text-secondary)', fontSize: '13px' }">
        <el-table-column label="操作时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作者" width="90" />
        <el-table-column prop="module" label="模块" width="80" />
        <el-table-column prop="action" label="操作类型" width="80" />
        <el-table-column prop="target_name" label="业务对象" min-width="200" show-overflow-tooltip />
        <el-table-column prop="result" label="结果" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.result_code === 'success' ? 'success' : 'danger'">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP/设备" width="80" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" :icon="View" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar" v-if="logs.length > 0">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="logs.length" layout="prev, pager, next, total" />
      </div>

      <div v-if="!loading && logs.length === 0" class="empty">
        <el-icon :size="48" color="var(--color-text-placeholder)"><Document /></el-icon>
        <p>暂无操作日志</p>
        <span>管理员的各项操作将在这里记录，形成完整的追溯闭环。</span>
      </div>
    </div>

    <el-drawer v-model="drawerVisible" title="操作日志详情" size="500px">
      <template v-if="currentLog">
        <div class="ds">
          <h3 class="ds-title">操作信息</h3>
          <div class="dg">
            <div class="di"><span class="dl">操作时间</span><span class="dv">{{ formatTime(currentLog.created_at) }}</span></div>
            <div class="di"><span class="dl">操作者</span><span class="dv">{{ currentLog.operator_name }}</span></div>
            <div class="di"><span class="dl">操作模块</span><span class="dv">{{ currentLog.module }}</span></div>
            <div class="di"><span class="dl">操作类型</span><span class="dv">{{ currentLog.action }}</span></div>
            <div class="di"><span class="dl">业务对象</span><span class="dv">{{ currentLog.target_name }}</span></div>
            <div class="di"><span class="dl">操作结果</span><span class="dv"><el-tag size="small" :type="currentLog.result_code === 'success' ? 'success' : 'danger'">{{ currentLog.result }}</el-tag></span></div>
            <div class="di"><span class="dl">IP 地址</span><span class="dv">{{ currentLog.ip }}</span></div>
            <div class="di"><span class="dl">设备信息</span><span class="dv">{{ currentLog.device }}</span></div>
          </div>
          <div class="db">
            <span class="dl">操作备注</span>
            <div class="desc-block">{{ currentLog.content || '无' }}</div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>
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

.filters { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-3) var(--space-4); }
.filters .el-input { width: 260px; }
.filters .el-select { width: 130px; }

.list-box { background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-4); min-height: 300px; }
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
.db { margin-top: var(--space-4); }
.desc-block { margin-top: var(--space-1); padding: var(--space-3); background: var(--color-bg-light); border-radius: var(--radius-sm); font-size: var(--font-sm); line-height: 1.6; }
</style>
