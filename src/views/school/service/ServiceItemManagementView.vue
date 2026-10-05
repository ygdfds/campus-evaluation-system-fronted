<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/request'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'

defineOptions({ name: 'ServiceItemManagementView' })

const loading = ref(false)
const searchText = ref('')
const serviceItems = ref([])

const statusMap = {
  active: { label: '启用', type: 'success' },
  disabled: { label: '停用', type: 'info' },
}

function unwrapData(response) {
  return response?.data ?? response
}

function pageRecords(response) {
  const data = unwrapData(response) || {}
  return data.records || data.list || []
}

const tableData = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) return serviceItems.value
  return serviceItems.value.filter(row =>
    String(row.name || '').toLowerCase().includes(keyword) ||
    String(row.serviceOrgName || '').toLowerCase().includes(keyword) ||
    String(row.type || '').toLowerCase().includes(keyword)
  )
})

async function loadData() {
  loading.value = true
  try {
    serviceItems.value = pageRecords(await request.get('/school/service-items', {
      params: { pageNum: 1, pageSize: 500 },
    }))
  } catch (error) {
    ElMessage.error(error.message || '服务项目加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <PageHeader title="服务项目管理" description="维护各服务机构提供的具体服务项目，作为服务评价的细分对象。">
      <template #actions>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </template>
    </PageHeader>

    <div class="content-card">
      <div class="card-header">
        <el-input
          v-model="searchText"
          :prefix-icon="Search"
          placeholder="搜索项目名称 / 所属机构"
          clearable
          style="width: 280px"
        />
      </div>

      <el-table :data="tableData" v-loading="loading" stripe class="data-table">
        <el-table-column prop="name" label="项目名称" min-width="180" />
        <el-table-column prop="serviceOrgName" label="所属机构" min-width="160">
          <template #default="{ row }">{{ row.serviceOrgName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="type" label="服务类别" width="130" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
              {{ statusMap[row.status]?.label || row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ row.updatedAt || '-' }}</template>
        </el-table-column>
      </el-table>

      <EmptyPlaceholder v-if="!loading && tableData.length === 0" text="暂无服务项目数据" />
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 1200px; }
.content-card {
  margin-top: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.data-table { width: 100%; }
</style>
