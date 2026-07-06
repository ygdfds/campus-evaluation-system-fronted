<script setup>
import { ref } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'CourseManagementView' })

const searchText = ref('')

const placeholderCourses = [
  { code: 'CS101', name: '计算机科学导论', department: '计算机学院', credits: 4, students: 120, status: '已开课' },
  { code: 'MATH201', name: '高等数学（二）', department: '数学学院', credits: 5, students: 95, status: '已开课' },
  { code: 'ENG301', name: '大学英语（三）', department: '外国语学院', credits: 3, students: 80, status: '已开课' },
  { code: 'PHY102', name: '大学物理实验', department: '物理学院', credits: 2, students: 60, status: '待开课' },
  { code: 'ART100', name: '艺术鉴赏', department: '艺术学院', credits: 2, students: 45, status: '已结课' },
]
</script>

<template>
  <div class="page-container">
    <PageHeader title="课程管理" description="管理学校开设的课程信息，包括课程基本信息、学分、所属院系等。" />

    <div class="content-card">
      <div class="card-header">
        <div class="filter-bar">
          <el-input v-model="searchText" placeholder="搜索课程名称 / 课程编号" clearable prefix-icon="Search" style="width: 280px" />
        </div>
        <el-button type="primary" disabled>
          <el-icon><Plus /></el-icon>新增课程
        </el-button>
      </div>

      <el-table :data="placeholderCourses" stripe class="data-table">
        <el-table-column prop="code" label="课程编号" width="120" />
        <el-table-column prop="name" label="课程名称" min-width="180" />
        <el-table-column prop="department" label="所属院系" width="140" />
        <el-table-column prop="credits" label="学分" width="80" align="center" />
        <el-table-column prop="students" label="选课人数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已开课' ? 'success' : row.status === '待开课' ? 'warning' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
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
          <p class="notice-desc">课程管理模块用于维护学校所有课程的基础数据，包括课程编号、名称、学分、所属院系、开课学期等信息。该数据将作为评价表单分配、评价任务生成、数据导入的基础数据源。当前为示例展示，待后端接口接入后即可完整使用。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 1200px;
}

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

.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.data-table {
  width: 100%;
}

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

.placeholder-notice .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-primary-500);
}

.notice-title {
  margin: 0 0 4px;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-sm);
}

.notice-desc {
  margin: 0;
  font-size: var(--font-xs);
  line-height: 1.6;
  color: var(--color-primary-600);
}
</style>
