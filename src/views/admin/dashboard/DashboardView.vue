<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { School, User, DocumentChecked, DataAnalysis } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatCard from '@/components/common/StatCard.vue'
import {
  getAdminDashboardStatsApi,
  getCredentialListApi,
  getOnboardingApplicationsApi,
  getReportDashboardApi,
  getSupportTicketsApi,
  getTenantLifecycleApi,
} from '@/api/system'

defineOptions({ name: 'AdminDashboardView' })

const loading = ref(true)
const stats = ref([])
const tenantChartRef = ref(null)
const trendChartRef = ref(null)
const onboardingChartRef = ref(null)
const credentialChartRef = ref(null)
const ticketChartRef = ref(null)
const resourceChartRef = ref(null)
const charts = {}

const iconMap = {
  School,
  User,
  DocumentChecked,
  DataAnalysis,
}

const tenantStatusMap = {
  active: '正常租户',
  frozen: '冻结租户',
  cancelled: '已注销',
  onboarded: '已入驻',
  pending: '待处理',
}

const onboardingStatusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

const credentialStatusMap = {
  valid: '有效',
  expired: '已过期',
  pending: '待审核',
  revoked: '已撤销',
}

const ticketStatusMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
}

const chartColors = ['#009688', '#5c8df6', '#f2a541', '#e76f51', '#8d99ae']

const fetchStats = async () => {
  loading.value = true
  try {
    const response = await getAdminDashboardStatsApi()
    stats.value = (response.data?.list || []).map((item) => ({
      ...item,
      icon: iconMap[item.icon],
    }))
  } catch (error) {
    console.error('获取仪表盘数据失败', error)
  } finally {
    loading.value = false
  }
}

function countBy(list, key, labelMap) {
  const counter = list.reduce((acc, item) => {
    const value = item[key] || 'unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  return Object.entries(counter).map(([value, count]) => ({
    name: labelMap[value] || value,
    value: count,
  }))
}

function buildMonthlyTrend(tenants, applications) {
  const source = [...tenants, ...applications]
  const counter = source.reduce((acc, item) => {
    const rawDate = item.createdAt || item.created_at
    if (!rawDate) return acc
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) return acc
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const keys = Object.keys(counter).sort()
  return {
    months: keys.map((key) => `${Number(key.slice(5))}月`),
    values: keys.map((key) => counter[key]),
  }
}

function getChart(key, elementRef) {
  if (!elementRef.value) return null
  charts[key] = charts[key] || echarts.init(elementRef.value)
  return charts[key]
}

function renderPieChart(key, elementRef, title, data) {
  const chart = getChart(key, elementRef)
  if (!chart) return
  chart.setOption({
    color: chartColors,
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#606266' },
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['40%', '62%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        label: {
          fontSize: 11,
          formatter: '{b} {c}',
        },
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2,
        },
        data,
      },
    ],
  })
}

function renderTrendChart(data) {
  const chart = getChart('trend', trendChartRef)
  if (!chart) return
  chart.setOption({
    color: ['#009688'],
    tooltip: { trigger: 'axis' },
    grid: { top: 18, right: 14, bottom: 28, left: 32 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.months,
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: [
      {
        name: '入驻数量',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.14 },
        data: data.values,
      },
    ],
  })
}

function renderBarChart(key, elementRef, title, data) {
  const chart = getChart(key, elementRef)
  if (!chart) return
  chart.setOption({
    color: ['#009688'],
    tooltip: { trigger: 'axis' },
    grid: { top: 18, right: 14, bottom: 28, left: 32 },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.name),
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series: [
      {
        name: title,
        type: 'bar',
        barWidth: 20,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: data.map((item) => item.value),
      },
    ],
  })
}

function renderResourceChart(section) {
  const chart = getChart('resource', resourceChartRef)
  if (!chart) return
  const items = section?.items || []
  chart.setOption({
    color: ['#009688'],
    tooltip: {},
    radar: {
      radius: '58%',
      indicator: items.map((item) => ({ name: item.label, max: 100 })),
      splitLine: { lineStyle: { color: '#e3e6ea' } },
      splitArea: { areaStyle: { color: ['#ffffff', '#f7faf9'] } },
      axisName: { color: '#606266' },
    },
    series: [
      {
        name: '资源占用',
        type: 'radar',
        areaStyle: { opacity: 0.16 },
        lineStyle: { width: 2 },
        data: [{ value: items.map((item) => item.value), name: '占用率' }],
      },
    ],
  })
}

function resizeCharts() {
  Object.values(charts).forEach((chart) => chart?.resize())
}

const fetchCharts = async () => {
  try {
    const [
      tenantsResponse,
      applicationsResponse,
      credentialsResponse,
      ticketsResponse,
      reportResponse,
    ] = await Promise.all([
      getTenantLifecycleApi(),
      getOnboardingApplicationsApi(),
      getCredentialListApi(),
      getSupportTicketsApi(),
      getReportDashboardApi(),
    ])

    const tenants = tenantsResponse.data?.list || []
    const applications = applicationsResponse.data?.list || []
    const credentials = credentialsResponse.data?.list || []
    const tickets = ticketsResponse.data?.list || []
    const reportSections = reportResponse.data?.sections || []
    const resourceSection = reportSections.find((section) => section.key === 'resourceUsage')

    await nextTick()
    renderPieChart('tenant', tenantChartRef, '租户分布', countBy(tenants, 'status', tenantStatusMap))
    renderTrendChart(buildMonthlyTrend(tenants, applications))
    renderBarChart('onboarding', onboardingChartRef, '入驻审核', countBy(applications, 'status', onboardingStatusMap))
    renderPieChart('credential', credentialChartRef, '凭证状态', countBy(credentials, 'status', credentialStatusMap))
    renderBarChart('ticket', ticketChartRef, '工单状态', countBy(tickets, 'status', ticketStatusMap))
    renderResourceChart(resourceSection)
  } catch (error) {
    console.error('获取平台概览图表数据失败', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  Object.values(charts).forEach((chart) => chart?.dispose())
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="平台概览" subtitle="系统管理端数据总览" />
    <div class="stats-grid">
      <StatCard
        v-for="item in stats"
        :key="item.title"
        :title="item.title"
        :value="loading ? '-' : item.value"
        :icon="item.icon"
        :color="item.color"
      />
    </div>
    <div class="dashboard-chart-grid">
      <PageSection title="租户分布">
        <div ref="tenantChartRef" class="chart-panel" />
      </PageSection>
      <PageSection title="入驻趋势">
        <div ref="trendChartRef" class="chart-panel" />
      </PageSection>
      <PageSection title="入驻审核状态">
        <div ref="onboardingChartRef" class="chart-panel" />
      </PageSection>
      <PageSection title="凭证材料状态">
        <div ref="credentialChartRef" class="chart-panel" />
      </PageSection>
      <PageSection title="工单处理状态">
        <div ref="ticketChartRef" class="chart-panel" />
      </PageSection>
      <PageSection title="资源占用概览">
        <div ref="resourceChartRef" class="chart-panel" />
      </PageSection>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.dashboard-chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.chart-panel {
  width: 100%;
  height: 180px;
}

@media (max-width: 1200px) {
  .stats-grid,
  .dashboard-chart-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-grid,
  .dashboard-chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
