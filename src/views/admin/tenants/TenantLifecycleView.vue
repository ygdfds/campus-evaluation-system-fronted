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
  freezeTenantApi,
  getTenantLifecycleApi,
  getTenantPlansApi,
  SYSTEM_STATUS_MAP,
} from '@/api/system'

defineOptions({ name: 'AdminTenantLifecycleView' })

const router = useRouter()
const loading = ref(false)
const tenants = ref([])
const planOptions = ref([])
const planDialogVisible = ref(false)
const currentTenant = ref(null)
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

const viewDetail = (row) => {
  router.push({ name: 'AdminTenantDetail', params: { tenantId: row.tenantId } })
}

const handleTenantCommand = (command, tenant) => {
  const commandMap = {
    plan: openPlanDialog,
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
