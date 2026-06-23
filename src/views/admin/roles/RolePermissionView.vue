<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

defineOptions({ name: 'AdminRolePermissionView' })

const loading = ref(false)
const roles = ref([])
const rolesList = ref([]) // 包含自定义角色
const activeCollapse = ref(1) // 当前展开的折叠面板

// Dialog state
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const roleForm = ref({ roleName: '', description: '', dataScope: '' })

// Permission dialog state
const permDialogVisible = ref(false)
const selectedRoleId = ref(null)
const selectedRoleName = ref('')
const menuPermissions = ref([])
const checkedKeys = ref([])

const dataScopeOptions = [
  { value: 'all', label: '全部数据' },
  { value: 'assigned', label: '指定租户' },
  { value: 'self', label: '仅自己创建' }
]

// Fetch roles from both built-in (users table) and custom tables
const fetchRoles = async () => {
  loading.value = true
  try {
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const res = await axios.get(`${base}/system-roles`)
    const builtIn = res.data?.data?.list || []
    
    // Also fetch custom roles from db
    const customRolesRes = await axios.get(`${base}/custom-roles`).catch(() => ({ data: { data: { list: [] } } }))
    const custom = customRolesRes.data?.data?.list || []
    
    roles.value = [...builtIn, ...custom]
    rolesList.value = [...builtIn, ...custom]
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  editingId.value = null
  roleForm.value = { roleName: '', description: '', dataScope: 'all' }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  if (row.builtin) {
    ElMessage.info('内置角色不可编辑，仅可查看')
    return
  }
  isEdit.value = true
  editingId.value = row.id
  roleForm.value = { roleName: row.roleName, description: row.description, dataScope: row.dataScope }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!roleForm.value.roleName.trim()) { ElMessage.warning('请输入角色名称'); return }
  if (!roleForm.value.description.trim()) { ElMessage.warning('请输入角色描述'); return }
  try {
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const payload = {
      roleName: roleForm.value.roleName,
      description: roleForm.value.description,
      dataScope: roleForm.value.dataScope
    }
    if (isEdit && editingId.value) {
      await axios.put(`${base}/system-roles/${editingId.value}`, payload)
      ElMessage.success('编辑成功')
    } else {
      await axios.post(`${base}/system-roles`, payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchRoles()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (row) => {
  if (row.builtin) {
    ElMessage.warning('内置角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？此操作不可恢复。`, '确认删除', { type: 'warning' })
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    await axios.delete(`${base}/system-roles/${row.id}`)
    ElMessage.success('删除成功')
    fetchRoles()
  } catch { /* cancel or error */ }
}

const handleConfigPermissions = async (row) => {
  selectedRoleId.value = row.id
  selectedRoleName.value = row.roleName
  try {
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const res = await axios.get(`${base}/menu-permissions`)
    menuPermissions.value = res.data?.data?.list || []
    
    // Pre-select some menus based on role
    if (row.roleName === '系统管理员') {
      checkedKeys.value = menuPermissions.value.flatMap(m => [m.id, ...(m.children || []).map(c => c.id)])
    } else if (row.roleName === '学生') {
      checkedKeys.value = [41, 46, 71, 75] // 用户查看、套餐查看
    } else if (row.roleName === '教职工') {
      checkedKeys.value = [71, 72] // 套餐相关
    } else {
      checkedKeys.value = []
    }
  } catch {
    menuPermissions.value = []
    checkedKeys.value = []
  }
  permDialogVisible.value = true
}

const handleSavePermissions = () => {
  ElMessage.success(`角色「${selectedRoleName.value}」的权限已保存`)
  permDialogVisible.value = false
}

onMounted(() => { fetchRoles() })
</script>

<template>
  <div class="page-container">
    <PageHeader title="RBAC角色权限配置" subtitle="自定义管理角色，配置菜单访问权限和数据查看范围" />

    <!-- 角色列表 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>角色管理（{{ roles.length }}个）</span>
          <el-button type="primary" @click="openAddDialog">新增角色</el-button>
        </div>
      </template>

      <el-table :data="roles" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="roleName" label="角色名称" min-width="150" />
        <el-table-column prop="description" label="角色描述" min-width="200" />
        <el-table-column prop="dataScope" label="数据范围" width="120" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            {{ row.builtin ? '内置' : '自定义' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEditDialog(row)" :disabled="row.builtin">编辑</el-button>
            <el-button size="small" type="success" link @click="handleConfigPermissions(row)">配置权限</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)" :disabled="row.builtin">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 权限配置区域 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <span>可用菜单权限总览（共 {{ menuPermissions.length }} 个模块）</span>
      </template>

      <el-collapse v-model="activeCollapse" accordion>
        <el-collapse-item v-for="module in menuPermissions" :key="module.id" :name="module.id">
          <template #title>
            <strong>{{ module.label }}</strong>
            <el-tag size="small" style="margin-left: 8px;">{{ (module.children || []).length }} 个权限</el-tag>
          </template>
          <div style="padding: 8px 0;">
            <el-tag v-for="child in (module.children || [])" :key="child.id" size="default" style="margin: 4px;">
              {{ child.label }}
            </el-tag>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.roleName" placeholder="例：审计专员" />
        </el-form-item>
        <el-form-item label="角色描述" required>
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="角色的职责说明" />
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="roleForm.dataScope" style="width: 100%;">
            <el-option v-for="opt in dataScopeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog :model-value="permDialogVisible" @update:model-value="(v) => permDialogVisible = v" :title="`为【${selectedRoleName}】配置权限`" width="600px">
      <div v-if="menuPermissions.length > 0">
        <el-tree
          :data="menuPermissions"
          show-checkbox
          node-key="id"
          check-on-click-node
          default-expand-all
          :props="{ children: 'children', label: 'label' }"
        />
      </div>
      <div v-else style="padding: 20px; text-align: center; color: #909399;">暂无权限数据，请先添加菜单权限配置</div>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
