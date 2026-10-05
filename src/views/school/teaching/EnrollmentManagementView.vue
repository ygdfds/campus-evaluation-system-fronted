<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { getEnrollmentListApi, createEnrollmentApi, deleteEnrollmentApi, getCourseOptionsApi, getClassOptionsApi } from '@/api/schoolTeaching'

defineOptions({ name: 'EnrollmentManagementView' })
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const studentId = ref('')
const dialogVisible = ref(false)
const courses = ref([])
const classes = ref([])
const form = ref({ courseId: null, studentId: null, classGroupId: null, status: 'active' })

async function load() {
  loading.value = true
  try {
    const result = await getEnrollmentListApi({ studentId: studentId.value || undefined, pageNum: page.value, pageSize: 20 })
    rows.value = result.records
    total.value = result.total
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}
async function openCreate() {
  form.value = { courseId: null, studentId: null, classGroupId: null, status: 'active' }
  courses.value = await getCourseOptionsApi().catch(() => [])
  classes.value = await getClassOptionsApi().catch(() => [])
  dialogVisible.value = true
}
async function save() {
  if (!form.value.courseId || !form.value.studentId) return ElMessage.warning('请填写课程和学生用户 ID')
  try {
    await createEnrollmentApi(form.value)
    ElMessage.success('选课关系已保存')
    dialogVisible.value = false
    await load()
  } catch {}
}
async function remove(row) {
  try {
    await ElMessageBox.confirm('确认删除该选课关系？', '确认删除', { type: 'warning' })
    await deleteEnrollmentApi(row.id)
    ElMessage.success('选课关系已删除')
    await load()
  } catch {}
}
onMounted(load)
</script>

<template>
  <div class="page-container">
    <PageHeader title="选课管理" description="维护真实的课程、学生和班级关系。">
      <template #actions><el-button type="primary" @click="openCreate">新增选课</el-button></template>
    </PageHeader>
    <div class="content-card">
      <div class="toolbar"><el-input v-model="studentId" clearable placeholder="按学生用户 ID 查询" style="max-width: 260px" @keyup.enter="page = 1; load()" /><el-button @click="load">查询</el-button></div>
      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column prop="studentId" label="学生用户 ID" width="150" />
        <el-table-column prop="courseId" label="课程 ID" width="120" />
        <el-table-column prop="classGroupId" label="班级 ID" width="120" />
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
        <template #empty><el-empty description="暂无选课数据" /></template>
      </el-table>
      <el-pagination v-model:current-page="page" :total="total" layout="total, prev, pager, next" @current-change="load" />
    </div>
    <el-dialog v-model="dialogVisible" title="新增选课" width="500px">
      <el-form label-position="top">
        <el-form-item label="课程"><el-select v-model="form.courseId" style="width:100%"><el-option v-for="item in courses" :key="item.id" :label="`${item.label} (${item.extra || ''})`" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="学生用户 ID"><el-input-number v-model="form.studentId" :min="1" style="width:100%" /></el-form-item>
        <el-form-item label="班级"><el-select v-model="form.classGroupId" clearable style="width:100%"><el-option v-for="item in classes" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { max-width:1200px; }
.content-card { margin-top:var(--space-4); padding:var(--space-5); background:var(--color-bg-card); border:1px solid var(--color-border-lighter); border-radius:var(--radius-card); }
.toolbar { display:flex; gap:var(--space-2); margin-bottom:var(--space-4); }
.el-pagination { justify-content:flex-end; margin-top:var(--space-4); }
</style>
