<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import {
  getOnboardingApplicationsApi,
  auditOnboardingApi
} from '@/api/system'

// 状态映射
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' }
]

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
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 审核操作
const handleAudit = async (row, action) => {
  try {
    const reason = await ElMessageBox.prompt(
      '请输入审核意见：',
      action === 'approved' ? '审核通过' : '审核驳回',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入审核意见',
        inputValidator: (value) => {
          if (!value) return '审核意见不能为空'
        }
      }
    )
    
    await auditOnboardingApi(row.id, action, reason.value)
    ElMessage.success('审核成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核失败')
    }
  }
}

// 查看材料
const handleViewMaterials = (row) => {
  // TODO: 实现材料预览功能
  ElMessage.info('查看材料功能待实现')
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
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <PageHeader title="入驻审核" subtitle="审核学校入驻申请" />
    
    <!-- 搜索区域 -->
    <el-card shadow="hover" class="section-card">
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
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" class="section-card">
      <el-table :data="tableData" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="schoolName" label="学校名称" min-width="150" />
        <el-table-column prop="contactName" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="120" />
        <el-table-column prop="planName" label="申请套餐" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              link 
              @click="handleViewMaterials(row)"
            >
              查看材料
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              size="small" 
              type="success" 
              link 
              @click="handleAudit(row, 'approved')"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              size="small" 
              type="danger" 
              link 
              @click="handleAudit(row, 'rejected')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}
.section-card { 
  border-radius: var(--radius-lg); 
}
</style>