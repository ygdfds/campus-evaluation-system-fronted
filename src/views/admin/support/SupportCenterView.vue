<script setup>
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'

defineOptions({ name: 'AdminSupportCenterView' })

// 工单状态选项
const ticketStatusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' }
]

// 文档状态选项
const docStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'archived', label: '已归档' }
]

// 搜索表单
const searchForm = ref({
  schoolName: '',
  ticketStatus: '',
  startTime: '',
  endTime: ''
})

// 工单数据
const tickets = ref([])
const loading = ref(false)

// 获取工单列表
const fetchTickets = () => {
  // TODO: 调用API获取工单数据
}

onMounted(() => {
  fetchTickets()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="工单与帮助中心" 
      subtitle="租户咨询工单处理与平台帮助文档管理" 
    />
    
    <!-- 工单管理 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>租户咨询工单</span>
        </div>
      </template>
      
      <el-table :data="tickets" stripe style="width: 100%" :loading="loading">
        <el-table-column prop="ticketId" label="工单ID" width="120" />
        <el-table-column prop="schoolName" label="学校名称" min-width="150" />
        <el-table-column prop="title" label="工单标题" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>
              回复
            </el-button>
            <el-button size="small" type="success" link>
              关闭
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 帮助文档管理 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>平台帮助文档</span>
          <el-button type="primary">新增文档</el-button>
        </div>
      </template>
      
      <el-table :data="[]" stripe style="width: 100%">
        <el-table-column prop="title" label="文档标题" min-width="200" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>
              编辑
            </el-button>
            <el-button size="small" type="success" link>
              上线
            </el-button>
            <el-button size="small" type="danger" link>
              下线
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>