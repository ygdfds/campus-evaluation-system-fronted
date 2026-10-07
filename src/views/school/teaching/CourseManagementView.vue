<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { getCourseListApi, createCourseApi, updateCourseApi, deleteCourseApi, getTeachingOrgOptionsApi } from '@/api/schoolTeaching'

defineOptions({ name: 'CourseManagementView' })
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const orgs = ref([])
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({ teachingOrgId: null, courseCode: '', courseName: '', term: '', status: 'active' })

async function load() {
  loading.value = true
  try {
    const result = await getCourseListApi({ keyword: keyword.value, pageNum: page.value, pageSize: 20 })
    rows.value = result.records
    total.value = result.total
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}
async function openCreate() {
  editing.value = null
  form.value = { teachingOrgId: null, courseCode: '', courseName: '', term: '', status: 'active' }
  dialogVisible.value = true
  if (!orgs.value.length) orgs.value = await getTeachingOrgOptionsApi().catch(() => [])
}
async function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  dialogVisible.value = true
  if (!orgs.value.length) orgs.value = await getTeachingOrgOptionsApi().catch(() => [])
}
async function save() {
  if (!form.value.teachingOrgId || !form.value.courseCode || !form.value.courseName || !form.value.term) {
    ElMessage.warning('请填写课程组织、编码、名称和学期')
    return
  }
  try {
    if (editing.value) await updateCourseApi(editing.value.id, form.value)
    else await createCourseApi(form.value)
    ElMessage.success('课程已保存')
    dialogVisible.value = false
    await load()
  } catch (error) {
    console.error('Failed to save course', error)
    ElMessage.error('Failed to save course')
  }
}
async function remove(row) {
  try {
    await ElMessageBox.confirm('删除课程前必须解除教师和选课关联，确认继续？', '确认删除', { type: 'warning' })
    await deleteCourseApi(row.id)
    ElMessage.success('课程已删除')
    await load()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete course', error)
      ElMessage.error('Failed to delete course')
    }
  }
}
onMounted(async () => {
  orgs.value = await getTeachingOrgOptionsApi().catch(() => [])
  await load()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="课程管理" description="维护课程、学期和所属教学组织。">
      <template #actions><el-button type="primary" @click="openCreate">新增课程</el-button></template>
    </PageHeader>
    <div class="content-card">
      <div class="toolbar">
        <el-input v-model="keyword" clearable placeholder="搜索课程名称或编码" style="max-width: 320px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
        <el-button @click="load">查询</el-button>
      </div>
      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column prop="courseCode" label="课程编码" width="140" />
        <el-table-column prop="courseName" label="课程名称" min-width="180" />
        <el-table-column prop="teachingOrgId" label="教学组织" width="120" />
        <el-table-column prop="term" label="学期" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无课程数据" /></template>
      </el-table>
      <el-pagination v-model:current-page="page" :total="total" layout="total, prev, pager, next" @current-change="load" />
    </div>
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑课程' : '新增课程'" width="520px">
      <el-form label-position="top">
        <el-form-item label="教学组织"><el-select v-model="form.teachingOrgId" style="width: 100%"><el-option v-for="item in orgs" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="课程编码"><el-input v-model="form.courseCode" /></el-form-item>
        <el-form-item label="课程名称"><el-input v-model="form.courseName" /></el-form-item>
        <el-form-item label="学期"><el-input v-model="form.term" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status"><el-option label="启用" value="active" /><el-option label="停用" value="disabled" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { max-width: 1200px; }
.content-card { margin-top: var(--space-4); padding: var(--space-5); background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); }
.toolbar { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
.el-pagination { justify-content: flex-end; margin-top: var(--space-4); }
</style>
