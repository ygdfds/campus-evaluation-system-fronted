<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'

defineOptions({ name: 'AdminPlanManagementView' })

const loading = ref(false)
const plans = ref([])
const searchForm = ref({ planName: '', status: '' })
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用中' },
  { value: 'inactive', label: '已下架' }
]

// Dialog state
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const planForm = ref({ planName: '', features: '', maxUsers: 500, price: 0 })

// Permission dialog state
const permDialogVisible = ref(false)
const selectedPlanName = ref('')

const fetchPlans = async () => {
  loading.value = true
  try {
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const res = await axios.get(`${base}/tenant-plans`, { params: { ...searchForm.value } })
    plans.value = res.data?.data?.list || []
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  planForm.value = { planName: '', features: '', maxUsers: 500, price: 0 }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  planForm.value = { planName: row.planName, features: row.description, maxUsers: parseInt(row.duration) || 500, price: Number(row.price.replace(/\D/g, '')) || 0 }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!planForm.value.planName.trim()) { ElMessage.warning('请输入套餐名称'); return }
  if (!planForm.value.features.trim()) { ElMessage.warning('请输入套餐描述'); return }
  try {
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    if (isEdit && editingId.value) {
      await axios.put(`${base}/tenant-plans/${editingId.value}`, planForm.value)
      ElMessage.success('编辑成功')
    } else {
      await axios.post(`${base}/tenant-plans`, planForm.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchPlans()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleConfigPermissions = (row) => {
  selectedPlanName.value = row.planName
  permDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定下架套餐「${row.planName}」吗？`, '确认下架', { type: 'warning' })
    const { default: axios } = await import('axios')
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    await axios.delete(`${base}/tenant-plans/${row.id}`)
    ElMessage.success('下架成功')
    fetchPlans()
  } catch { /* cancel or error */ }
}

onMounted(() => { fetchPlans() })
</script>

<template>
  <div class="page-container">
    <PageHeader title="平台套餐管理" subtitle="套餐（基础 / 专业 / 定制）新增、编辑、下架" />

    <el-card shadow="hover" class="section-card">
      <div style="margin-bottom: 12px;">
        <el-button type="primary" @click="openAddDialog">新增套餐</el-button>
      </div>

      <el-table :data="plans" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="planName" label="套餐名称" min-width="150" />
        <el-table-column prop="description" label="套餐描述" min-width="200" />
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="duration" label="使用人数" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="success" link @click="handleConfigPermissions(row)">配置权限</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">下架</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套餐' : '新增套餐'" width="520px">
      <el-form label-width="100px">
        <el-form-item label="套餐名称" required>
          <el-input v-model="planForm.planName" placeholder="例：旗舰版" />
        </el-form-item>
        <el-form-item label="套餐描述" required>
          <el-input v-model="planForm.features" type="textarea" :rows="4" placeholder="套餐功能描述" />
        </el-form-item>
        <el-form-item label="最大人数">
          <el-input-number v-model="planForm.maxUsers" :min="-1" :max="99999" controls-position="right" />
          <span style="margin-left: 12px; color: #909399; font-size: 12px;">-1 = 不限</span>
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="planForm.price" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog :model-value="permDialogVisible" @update:model-value="(v) => permDialogVisible = v" title="菜单权限配置" width="580px">
      <p style="margin-bottom: 12px; color: #606266;">当前为套餐 <strong>{{ selectedPlanName }}</strong> 配置以下菜单的访问权限：</p>
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e4e7ed; border-radius: 4px; padding: 12px;">
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked disabled> 平台概览（查看、刷新）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked disabled> 租户管理（查看列表、查看套餐、编辑、分配）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked disabled> 入驻审核（查看所有申请、审核通过、审核驳回、查看材料）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked disabled> 用户管理（查看列表、新增账号、编辑账号、启用/禁用、重置密码、删除）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked disabled> 角色管理（查看列表、新增角色、编辑角色、配置权限、删除）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked disabled> 系统设置（查看、编辑、重置配置）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" checked> 套餐管理（查看列表、编辑套餐、下架套餐、创建套餐、配置权限）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" disabled> 监控中心（只读）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" disabled> 报表中心（查看、导出）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" disabled> 凭证管理（只读）</label>
        <label style="display: block; padding: 6px 0; cursor: pointer;"><input type="checkbox" disabled> 客服支持（查看工单、回复反馈）</label>
      </div>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="ElMessage.success('权限配置已保存'); permDialogVisible = false">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
