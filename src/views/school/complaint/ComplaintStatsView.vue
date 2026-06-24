<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  DataAnalysis, Warning, CircleCheck, Clock,
  ChatDotRound, Document,
} from '@element-plus/icons-vue'
import {
  getComplaintStatsApi, getComplaintListApi,
  getComplaintTypeLabel, getComplaintStatusLabel, getPriorityLabel,
} from '@/api/schoolComplaint'

const VChart = defineAsyncComponent(async () => {
  const [{ use }, { BarChart, PieChart, LineChart }, {
    TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  }, { CanvasRenderer }, vueEcharts] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
    import('vue-echarts'),
  ])
  use([BarChart, PieChart, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])
  return vueEcharts
})

defineOptions({ name: 'ComplaintStatsView' })

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const activeTab = ref('stats')

// 统计数据
const stats = ref({
  total: 0,
  statusCount: { pending: 0, processing: 0, resolved: 0, cancelled: 0 },
  typeCount: {},
  priorityCount: { high: 0, normal: 0, low: 0 },
  monthTrend: [],
  avgHandleDays: 0,
  processRecordCount: 0,
})

// 列表数据
const complaintList = ref([])
const listTotal = ref(0)
const listPage = ref(1)
const listPageSize = ref(10)
const filterStatus = ref('')
const filterType = ref('')

// 指标卡
const statCards = computed(() => [
  { title: '投诉建议总数', value: stats.value.total, icon: DataAnalysis, color: 'var(--color-chart-blue)' },
  { title: '待处理', value: stats.value.statusCount.pending, icon: Clock, color: 'var(--color-warning)' },
  { title: '处理中', value: stats.value.statusCount.processing, icon: Warning, color: 'var(--color-chart-info)' },
  { title: '已解决', value: stats.value.statusCount.resolved, icon: CircleCheck, color: 'var(--color-success)' },
])

// 类型分布饼图
const typePieOption = computed(() => {
  const entries = Object.entries(stats.value.typeCount).filter(([, v]) => v > 0)
  if (!entries.length) return {}
  const colors = ['var(--color-danger)', 'var(--color-success)', 'var(--color-chart-info)', 'var(--color-warning)']
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4 },
      label: { show: true, formatter: '{b}\n{c}条', fontSize: 12 },
      data: entries.map(([type, count], i) => ({
        value: count,
        name: getComplaintTypeLabel(type),
        itemStyle: { color: colors[i % colors.length] },
      })),
    }],
  }
})

// 状态分布柱状图
const statusBarOption = computed(() => {
  const s = stats.value.statusCount
  const labels = ['待处理', '处理中', '已解决', '已撤销']
  const values = [s.pending, s.processing, s.resolved, s.cancelled]
  const colors = ['var(--color-warning)', 'var(--color-chart-blue)', 'var(--color-success)', 'var(--color-chart-info)']
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', name: '数量' },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
      barWidth: '40%',
    }],
  }
})

// 月度趋势折线图
const trendLineOption = computed(() => {
  const data = stats.value.monthTrend
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.month), boundaryGap: false },
    yAxis: { type: 'value', name: '提交数' },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map(d => d.count),
      itemStyle: { color: 'var(--color-primary)' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(45,106,46,0.25)' },
            { offset: 1, color: 'rgba(45,106,46,0.02)' },
          ],
        },
      },
    }],
  }
})

// 列表表格

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

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handlePageChange(page) {
  listPage.value = page
  loadList()
}

function handleFilterChange() {
  listPage.value = 1
  loadList()
}

function handleViewDetail(row) {
  router.push({ name: 'SchoolComplaintDetail', query: { id: row.id } })
}

async function loadStats() {
  try {
    const tenantId = userStore.tenantId
    if (!tenantId) return
    stats.value = await getComplaintStatsApi(tenantId)
  } catch (err) {
    console.error('加载投诉统计失败:', err)
  }
}

async function loadList() {
  try {
    const tenantId = userStore.tenantId
    if (!tenantId) return
    const params = { page: listPage.value, pageSize: listPageSize.value }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterType.value) params.complaint_type = filterType.value
    const result = await getComplaintListApi(tenantId, params)
    complaintList.value = result.list
    listTotal.value = result.total
  } catch (err) {
    console.error('加载投诉列表失败:', err)
  }
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([loadStats(), loadList()])
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div v-loading="loading" class="page-container">
    <div class="page-header">
      <h2>投诉建议管理</h2>
      <p class="page-desc">本校投诉建议数据统计与处理跟踪</p>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="数据概览" name="stats" />
      <el-tab-pane label="投诉列表" name="list" />
    </el-tabs>

    <!-- 统计概览 -->
    <template v-if="activeTab === 'stats'">
      <!-- 核心指标卡 -->
      <section class="metrics-grid">
        <div v-for="item in statCards" :key="item.title" class="metric-card">
          <div class="metric-top">
            <el-icon :size="18" class="metric-icon" :style="{ color: item.color }"><component :is="item.icon" /></el-icon>
            <span class="metric-value" :style="{ color: item.color }">{{ item.value }}</span>
          </div>
          <span class="metric-title">{{ item.title }}</span>
        </div>
      </section>

      <!-- 图表区 -->
      <div class="chart-grid">
        <div class="chart-card">
          <h4 class="chart-title">类型分布</h4>
          <v-chart v-if="typePieOption.series" :option="typePieOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无数据" :image-size="80" />
        </div>
        <div class="chart-card">
          <h4 class="chart-title">状态分布</h4>
          <v-chart v-if="statusBarOption.series" :option="statusBarOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无数据" :image-size="80" />
        </div>
      </div>

      <div class="chart-grid chart-grid-single">
        <div class="chart-card">
          <h4 class="chart-title">月度提交趋势</h4>
          <v-chart v-if="trendLineOption.series" :option="trendLineOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无数据" :image-size="80" />
        </div>
      </div>

      <!-- 处理效率 -->
      <div class="efficiency-card">
        <div class="efficiency-item">
          <span class="efficiency-label">平均处理时长</span>
          <span class="efficiency-value">{{ stats.avgHandleDays || '-' }} 天</span>
        </div>
        <div class="efficiency-item">
          <span class="efficiency-label">处理记录总数</span>
          <span class="efficiency-value">{{ stats.processRecordCount }} 条</span>
        </div>
        <div class="efficiency-item">
          <span class="efficiency-label">解决率</span>
          <span class="efficiency-value">
            {{ stats.total > 0 ? Math.round((stats.statusCount.resolved / stats.total) * 100) : 0 }}%
          </span>
        </div>
      </div>
    </template>

    <!-- 投诉列表 -->
    <template v-if="activeTab === 'list'">
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="按状态筛选" clearable @change="handleFilterChange" class="filter-select">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已解决" value="resolved" />
          <el-option label="已撤销" value="cancelled" />
        </el-select>
        <el-select v-model="filterType" placeholder="按类型筛选" clearable @change="handleFilterChange" class="filter-select">
          <el-option label="投诉" value="complaint" />
          <el-option label="建议" value="suggestion" />
          <el-option label="咨询" value="inquiry" />
          <el-option label="表扬" value="praise" />
        </el-select>
      </div>

      <el-table :data="complaintList" stripe class="complaint-table">
        <el-table-column prop="id" label="编号" width="70" align="center" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="complaint_type" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.complaint_type)" size="small" effect="plain">
              {{ getComplaintTypeLabel(row.complaint_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small" effect="plain">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small" effect="dark">
              {{ getComplaintStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="匿名" width="70" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.anonymous_to_handler" :size="16" color="var(--color-text-placeholder)"><ChatDotRound /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              <el-icon><Document /></el-icon>
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="listPage"
          v-model:page-size="listPageSize"
          :total="listTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-container {
  padding: var(--space-6) var(--space-4);
  max-width: var(--page-max-width);
  margin-inline: auto;
}

.page-header {
  margin-bottom: var(--space-5);
}

.page-header h2 {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.page-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.main-tabs {
  margin-bottom: var(--space-5);
}

/* 指标卡 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.metric-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-icon { opacity: 0.8; }

.metric-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.metric-title {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 图表 */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.chart-grid-single {
  grid-template-columns: 1fr;
}

.chart-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  padding: var(--space-4);
}

.chart-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0 0 var(--space-3);
}

.chart-container {
  width: 100%;
  height: var(--chart-height);
  min-height: 200px;
}

/* 处理效率 */
.efficiency-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.efficiency-item {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.efficiency-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.efficiency-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.filter-select {
  width: 140px;
}

/* 表格 */
.complaint-table {
  border-radius: var(--radius-card);
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

/* 响应式 */
@media (max-width: 1366px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid {
    grid-template-columns: 1fr;
  }
  .efficiency-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: var(--space-4) var(--space-3);
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    flex-direction: column;
  }
  .filter-select {
    width: 100%;
  }
  .chart-container {
    height: 240px;
  }
}
</style>
