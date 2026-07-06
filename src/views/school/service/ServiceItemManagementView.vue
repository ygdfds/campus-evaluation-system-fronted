<script setup>
import { ref } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'ServiceItemManagementView' })

const searchText = ref('')

const placeholderItems = [
  { code: 'ITEM-001', name: '图书借阅服务', org: '图书馆', category: '公共服务', frequency: '持续', status: '启用' },
  { code: 'ITEM-002', name: '食堂就餐服务', org: '后勤餐饮中心', category: '后勤保障', frequency: '每日', status: '启用' },
  { code: 'ITEM-003', name: '校园网络服务', org: '信息技术中心', category: '信息服务', frequency: '持续', status: '启用' },
  { code: 'ITEM-004', name: '选课系统服务', org: '教务处注册中心', category: '教学服务', frequency: '每学期', status: '启用' },
  { code: 'ITEM-005', name: '宿舍维修服务', org: '宿舍管理中心', category: '后勤保障', frequency: '按需', status: '停用' },
]
</script>

<template>
  <div class="page-container">
    <PageHeader title="服务项目管理" description="管理学校各服务窗口提供的具体服务项目，作为服务评价的细粒度对象。" />

    <div class="content-card">
      <div class="card-header">
        <div class="filter-bar">
          <el-input v-model="searchText" placeholder="搜索项目名称 / 所属机构" clearable prefix-icon="Search" style="width: 280px" />
        </div>
        <el-button type="primary" disabled>
          <el-icon><Plus /></el-icon>新增项目
        </el-button>
      </div>

      <el-table :data="placeholderItems" stripe class="data-table">
        <el-table-column prop="code" label="项目编号" width="120" />
        <el-table-column prop="name" label="项目名称" min-width="160" />
        <el-table-column prop="org" label="所属机构" width="150" />
        <el-table-column prop="category" label="服务类别" width="110" />
        <el-table-column prop="frequency" label="服务频次" width="100" align="center" />
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
          <p class="notice-desc">服务项目管理模块用于维护各服务机构提供的具体服务事项，如图书借阅、食堂就餐、校园网络、选课系统等。每个服务项目可独立配置评价表单，实现针对性的服务质量评测。当前为示例展示，待后端接口接入后即可完整使用。</p>
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
