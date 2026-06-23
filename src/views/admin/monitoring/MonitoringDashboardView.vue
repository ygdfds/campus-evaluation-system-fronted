<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'

defineOptions({ name: 'AdminMonitoringDashboardView' })

// 统计数据
const stats = ref([
  { title: '新增租户', value: 0, unit: '个', trend: 'up' },
  { title: '到期预警', value: 0, unit: '个', trend: 'down' },
  { title: '冻结租户', value: 0, unit: '个', trend: 'neutral' },
  { title: '系统异常', value: 0, unit: '条', trend: 'up' }
])

// 告警列表
const alerts = ref([])

onMounted(() => {
  // TODO: 获取统计数据和告警信息
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="运维监控告警" 
      subtitle="系统运行状态监控与异常告警管理" 
    />
    
    <!-- 数据看板 -->
    <el-card shadow="hover" class="section-card">
      <div class="stats-grid">
        <StatCard 
          v-for="(stat, index) in stats" 
          :key="index"
          :title="stat.title"
          :value="stat.value"
          :unit="stat.unit"
          :trend="stat.trend"
        />
      </div>
    </el-card>

    <!-- 告警列表 -->
    <el-card shadow="hover" class="section-card">
      <el-table :data="alerts" stripe style="width: 100%">
        <el-table-column prop="alertType" label="告警类型" width="120" />
        <el-table-column prop="description" label="告警描述" min-width="250" />
        <el-table-column prop="severity" label="严重程度" width="100" />
        <el-table-column prop="createdAt" label="发生时间" width="160" />
        <el-table-column prop="status" label="处理状态" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}

.section-card { 
  border-radius: var(--radius-lg); 
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}
</style>