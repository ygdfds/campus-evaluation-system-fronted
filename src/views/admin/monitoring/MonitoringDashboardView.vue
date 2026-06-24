<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getMonitoringAlertsApi, getMonitoringStatsApi, SYSTEM_STATUS_MAP } from '@/api/system'

defineOptions({ name: 'AdminMonitoringDashboardView' })

const stats = ref([])
const alerts = ref([])
const loading = ref(false)

const fetchMonitoringData = async () => {
  loading.value = true
  try {
    const [statsResponse, alertsResponse] = await Promise.all([
      getMonitoringStatsApi(),
      getMonitoringAlertsApi(),
    ])
    stats.value = statsResponse.data?.list || []
    alerts.value = alertsResponse.data?.list || []
  } finally {
    loading.value = false
  }
}

const markAlertHandled = (row) => {
  row.status = 'resolved'
  ElMessage.success('告警已标记为已处理')
}

onMounted(() => {
  fetchMonitoringData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="运维监控告警" 
      subtitle="系统运行状态监控与异常告警管理" 
    />
    
    <!-- 数据看板 -->
    <PageSection>
      <div class="stats-grid">
        <StatCard 
          v-for="(stat, index) in stats" 
          :key="index"
          :title="stat.title"
          :value="stat.value"
          :description="stat.unit"
        />
      </div>
    </PageSection>

    <!-- 告警列表 -->
    <PageSection>
      <el-table :data="alerts" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="alertType" label="告警类型" width="120" />
        <el-table-column prop="description" label="告警描述" min-width="250" />
        <el-table-column prop="severity" label="严重程度" width="100" />
        <el-table-column prop="createdAt" label="发生时间" width="160" />
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="markAlertHandled(row)">
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}
</style>
