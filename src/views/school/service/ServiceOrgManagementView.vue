<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import { getSchoolOrgTreeApi, serviceOrgTypeMap } from '@/api/schoolOrg'

defineOptions({ name: 'ServiceOrgManagementView' })

const loading = ref(false)
const searchText = ref('')
const orgTree = ref([])

const statusMap = {
  active: { label: '启用', type: 'success' },
  disabled: { label: '停用', type: 'info' },
}

function flattenTree(nodes, level = 0, parentName = '') {
  return nodes.flatMap(node => {
    const current = {
      ...node,
      level,
      parent_name: parentName,
      type_label: serviceOrgTypeMap[node.type] || node.type || '-',
      status_label: statusMap[node.status]?.label || node.status || '-',
    }
    return [current, ...flattenTree(node.children || [], level + 1, node.name)]
  })
}

const tableData = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  const rows = flattenTree(orgTree.value)
  if (!keyword) return rows
  return rows.filter(row =>
    String(row.name || '').toLowerCase().includes(keyword) ||
    String(row.code || '').toLowerCase().includes(keyword)
  )
})

async function loadData() {
  loading.value = true
  try {
    orgTree.value = await getSchoolOrgTreeApi(null, 'service')
  } catch (error) {
    ElMessage.error(error.message || '服务机构加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <PageHeader title="服务机构管理" description="维护学校服务组织，作为服务评价和反馈处理的数据范围。">
      <template #actions>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </template>
    </PageHeader>

    <div class="content-card">
      <div class="card-header">
        <el-input
          v-model="searchText"
          :prefix-icon="Search"
          placeholder="搜索机构名称 / 编号"
          clearable
          style="width: 280px"
        />
      </div>

      <el-table :data="tableData" v-loading="loading" stripe class="data-table" row-key="id">
        <el-table-column prop="code" label="机构编号" width="140" />
        <el-table-column label="机构名称" min-width="180">
          <template #default="{ row }">
            <span :style="{ paddingLeft: `${row.level * 18}px` }">{{ row.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="parent_name" label="上级机构" min-width="150">
          <template #default="{ row }">{{ row.parent_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="type_label" label="服务类型" width="130" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ row.status_label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ row.updated_at || row.updatedAt || '-' }}</template>
        </el-table-column>
      </el-table>

      <EmptyPlaceholder v-if="!loading && tableData.length === 0" text="暂无服务机构数据" />
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
