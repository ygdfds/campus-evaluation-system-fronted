<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getTenantsApi, normalizeTenantStatus, SYSTEM_STATUS_MAP } from '@/api/system'

const tableData = ref([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const response = await getTenantsApi({ page: 1, pageSize: 20 })
    tableData.value = response.data?.list || []
  } catch (error) {
    console.error('获取租户列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
defineOptions({ name: 'AdminTenantListView' })
</script>
<template>
  <div class="page-container">
    <PageHeader title="租户列表" subtitle="管理平台已入驻学校租户" />
    <PageSection>
      <el-table :data="tableData" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="tenantId" label="租户ID" width="120" />
        <el-table-column prop="schoolName" label="学校名称" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <StatusTag :status="normalizeTenantStatus(row.status)" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="入驻时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button type="primary" link>详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>
  </div>
</template>
<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
</style>
