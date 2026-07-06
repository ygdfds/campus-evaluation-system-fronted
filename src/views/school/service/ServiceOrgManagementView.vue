<script setup>
import { ref } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'ServiceOrgManagementView' })

const searchText = ref('')

const placeholderOrgs = [
  { code: 'SVC-LIB', name: '图书馆', type: '公共服务', staff: 25, windows: 4, status: '启用' },
  { code: 'SVC-CAN', name: '后勤餐饮中心', type: '后勤保障', staff: 80, windows: 6, status: '启用' },
  { code: 'SVC-IT', name: '信息技术中心', type: '信息服务', staff: 15, windows: 3, status: '启用' },
  { code: 'SVC-REG', name: '教务处注册中心', type: '教学服务', staff: 12, windows: 5, status: '启用' },
  { code: 'SVC-DOR', name: '宿舍管理中心', type: '后勤保障', staff: 30, windows: 2, status: '停用' },
]
</script>

<template>
  <div class="page-container">
    <PageHeader title="服务机构管理" description="管理学校各服务窗口与机构的基础信息，作为服务质量评价的对象数据源。" />

    <div class="content-card">
      <div class="card-header">
        <div class="filter-bar">
          <el-input v-model="searchText" placeholder="搜索机构名称 / 编号" clearable prefix-icon="Search" style="width: 280px" />
        </div>
        <el-button type="primary" disabled>
          <el-icon><Plus /></el-icon>新增机构
        </el-button>
      </div>

      <el-table :data="placeholderOrgs" stripe class="data-table">
        <el-table-column prop="code" label="机构编号" width="120" />
        <el-table-column prop="name" label="机构名称" min-width="160" />
        <el-table-column prop="type" label="服务类型" width="120" />
        <el-table-column prop="staff" label="工作人员" width="100" align="center" />
        <el-table-column prop="windows" label="服务窗口" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default>
            <el-button text type="primary" size="small" disabled>编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="placeholder-notice">
        <el-icon :size="18"><InfoFilled /></el-icon>
        <div>
          <p class="notice-title">模块说明</p>
          <p class="notice-desc">服务机构管理模块用于维护学校内各服务窗口和机构的基础信息，如图书馆、后勤餐饮、信息技术中心、教务注册等。服务机构数据是服务类评价表单分配、服务满意度统计的对象基础。当前为示例展示，待后端接口接入后即可完整使用。</p>
        </div>
      </div>
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
  border-radius: var(--radius-xl);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.filter-bar { display: flex; align-items: center; gap: var(--space-3); }
.data-table { width: 100%; }
.placeholder-notice {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-4);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  color: var(--color-primary-700);
}
.placeholder-notice .el-icon { flex-shrink: 0; margin-top: 2px; color: var(--color-primary-500); }
.notice-title { margin: 0 0 4px; font-weight: var(--font-weight-semibold); font-size: var(--font-sm); }
.notice-desc { margin: 0; font-size: var(--font-xs); line-height: 1.6; color: var(--color-primary-600); }
</style>
