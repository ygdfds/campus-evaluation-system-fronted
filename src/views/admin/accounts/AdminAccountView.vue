<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  createSystemAdminApi,
  deleteSystemAdminApi,
  getAdminStatusOptionsApi,
  getSystemAdminsApi,
  resetSystemAdminPasswordApi,
  toggleSystemAdminStatusApi,
  updateSystemAdminApi,
  SYSTEM_STATUS_MAP,
} from '@/api/system'

defineOptions({ name: 'AdminAccountView' })

const loading = ref(false)
const accounts = ref([])
const searchForm = ref({ username: '', realName: '', status: '' })
const statusOptions = ref([])

// Dialog state
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const accountForm = ref({ username: '', password: '', realName: '', email: '', phone: '' })

const fetchAccounts = async () => {
  loading.value = true
  try {
    const response = await getSystemAdminsApi({ ...searchForm.value })
    accounts.value = response.data?.list || []
  } catch (error) {
    console.error('获取账号列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editingId.value = null
  accountForm.value = { username: '', password: '', realName: '', email: '', phone: '' }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  accountForm.value = { username: row.username, password: '', realName: row.realName, email: row.email || '', phone: row.phone || '' }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!accountForm.value.username.trim()) { ElMessage.warning('请输入用户名'); return }
  if (!accountForm.value.realName.trim()) { ElMessage.warning('请输入真实姓名'); return }
  if (!isEdit.value && !accountForm.value.password.trim()) { ElMessage.warning('请输入密码'); return }
  try {
    const payload = {
      username: accountForm.value.username,
      realName: accountForm.value.realName,
      email: accountForm.value.email || null,
      phone: accountForm.value.phone || null
    }
    if (!isEdit.value) {
      if (!accountForm.value.password) { ElMessage.warning('请输入密码'); return }
      payload.password = accountForm.value.password
      await createSystemAdminApi(payload)
      ElMessage.success('新增成功')
    } else {
      delete payload.password
      await updateSystemAdminApi(editingId.value, payload)
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    fetchAccounts()
  } catch (error) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('操作失败')
    }
  }
}

const handleToggleStatus = async (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}管理员「${row.realName}」吗？`, `确认${action}`)
    await toggleSystemAdminStatusApi(row.id)
    ElMessage.success(`已${action}`)
    fetchAccounts()
  } catch { /* cancel or error */ }
}

const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(`确定重置管理员「${row.realName}」的密码吗？新密码将为 admin123`, '确认重置密码', { type: 'warning' })
    await resetSystemAdminPasswordApi(row.id)
    ElMessage.success('密码已重置为 admin123')
  } catch { /* cancel or error */ }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除管理员「${row.realName}」吗？此操作不可恢复。`, '确认删除', { type: 'warning' })
    await deleteSystemAdminApi(row.id)
    ElMessage.success('删除成功')
    fetchAccounts()
  } catch { /* cancel or error */ }
}

onMounted(() => {
  getAdminStatusOptionsApi('binary').then((response) => {
    statusOptions.value = response.data?.list || []
  })
  fetchAccounts()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="平台管理员账号" subtitle="平台后台账号管理与权限分配" />

    <!-- 搜索区域 -->
    <PageSection>
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="搜索用户名" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="searchForm.realName" placeholder="搜索姓名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAccounts">查询</el-button>
          <el-button @click="searchForm = { username: '', realName: '', status: '' }; fetchAccounts()">重置</el-button>
        </el-form-item>
      </el-form>
    </PageSection>

    <!-- 操作按钮 + 表格 -->
    <PageSection>
      <el-button type="primary" class="section-actions" @click="openAddDialog">新增账号</el-button>

      <el-table :data="accounts" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="username" label="账号" min-width="150" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" :type="row.status === 'active' ? 'danger' : 'success'" link @click="handleToggleStatus(row)">
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="warning" link @click="handleResetPassword(row)">重置密码</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账号' : '新增账号'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="accountForm.username" :disabled="isEdit" placeholder="例：zhangsan" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" required>
          <el-input v-model="accountForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="真实姓名" required>
          <el-input v-model="accountForm.realName" placeholder="例：张三" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="accountForm.email" placeholder="example@email.com" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="accountForm.phone" placeholder="手机号码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-actions { margin-bottom: var(--space-4); }
</style>
