<script setup>
import { ref } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'EnrollmentManagementView' })

const searchText = ref('')

const placeholderEnrollments = [
  { studentName: '王小明', studentId: '2024001', courseName: '计算机科学导论', courseCode: 'CS101', semester: '2024-2025秋', status: '已确认' },
  { studentName: '李雪梅', studentId: '2024002', courseName: '高等数学（二）', courseCode: 'MATH201', semester: '2024-2025秋', status: '已确认' },
  { studentName: '张伟', studentId: '2023015', courseName: '大学英语（三）', courseCode: 'ENG301', semester: '2024-2025秋', status: '已确认' },
  { studentName: '刘佳', studentId: '2023008', courseName: '大学物理实验', courseCode: 'PHY102', semester: '2024-2025春', status: '待确认' },
  { studentName: '陈思', studentId: '2022022', courseName: '艺术鉴赏', courseCode: 'ART100', semester: '2024-2025春', status: '已退选' },
]
</script>

<template>
  <div class="page-container">
    <PageHeader title="选课管理" description="管理学生选课记录，关联课程与学生的选课关系，作为评价任务分配的数据基础。" />

    <div class="content-card">
      <div class="card-header">
        <div class="filter-bar">
          <el-input v-model="searchText" placeholder="搜索学生姓名 / 学号 / 课程" clearable prefix-icon="Search" style="width: 280px" />
        </div>
        <el-button type="primary" disabled>
          <el-icon><Plus /></el-icon>导入选课
        </el-button>
      </div>

      <el-table :data="placeholderEnrollments" stripe class="data-table">
        <el-table-column prop="studentId" label="学号" width="110" />
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="courseCode" label="课程编号" width="110" />
        <el-table-column prop="courseName" label="课程名称" min-width="170" />
        <el-table-column prop="semester" label="学期" width="130" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已确认' ? 'success' : row.status === '待确认' ? 'warning' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default>
            <el-button text type="primary" size="small" disabled>查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="placeholder-notice">
        <el-icon :size="18"><InfoFilled /></el-icon>
        <div>
          <p class="notice-title">模块说明</p>
          <p class="notice-desc">选课管理模块用于维护学生与课程之间的选课关系，包括选课记录、学期、状态等信息。选课数据是系统生成评价任务的核心依据——只有已确认选课的学生才会收到对应课程的评价任务。支持通过导入中心批量导入选课数据。当前为示例展示，待后端接口接入后即可完整使用。</p>
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
