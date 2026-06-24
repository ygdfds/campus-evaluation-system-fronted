<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  createTenantPlanApi,
  deleteTenantPlanApi,
  getAdminStatusOptionsApi,
  getPlanPermissionModulesApi,
  getTenantPlansApi,
  updateTenantPlanApi,
  SYSTEM_STATUS_MAP,
} from '@/api/system'

defineOptions({ name: 'AdminPlanManagementView' })

const loading = ref(false)
const plans = ref([])
const searchForm = ref({ planName: '', status: '' })
const statusOptions = ref([])

// Dialog state
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const planForm = ref({
  planName: '',
  features: '',
  maxUsers: 500,
  storageLimit: 100,
  durationDays: 365,
  price: 0,
})

// Permission dialog state
const permDialogVisible = ref(false)
const selectedPlanName = ref('')
const permissionModules = ref([])

const fetchPlans = async () => {
  loading.value = true
  try {
    const response = await getTenantPlansApi({ ...searchForm.value })
    plans.value = response.data?.list || []
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  planForm.value = { planName: '', features: '', maxUsers: 500, storageLimit: 100, durationDays: 365, price: 0 }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  planForm.value = {
    planName: row.planName,
    features: row.description,
    maxUsers: parseInt(row.duration) || 500,
    storageLimit: row.storageLimit || 100,
    durationDays: row.durationDays || 365,
    price: Number(row.price.replace(/\D/g, '')) || 0,
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!planForm.value.planName.trim()) { ElMessage.warning('请输入套餐名称'); return }
  if (!planForm.value.features.trim()) { ElMessage.warning('请输入套餐描述'); return }
  try {
    if (isEdit.value && editingId.value) {
      await updateTenantPlanApi(editingId.value, planForm.value)
      ElMessage.success('编辑成功')
    } else {
      await createTenantPlanApi(planForm.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchPlans()
  } catch {
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
    await deleteTenantPlanApi(row.id)
    ElMessage.success('下架成功')
    fetchPlans()
  } catch { /* cancel or error */ }
}

const initOptions = async () => {
  const [statusResponse, permissionResponse] = await Promise.all([
    getAdminStatusOptionsApi('plan'),
    getPlanPermissionModulesApi(),
  ])
  statusOptions.value = statusResponse.data?.list || []
  permissionModules.value = permissionResponse.data?.list || []
}

const savePermissions = () => {
  ElMessage.success('权限配置已保存')
  permDialogVisible.value = false
}

onMounted(() => {
  initOptions()
  fetchPlans()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="平台套餐管理" subtitle="套餐（基础 / 专业 / 定制）新增、编辑、下架" />

    <PageSection>
      <div class="section-actions">
        <el-button type="primary" @click="openAddDialog">新增套餐</el-button>
      </div>

      <el-table :data="plans" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="planName" label="套餐名称" min-width="150" />
        <el-table-column prop="description" label="套餐描述" min-width="200" />
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="duration" label="使用人数" width="120" />
        <el-table-column label="资源上限" width="120">
          <template #default="{ row }">
            {{ row.storageLimit || 100 }}GB
          </template>
        </el-table-column>
        <el-table-column label="使用时长" width="120">
          <template #default="{ row }">
            {{ row.durationDays || 365 }}天
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
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
    </PageSection>

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
          <span class="form-hint">-1 = 不限</span>
        </el-form-item>
        <el-form-item label="存储上限(GB)">
          <el-input-number v-model="planForm.storageLimit" :min="1" :max="99999" controls-position="right" />
        </el-form-item>
        <el-form-item label="使用时长(天)">
          <el-input-number v-model="planForm.durationDays" :min="1" :max="3650" controls-position="right" />
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
      <p class="dialog-tip">当前为套餐 <strong>{{ selectedPlanName }}</strong> 配置以下菜单的访问权限：</p>
      <div class="permission-list">
        <el-checkbox
          v-for="module in permissionModules"
          :key="module.id"
          v-model="module.checked"
          :disabled="module.disabled"
          class="permission-item"
        >
          {{ module.title }}（{{ module.description }}）
        </el-checkbox>
      </div>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-actions { margin-bottom: var(--space-3); }
.form-hint {
  margin-left: var(--space-3);
  color: var(--color-text-placeholder);
  font-size: var(--font-xs);
}
.dialog-tip {
  margin-bottom: var(--space-3);
  color: var(--color-text-regular);
}
.permission-list {
  max-height: 400px;
  overflow-y: auto;
  border: var(--border-light);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
}
.permission-item {
  display: flex;
  padding: var(--space-2) 0;
}
</style>
