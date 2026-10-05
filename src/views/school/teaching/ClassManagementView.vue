<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { getClassListApi, createClassApi, updateClassApi, deleteClassApi, getTeachingOrgOptionsApi } from '@/api/schoolTeaching'

defineOptions({ name: 'ClassManagementView' })
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const keyword = ref('')
const orgs = ref([])
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({ teachingOrgId: null, gradeName: '', className: '', status: 'active' })

async function load() {
  loading.value = true
  try {
    const result = await getClassListApi({ keyword: keyword.value, pageNum: page.value, pageSize: 20 })
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
  form.value = { teachingOrgId: null, gradeName: '', className: '', status: 'active' }
  dialogVisible.value = true
}
async function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  dialogVisible.value = true
}
async function save() {
  if (!form.value.teachingOrgId || !form.value.className) return ElMessage.warning('请填写教学组织和班级名称')
  try {
    if (editing.value) await updateClassApi(editing.value.id, form.value)
    else await createClassApi(form.value)
    ElMessage.success('班级已保存')
    dialogVisible.value = false
    await load()
  } catch {}
}
async function remove(row) {
  try {
    await ElMessageBox.confirm('存在选课关联的班级不能删除，确认继续？', '确认删除', { type: 'warning' })
    await deleteClassApi(row.id)
    ElMessage.success('班级已删除')
    await load()
  } catch {}
}
onMounted(async () => {
  orgs.value = await getTeachingOrgOptionsApi().catch(() => [])
  await load()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="班级管理" description="维护班级、年级和所属教学组织。">
      <template #actions><el-button type="primary" @click="openCreate">新增班级</el-button></template>
    </PageHeader>
    <div class="content-card">
      <div class="toolbar">
        <el-input v-model="keyword" clearable placeholder="搜索班级名称" style="max-width: 320px" @keyup.enter="page = 1; load()" @clear="page = 1; load()" />
        <el-button @click="load">查询</el-button>
      </div>
      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column prop="className" label="班级名称" min-width="180" />
        <el-table-column prop="teachingOrgId" label="教学组织" width="120" />
        <el-table-column prop="gradeName" label="年级" width="120" />
        <el-table-column prop="status" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="160"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-button link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
        <template #empty><el-empty description="暂无班级数据" /></template>
      </el-table>
      <el-pagination v-model:current-page="page" :total="total" layout="total, prev, pager, next" @current-change="load" />
    </div>
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑班级' : '新增班级'" width="500px">
      <el-form label-position="top">
        <el-form-item label="教学组织"><el-select v-model="form.teachingOrgId" style="width:100%"><el-option v-for="item in orgs" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="年级"><el-input v-model="form.gradeName" /></el-form-item>
        <el-form-item label="班级名称"><el-input v-model="form.className" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status"><el-option label="启用" value="active" /><el-option label="停用" value="disabled" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { max-width: 1200px; }
.content-card { margin-top: var(--space-4); padding: var(--space-5); background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); }
.toolbar { display:flex; gap:var(--space-2); margin-bottom:var(--space-4); }
.el-pagination { justify-content:flex-end; margin-top:var(--space-4); }
</style>
