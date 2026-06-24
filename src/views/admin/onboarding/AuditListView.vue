<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ActionButton from '@/components/admin/ActionButton.vue'
import {
  getAdminStatusOptionsApi,
  getOnboardingMaterialsApi,
  getOnboardingApplicationsApi,
  getTenantPlansApi,
  auditOnboardingApi,
  SYSTEM_STATUS_MAP,
} from '@/api/system'

const statusOptions = ref([])
const planOptions = ref([])
const materialDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const currentApplication = ref(null)
const currentAction = ref('')
const materials = ref([])
const auditForm = ref({
  reason: '',
  planId: '',
})

// 筛选条件（默认显示待审核）
const searchForm = ref({
  schoolName: '',
  status: 'pending',
  startTime: '',
  endTime: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm.value,
      page: 1,
      pageSize: 10
    }
    const response = await getOnboardingApplicationsApi(params)
    tableData.value = response.data?.list || []
  } catch {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const openAuditDialog = (row, action) => {
  currentApplication.value = row
  currentAction.value = action
  auditForm.value = {
    reason: '',
    planId: row.planId || '',
  }
  auditDialogVisible.value = true
}

const submitAudit = async () => {
  if (!auditForm.value.reason.trim()) {
    ElMessage.warning('请输入审核意见')
    return
  }
  if (currentAction.value === 'approved' && !auditForm.value.planId) {
    ElMessage.warning('请选择分配套餐')
    return
  }
  try {
    await auditOnboardingApi(
      currentApplication.value.id,
      currentAction.value,
      auditForm.value.reason,
      auditForm.value.planId
    )
    ElMessage.success('审核成功')
    auditDialogVisible.value = false
    fetchData()
  } catch {
    ElMessage.error('审核失败')
  }
}

// 查看材料
const handleViewMaterials = async (row) => {
  currentApplication.value = row
  const response = await getOnboardingMaterialsApi(row.id)
  materials.value = response.data?.list || []
  materialDialogVisible.value = true
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    schoolName: '',
    status: '',
    startTime: '',
    endTime: ''
  }
  fetchData()
}

onMounted(() => {
  Promise.all([
    getAdminStatusOptionsApi('onboarding'),
    getTenantPlansApi(),
  ]).then(([statusResponse, planResponse]) => {
    statusOptions.value = statusResponse.data?.list || []
    planOptions.value = planResponse.data?.list || []
  })
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="入驻审核" subtitle="审核学校入驻申请" />
    
    <!-- 搜索区域 -->
    <PageSection>
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="学校名称">
          <el-input v-model="searchForm.schoolName" placeholder="请输入学校名称" clearable />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="searchForm.startTime"
            type="date"
            placeholder="开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="">
          <el-date-picker
            v-model="searchForm.endTime"
            type="date"
            placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </PageSection>

    <!-- 表格区域 -->
    <PageSection>
      <el-table :data="tableData" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="schoolName" label="学校名称" min-width="150" />
        <el-table-column prop="contactName" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="120" />
        <el-table-column prop="planName" label="申请套餐" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <ActionButton @click="handleViewMaterials(row)">
              查看材料
            </ActionButton>
            <ActionButton
              v-if="row.status === 'pending'"
              action="warning"
              @click="openAuditDialog(row, 'approved')"
            >
              通过
            </ActionButton>
            <ActionButton
              v-if="row.status === 'pending'"
              action="danger"
              @click="openAuditDialog(row, 'rejected')"
            >
              驳回
            </ActionButton>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <el-dialog v-model="materialDialogVisible" title="申请材料" width="640px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="学校名称">{{ currentApplication?.schoolName }}</el-descriptions-item>
        <el-descriptions-item label="统一信用代码">{{ currentApplication?.creditCode }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentApplication?.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentApplication?.contactPhone }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="materials" class="dialog-table" stripe>
        <el-table-column prop="fileName" label="材料名称" min-width="180" />
        <el-table-column prop="fileSize" label="文件大小" width="100" />
        <el-table-column prop="uploadedAt" label="上传时间" width="170" />
        <el-table-column label="操作" width="120">
          <template #default>
            <ActionButton>预览</ActionButton>
            <ActionButton>下载</ActionButton>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="auditDialogVisible" :title="currentAction === 'approved' ? '审核通过' : '审核驳回'" width="520px">
      <el-form :model="auditForm" label-width="90px">
        <el-form-item v-if="currentAction === 'approved'" label="分配套餐" required>
          <el-select v-model="auditForm.planId" class="full-control" placeholder="请选择套餐">
            <el-option v-for="plan in planOptions" :key="plan.id" :label="plan.planName" :value="plan.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见" required>
          <el-input v-model="auditForm.reason" type="textarea" :rows="4" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
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
.dialog-table {
  margin-top: var(--space-4);
}
.full-control {
  width: 100%;
}
</style>
