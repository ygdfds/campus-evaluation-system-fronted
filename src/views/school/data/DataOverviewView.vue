<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  DataAnalysis, OfficeBuilding, Files, TrendCharts,
} from '@element-plus/icons-vue'
import { getDataOverviewAllApi } from '@/api/schoolDataOverview'

// 动态导入 ECharts 相关模块，避免主包体积过大
const VChart = defineAsyncComponent(async () => {
  const [{ use }, { BarChart, LineChart, PieChart }, {
    TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  }, { CanvasRenderer }, vueEcharts] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
    import('vue-echarts'),
  ])
  use([BarChart, LineChart, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])
  return vueEcharts
})

defineOptions({ name: 'SchoolDataOverview' })

const userStore = useUserStore()

const loading = ref(true)
const metrics = ref({
  totalSubmissions: 0,
  avgScore: 0,
  activeForms: 0,
  teachingOrgCount: 0,
  serviceOrgCount: 0,
  monthSubmissions: 0,
})
const departmentStats = ref({ teachingStats: [], serviceStats: [] })
const scoreDistribution = ref([])
const submissionTrend = ref([])
const staffRanking = ref([])
const formTypeDistribution = ref([])

// 核心指标卡
const metricCards = computed(() => [
  { key: 'totalSubmissions', title: '评价提交总数', value: metrics.value.totalSubmissions, icon: DataAnalysis, color: '#409eff' },
  { key: 'avgScore', title: '平均评分', value: metrics.value.avgScore, icon: TrendCharts, color: '#67c23a' },
  { key: 'activeForms', title: '已发布表单', value: metrics.value.activeForms, icon: Files, color: '#e6a23c' },
  { key: 'teachingOrgCount', title: '教学院系', value: metrics.value.teachingOrgCount, icon: OfficeBuilding, color: '#909399' },
  { key: 'serviceOrgCount', title: '服务部门', value: metrics.value.serviceOrgCount, icon: OfficeBuilding, color: '#909399' },
  { key: 'monthSubmissions', title: '本月提交', value: metrics.value.monthSubmissions, icon: TrendCharts, color: '#f56c6c' },
])

// 教学评价院系分布 - 柱状图
const teachingChartOption = computed(() => {
  const data = departmentStats.value.teachingStats
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { interval: 0, rotate: data.length > 4 ? 30 : 0 },
    },
    yAxis: [
      { type: 'value', name: '评价数', position: 'left' },
      { type: 'value', name: '平均分', min: 0, max: 5, position: 'right' },
    ],
    series: [
      {
        name: '评价数',
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: { color: '#409eff' },
      },
      {
        name: '平均分',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.avgScore),
        itemStyle: { color: '#e6a23c' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }
})

// 服务评价部门分布 - 柱状图
const serviceChartOption = computed(() => {
  const data = departmentStats.value.serviceStats
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { interval: 0, rotate: data.length > 4 ? 30 : 0 },
    },
    yAxis: [
      { type: 'value', name: '评价数', position: 'left' },
      { type: 'value', name: '平均分', min: 0, max: 5, position: 'right' },
    ],
    series: [
      {
        name: '评价数',
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: { color: '#67c23a' },
      },
      {
        name: '平均分',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.avgScore),
        itemStyle: { color: '#f56c6c' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }
})

// 评分分布 - 饼图
const scorePieOption = computed(() => {
  const data = scoreDistribution.value
  if (!data.length) return {}
  const colors = ['#f56c6c', '#e6a23c', '#909399', '#409eff', '#67c23a']
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}条' },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: data.map((d, i) => ({ value: d.count, name: d.label, itemStyle: { color: colors[i] } })),
      },
    ],
  }
})

// 评价趋势 - 折线图
const trendChartOption = computed(() => {
  const data = submissionTrend.value
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.month),
    },
    yAxis: [
      { type: 'value', name: '提交数', position: 'left' },
      { type: 'value', name: '平均分', min: 0, max: 5, position: 'right' },
    ],
    series: [
      {
        name: '提交数',
        type: 'line',
        smooth: true,
        data: data.map(d => d.count),
        itemStyle: { color: '#409eff' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(64,158,255,0.3)' }, { offset: 1, color: 'rgba(64,158,255,0.05)' }] } },
      },
      {
        name: '平均分',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.map(d => d.avgScore),
        itemStyle: { color: '#e6a23c' },
        lineStyle: { type: 'dashed' },
      },
    ],
  }
})

// 评价类型分布 - 饼图
const typePieOption = computed(() => {
  const data = formTypeDistribution.value.filter(d => d.count > 0)
  if (!data.length) return {}
  const colors = ['#409eff', '#67c23a', '#e6a23c']
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: '65%',
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}条' },
        data: data.map((d, i) => ({ value: d.count, name: d.label, itemStyle: { color: colors[i] } })),
      },
    ],
  }
})

// 评价类型统计摘要
const typeSummary = computed(() => {
  const data = formTypeDistribution.value
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return data.map(d => ({
    ...d,
    percent: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }))
})

async function loadData() {
  loading.value = true
  try {
    const tenantId = userStore.tenantId
    if (!tenantId) return
    const data = await getDataOverviewAllApi(tenantId)
    metrics.value = data.metrics
    departmentStats.value = data.departmentStats
    scoreDistribution.value = data.scoreDistribution
    submissionTrend.value = data.submissionTrend
    staffRanking.value = data.staffRanking
    formTypeDistribution.value = data.formTypeDistribution
  } catch (err) {
    console.error('数据概览加载失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const typeColorMap = { teaching: '#409eff', service: '#67c23a', instant: '#e6a23c' }
function getTypeColor(type) {
  return typeColorMap[type] || '#909399'
}
</script>

<template>
  <div v-loading="loading" class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2>数据概览</h2>
        <p class="page-desc">本校评价数据、服务质量与运营指标的综合分析</p>
      </div>
    </div>

    <!-- 核心指标卡 -->
    <section class="metrics-grid">
      <div v-for="item in metricCards" :key="item.key" class="metric-card">
        <div class="metric-top">
          <el-icon :size="18" class="metric-icon" :style="{ color: item.color }"><component :is="item.icon" /></el-icon>
          <span class="metric-value" :style="{ color: item.color }">{{ item.value }}</span>
        </div>
        <span class="metric-title">{{ item.title }}</span>
      </div>
    </section>

    <!-- 评价类型分布 -->
    <section class="chart-section">
      <h3 class="section-title">评价类型分布</h3>
      <div class="chart-grid">
        <div class="chart-card">
          <h4 class="chart-title">类型占比</h4>
          <v-chart v-if="typePieOption.series" :option="typePieOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无评价数据" :image-size="80" />
        </div>
        <div class="chart-card">
          <h4 class="chart-title">类型统计</h4>
          <div v-if="typeSummary.length" class="type-summary-list">
            <div v-for="item in typeSummary" :key="item.type" class="type-summary-item">
              <div class="type-summary-header">
                <span class="type-summary-label">{{ item.label }}</span>
                <span class="type-summary-count">{{ item.count }} 条</span>
              </div>
              <div class="type-summary-bar-track">
                <div class="type-summary-bar-fill" :style="{ width: item.percent + '%', background: getTypeColor(item.type) }" />
              </div>
              <span class="type-summary-percent">{{ item.percent }}%</span>
            </div>
          </div>
          <el-empty v-else description="暂无评价数据" :image-size="80" />
        </div>
      </div>
    </section>

    <!-- 各部门评价统计 -->
    <section class="chart-section">
      <h3 class="section-title">各部门评价统计</h3>
      <div class="chart-grid">
        <div class="chart-card">
          <h4 class="chart-title">教学评价 - 院系分布</h4>
          <v-chart v-if="teachingChartOption.series" :option="teachingChartOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无教学评价数据" :image-size="80" />
        </div>
        <div class="chart-card">
          <h4 class="chart-title">服务评价 - 部门分布</h4>
          <v-chart v-if="serviceChartOption.series" :option="serviceChartOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无服务评价数据" :image-size="80" />
        </div>
      </div>
    </section>

    <!-- 评分分布与趋势 -->
    <section class="chart-section">
      <div class="chart-grid">
        <div class="chart-card">
          <h4 class="chart-title">评分分布</h4>
          <v-chart v-if="scorePieOption.series" :option="scorePieOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无评分数据" :image-size="80" />
        </div>
        <div class="chart-card">
          <h4 class="chart-title">评价提交趋势</h4>
          <v-chart v-if="trendChartOption.series" :option="trendChartOption" class="chart-container" autoresize />
          <el-empty v-else description="暂无趋势数据" :image-size="80" />
        </div>
      </div>
    </section>

    <!-- 教职工评价排行 -->
    <section class="chart-section">
      <h3 class="section-title">教职工评价排行</h3>
      <div class="chart-card">
        <el-table v-if="staffRanking.length" :data="staffRanking" stripe style="width: 100%">
          <el-table-column type="index" label="排名" width="80" align="center">
            <template #default="{ $index }">
              <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]" effect="dark" size="small">{{ $index + 1 }}</el-tag>
              <span v-else>{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="教师姓名" min-width="120" />
          <el-table-column prop="count" label="被评价次数" width="120" align="center" sortable>
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">{{ row.count }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="avgScore" label="平均得分" width="120" align="center" sortable>
            <template #default="{ row }">
              <span class="score-text">{{ row.avgScore }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无教职工评价数据" :image-size="80" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-container {
  padding: var(--space-6) var(--space-4);
  max-width: var(--page-max-width);
  margin-inline: auto;
}

.page-header {
  margin-bottom: var(--space-6);
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

/* 核心指标卡 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.metric-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: border-color var(--transition-fast, 0.2s), transform var(--transition-fast, 0.2s);
}

.metric-card:hover {
  border-color: var(--color-primary-200);
  transform: translateY(-2px);
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-icon {
  opacity: 0.8;
}

.metric-value {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.metric-title {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 图表区域 */
.chart-section {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-title);
  margin: 0 0 var(--space-4);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.chart-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: var(--border-light);
  padding: var(--space-4);
  overflow: hidden;
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

/* 类型统计摘要 */
.type-summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-2) 0;
}

.type-summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.type-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-summary-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-title);
}

.type-summary-count {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.type-summary-bar-track {
  height: var(--space-3);
  background: var(--color-bg-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.type-summary-bar-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width var(--transition-normal, 0.6s) ease;
  min-width: 0;
}

.type-summary-percent {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
  text-align: right;
}

/* 表格样式 */
.score-text {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

/* 响应式 */
@media (max-width: 1366px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid {
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

  .chart-container {
    height: 240px;
  }

  .chart-card {
    padding: var(--space-3);
  }
}
</style>
