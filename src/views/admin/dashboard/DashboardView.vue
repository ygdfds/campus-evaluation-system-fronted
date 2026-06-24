<script setup>
import { ref, onMounted } from 'vue'
import { School, User, DocumentChecked, DataAnalysis } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatCard from '@/components/common/StatCard.vue'
import { getAdminDashboardStatsApi } from '@/api/system'

defineOptions({ name: 'AdminDashboardView' })

const loading = ref(true)
const stats = ref([])

const iconMap = {
  School,
  User,
  DocumentChecked,
  DataAnalysis,
}

const fetchStats = async () => {
  loading.value = true
  try {
    const response = await getAdminDashboardStatsApi()
    stats.value = (response.data?.list || []).map((item) => ({
      ...item,
      icon: iconMap[item.icon],
    }))
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchStats() })
</script>

<template>
  <div class="page-container">
    <PageHeader title="平台概览" subtitle="系统管理端数据总览" />
    <div class="stats-grid">
      <StatCard v-for="item in stats" :key="item.title" :title="item.title" :value="loading ? '-' : item.value" :icon="item.icon" :color="item.color" />
    </div>
    <el-row :gutter="20">
      <el-col :span="12">
        <PageSection title="租户分布">
          <div class="chart-placeholder">图表区域</div>
        </PageSection>
      </el-col>
      <el-col :span="12">
        <PageSection title="入驻趋势">
          <div class="chart-placeholder">图表区域</div>
        </PageSection>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.chart-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; color: var(--color-text-placeholder); background: var(--color-bg-light); border-radius: var(--radius-md); }
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
