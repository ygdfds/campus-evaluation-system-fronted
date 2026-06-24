<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ActionButton from '@/components/admin/ActionButton.vue'
import {
  cancelTenantApi,
  changeTenantPlanApi,
  createTenantApi,
  freezeTenantApi,
  getTenantLifecycleApi,
  getTenantPlansApi,
  resetTenantAdminApi,
  SYSTEM_STATUS_MAP,
} from '@/api/system'

defineOptions({ name: 'AdminTenantLifecycleView' })

const router = useRouter()
const loading = ref(false)
const tenants = ref([])
const planOptions = ref([])
const tenantDialogVisible = ref(false)
const planDialogVisible = ref(false)
const currentTenant = ref(null)
const tenantForm = ref({
  tenantId: '',
  schoolName: '',
  planName: '',
  expireAt: '',
  adminName: '',
})
const planForm = ref({ planName: '' })

const fetchTenants = async () => {
  loading.value = true
  try {
    const response = await getTenantLifecycleApi()
    tenants.value = response.data?.list || []
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  tenantForm.value = { tenantId: '', schoolName: '', planName: '', expireAt: '', adminName: '' }
  tenantDialogVisible.value = true
}

const createTenant = async () => {
  if (!tenantForm.value.tenantId || !tenantForm.value.schoolName || !tenantForm.value.planName) {
    ElMessage.warning('请填写租户 ID、学校名称和套餐')
    return
  }
  await createTenantApi(tenantForm.value)
  ElMessage.success('租户已创建')
  tenantDialogVisible.value = false
  fetchTenants()
}

const openPlanDialog = (row) => {
  currentTenant.value = row
  planForm.value = { planName: row.planName }
  planDialogVisible.value = true
}

const saveTenantPlan = async () => {
  await changeTenantPlanApi(currentTenant.value.tenantId, planForm.value.planName)
  ElMessage.success('套餐已调整')
  planDialogVisible.value = false
  fetchTenants()
}

const freezeTenant = async (row) => {
  try {
    await ElMessageBox.confirm(`确定冻结「${row.schoolName}」租户吗？`, '冻结租户', { type: 'warning' })
    await freezeTenantApi(row.tenantId)
    ElMessage.success('租户已冻结')
    fetchTenants()
  } catch {
    // 用户取消
  }
}

const cancelTenant = async (row) => {
  try {
    await ElMessageBox.confirm(`确定注销「${row.schoolName}」租户吗？`, '注销租户', { type: 'warning' })
    await cancelTenantApi(row.tenantId)
    ElMessage.success('租户已注销')
    fetchTenants()
  } catch {
    // 用户取消
  }
}

const resetAdmin = async (row) => {
  await resetTenantAdminApi(row.tenantId)
  ElMessage.success('学校管理员密码已重置为 admin123')
}

const viewDetail = (row) => {
  router.push({ name: 'AdminTenantDetail', params: { tenantId: row.tenantId } })
}

const handleTenantCommand = (command, tenant) => {
  const commandMap = {
    plan: openPlanDialog,
    reset: resetAdmin,
    freeze: freezeTenant,
    cancel: cancelTenant,
  }
  commandMap[command]?.(tenant)
}

onMounted(() => {
  getTenantPlansApi().then((response) => {
    planOptions.value = response.data?.list || []
  })
  fetchTenants()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="租户生命周期管理" subtitle="全量展示所有入驻学校租户">
      <template #actions>
        <el-button type="primary" @click="openCreateDialog">新建租户</el-button>
      </template>
    </PageHeader>

    <PageSection>
      <el-table :data="tenants" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="tenantId" label="租户ID" width="110" />
        <el-table-column prop="schoolName" label="学校名称" min-width="160" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column prop="expireAt" label="到期时间" width="130" />
        <el-table-column prop="status" label="运行状态" width="110">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column prop="adminName" label="学校管理员" width="130" />
        <el-table-column label="资源配额" min-width="180">
          <template #default="{ row }">
            {{ row.storageQuota }} / 表单 {{ row.formQuota }} / 并发 {{ row.concurrencyQuota }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <div class="tenant-actions">
              <ActionButton variant="subtle" @click="viewDetail(row)">详情</ActionButton>
              <el-dropdown trigger="click" @command="(command) => handleTenantCommand(command, row)">
                <ActionButton variant="subtle" action="warning">
                  更多
                  <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
                </ActionButton>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="plan">套餐调整</el-dropdown-item>
                    <el-dropdown-item command="reset">重置管理员</el-dropdown-item>
                    <el-dropdown-item command="freeze" divided>冻结</el-dropdown-item>
                    <el-dropdown-item command="cancel">注销</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <el-dialog v-model="tenantDialogVisible" title="新建租户" width="520px">
      <el-form :model="tenantForm" label-width="100px">
        <el-form-item label="租户ID" required>
          <el-input v-model="tenantForm.tenantId" placeholder="例：T004" />
        </el-form-item>
        <el-form-item label="学校名称" required>
          <el-input v-model="tenantForm.schoolName" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="套餐" required>
          <el-select v-model="tenantForm.planName" class="full-control">
            <el-option v-for="plan in planOptions" :key="plan.id" :label="plan.planName" :value="plan.planName" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker v-model="tenantForm.expireAt" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="管理员姓名">
          <el-input v-model="tenantForm.adminName" placeholder="请输入管理员姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tenantDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createTenant">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="planDialogVisible" title="套餐升级 / 降级" width="420px">
      <el-form :model="planForm" label-width="90px">
        <el-form-item label="目标套餐" required>
          <el-select v-model="planForm.planName" class="full-control">
            <el-option v-for="plan in planOptions" :key="plan.id" :label="plan.planName" :value="plan.planName" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTenantPlan">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.full-control {
  width: 100%;
}

.tenant-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.dropdown-icon {
  margin-left: var(--space-1);
}
</style>
