<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getReportDashboardApi } from '@/api/system'

defineOptions({ name: 'AdminReportDashboardView' })

const reportData = ref({})
const reportSections = ref([])

const fetchReportData = async () => {
  const response = await getReportDashboardApi()
  reportData.value = response.data || {}
  reportSections.value = response.data?.sections || []
}

const maxSectionValue = (section) => {
  return Math.max(...(section.items || []).map((item) => item.value), 1)
}

onMounted(() => {
  fetchReportData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="全局统计报表" 
      subtitle="平台运营数据统计与分析" 
    />
    
    <!-- 操作按钮 -->
    <PageSection>
      <el-button type="success">导出Excel</el-button>
    </PageSection>

    <PageSection v-for="section in reportSections" :key="section.key" :title="section.title">
      <div class="chart-bars">
        <div v-for="item in section.items" :key="item.label" class="chart-row">
          <span class="chart-label">{{ item.label }}</span>
          <div class="chart-track">
            <div class="chart-bar" :style="{ width: `${(item.value / maxSectionValue(section)) * 100}%` }" />
          </div>
          <span class="chart-value">{{ item.value }}</span>
        </div>
      </div>
    </PageSection>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chart-row {
  display: grid;
  grid-template-columns: 120px 1fr 48px;
  gap: var(--space-3);
  align-items: center;
}

.chart-label,
.chart-value {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.chart-track {
  height: var(--space-4);
  background: var(--color-bg-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  background: var(--color-primary-500);
}
</style>
