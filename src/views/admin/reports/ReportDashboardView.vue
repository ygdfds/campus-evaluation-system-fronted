<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'AdminReportDashboardView' })

// 报表数据
const reportData = ref({
  monthlyTenants: [],
  ticketStats: [],
  resourceUsage: []
})

onMounted(() => {
  // TODO: 获取报表数据
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="全局统计报表" 
      subtitle="平台运营数据统计与分析" 
    />
    
    <!-- 操作按钮 -->
    <el-card shadow="hover" class="section-card">
      <el-button type="success">导出Excel</el-button>
    </el-card>

    <!-- 图表区域 -->
    <el-card shadow="hover" class="section-card">
      <h3>月度新增/到期租户统计</h3>
      <div class="chart-placeholder">
        <!-- TODO: 集成图表组件 -->
        <p>柱状图占位符 - 显示月度新增/到期租户数量</p>
      </div>
    </el-card>

    <el-card shadow="hover" class="section-card">
      <h3>工单处理量统计</h3>
      <div class="chart-placeholder">
        <!-- TODO: 集成图表组件 -->
        <p>图表占位符 - 显示工单处理量趋势</p>
      </div>
    </el-card>

    <el-card shadow="hover" class="section-card">
      <h3>系统资源占用情况</h3>
      <div class="chart-placeholder">
        <!-- TODO: 集成图表组件 -->
        <p>图表占位符 - 显示系统资源占用图表</p>
      </div>
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

.chart-placeholder {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-light);
  border-radius: var(--radius-md);
  margin-top: var(--space-4);
}
</style>