<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'

defineOptions({ name: 'AdminCredentialListView' })

// 状态管理
const loading = ref(false)
const credentials = ref([])

// 搜索表单
const searchForm = ref({
  schoolName: '',
  credentialType: '',
  status: '',
  expirationDate: ''
})

// 证件类型选项（从常量获取，避免硬编码）
const credentialTypes = [
  { value: 'business_license', label: '营业执照' },
  { value: 'school_permit', label: '办学许可' },
  { value: 'legal_person_id', label: '法人身份证' }
]

// 状态选项
const statusOptions = [
  { value: 'valid', label: '有效' },
  { value: 'expired', label: '已过期' },
  { value: 'pending', label: '待审核' },
  { value: 'revoked', label: '已撤销' }
]

// 获取证件列表
const fetchCredentials = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    // const res = await getCredentialListApi(searchForm.value)
    // credentials.value = res.data
  } finally {
    loading.value = false
  }
}

// 预览证件
const previewCredential = (credential) => {
  // TODO: 实现预览逻辑
}

// 下载证件
const downloadCredential = (credential) => {
  // TODO: 实现下载逻辑
}

// 配置有效期
const configureExpiration = (credential) => {
  // TODO: 实现配置有效期逻辑
}

// 续期操作
const renewCredential = (credential) => {
  // TODO: 实现续期逻辑
}

// 撤销授权
const revokeCredential = (credential) => {
  // TODO: 实现撤销授权逻辑
}

onMounted(() => {
  fetchCredentials()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="证件材料授权管理" 
      subtitle="统一管理各校上传的营业执照、办学许可、法人身份证" 
    />
    
    <!-- 搜索区域 -->
    <el-card shadow="hover" class="section-card">
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="学校名称">
          <el-input v-model="searchForm.schoolName" placeholder="请输入学校名称" clearable />
        </el-form-item>
        <el-form-item label="证件类型">
          <el-select v-model="searchForm.credentialType" placeholder="请选择证件类型" clearable>
            <el-option
              v-for="item in credentialTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="授权状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="searchForm.expirationDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchCredentials">查询</el-button>
          <el-button @click="searchForm = { schoolName: '', credentialType: '', status: '', expirationDate: '' }">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="section-card">
      <el-table 
        :data="credentials" 
        stripe 
        style="width: 100%"
        :loading="loading"
      >
        <el-table-column prop="schoolName" label="学校名称" min-width="150" />
        <el-table-column prop="credentialType" label="证件类型" width="120">
          <template #default="{ row }">
            <span>{{ credentialTypes.find(t => t.value === row.credentialType)?.label || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="180" />
        <el-table-column prop="uploadTime" label="上传时间" width="160" />
        <el-table-column prop="expirationDate" label="有效期至" width="120" />
        <el-table-column prop="status" label="授权状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              plain 
              @click="previewCredential(row)"
            >
              预览
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              plain 
              @click="downloadCredential(row)"
            >
              下载
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              plain 
              @click="configureExpiration(row)"
            >
              配置有效期
            </el-button>
            <el-button 
              v-if="row.status === 'valid'"
              size="small" 
              type="info" 
              plain 
              @click="renewCredential(row)"
            >
              续期
            </el-button>
            <el-button 
              v-if="row.status !== 'revoked'"
              size="small" 
              type="danger" 
              plain 
              @click="revokeCredential(row)"
            >
              撤销
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