<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getAuditLogsApi, getOperationTypeOptionsApi } from '@/api/system'

defineOptions({ name: 'AdminAuditLogView' })

const operationTypes = ref([])

// 搜索表单
const searchForm = ref({
  operatorName: '',
  schoolName: '',
  operationType: '',
  startTime: '',
  endTime: ''
})

// 审计日志数据
const auditLogs = ref([])
const loading = ref(false)

// 获取审计日志
const fetchAuditLogs = async () => {
  loading.value = true
  try {
    const response = await getAuditLogsApi(searchForm.value)
    auditLogs.value = response.data?.list || []
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.value = { operatorName: '', schoolName: '', operationType: '', startTime: '', endTime: '' }
  fetchAuditLogs()
}

const exportLogs = () => {
  ElMessage.success('审计日志已导出')
}

onMounted(() => {
  getOperationTypeOptionsApi().then((response) => {
    operationTypes.value = response.data?.list || []
  })
  fetchAuditLogs()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="全局操作审计日志" 
      subtitle="记录所有平台管理员操作、租户变更操作" 
    />
    
    <!-- 搜索区域 -->
    <PageSection>
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operatorName" placeholder="请输入操作人姓名" clearable />
        </el-form-item>
        <el-form-item label="学校名称">
          <el-input v-model="searchForm.schoolName" placeholder="请输入学校名称" clearable />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operationType" placeholder="请选择操作类型" clearable>
            <el-option
              v-for="item in operationTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
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
          <el-button type="primary" @click="fetchAuditLogs">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="exportLogs">导出</el-button>
        </el-form-item>
      </el-form>
    </PageSection>

    <!-- 数据表格 -->
    <PageSection>
      <el-table :data="auditLogs" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="schoolName" label="关联学校" min-width="150" />
        <el-table-column prop="operationType" label="操作类型" min-width="150" />
        <el-table-column prop="description" label="操作描述" min-width="250" />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="160" />
      </el-table>
    </PageSection>
  </div>
</template>

<style scoped>
.page-container { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-5); 
}

</style>
