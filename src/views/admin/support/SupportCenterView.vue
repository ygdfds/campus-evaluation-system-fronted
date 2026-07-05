<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ActionButton from '@/components/admin/ActionButton.vue'
import {
  createHelpDocumentApi,
  getHelpDocumentsApi,
  getSupportTicketsApi,
  SYSTEM_STATUS_MAP,
  updateHelpDocumentApi,
  updateSupportTicketApi,
} from '@/api/system'

defineOptions({ name: 'AdminSupportCenterView' })

// 搜索表单
const searchForm = ref({
  schoolName: '',
  ticketStatus: '',
  startTime: '',
  endTime: ''
})

// 工单数据
const tickets = ref([])
const documents = ref([])
const loading = ref(false)
const documentLoading = ref(false)
const replyDialogVisible = ref(false)
const documentDialogVisible = ref(false)
const currentTicket = ref(null)
const currentDocument = ref(null)
const replyForm = ref({ content: '' })
const documentForm = ref({
  title: '',
  category: '',
  status: 'draft',
})

// 获取工单列表
const fetchTickets = async () => {
  loading.value = true
  try {
    const response = await getSupportTicketsApi(searchForm.value)
    tickets.value = response.data?.list || []
  } finally {
    loading.value = false
  }
}

const fetchDocuments = async () => {
  documentLoading.value = true
  try {
    const response = await getHelpDocumentsApi()
    documents.value = response.data?.list || []
  } finally {
    documentLoading.value = false
  }
}

const openReplyDialog = (row) => {
  currentTicket.value = row
  replyForm.value = { content: '' }
  replyDialogVisible.value = true
}

const submitReply = async () => {
  if (!replyForm.value.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  if (!currentTicket.value) return
  const response = await updateSupportTicketApi(currentTicket.value.id, { status: 'processing' })
  Object.assign(currentTicket.value, response.data)
  ElMessage.success('工单回复已发送')
  replyDialogVisible.value = false
}

const closeTicket = async (row) => {
  const response = await updateSupportTicketApi(row.id, { status: 'closed' })
  Object.assign(row, response.data)
  ElMessage.success('工单已关闭')
}

const openDocumentDialog = () => {
  currentDocument.value = null
  documentForm.value = {
    title: '',
    category: '',
    status: 'draft',
  }
  documentDialogVisible.value = true
}

const openEditDocumentDialog = (row) => {
  currentDocument.value = row
  documentForm.value = {
    title: row.title,
    category: row.category,
    status: row.status,
  }
  documentDialogVisible.value = true
}

const saveDocument = async () => {
  if (!documentForm.value.title.trim()) {
    ElMessage.warning('请输入文档标题')
    return
  }
  if (!documentForm.value.category.trim()) {
    ElMessage.warning('请输入文档分类')
    return
  }
  if (currentDocument.value) {
    const response = await updateHelpDocumentApi(currentDocument.value.id, documentForm.value)
    Object.assign(currentDocument.value, response.data)
    ElMessage.success('帮助文档已更新')
  } else {
    const response = await createHelpDocumentApi(documentForm.value)
    documents.value.unshift(response.data)
    ElMessage.success('帮助文档已新增')
  }
  documentDialogVisible.value = false
}

const toggleDocumentStatus = async (row, status) => {
  const response = await updateHelpDocumentApi(row.id, { status })
  Object.assign(row, response.data)
  ElMessage.success('文档状态已更新')
}

onMounted(() => {
  fetchTickets()
  fetchDocuments()
})
</script>

<template>
  <div class="page-container">
    <PageHeader 
      title="工单与帮助中心" 
      subtitle="租户咨询工单处理与平台帮助文档管理" 
    />
    
    <!-- 工单管理 -->
    <PageSection>
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
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ActionButton @click="openReplyDialog(row)">
              回复
            </ActionButton>
            <ActionButton action="danger" @click="closeTicket(row)">
              关闭
            </ActionButton>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <!-- 帮助文档管理 -->
    <PageSection>
      <template #header>
        <div class="card-header">
          <span>平台帮助文档</span>
          <el-button type="primary" @click="openDocumentDialog">新增文档</el-button>
        </div>
      </template>
      
      <el-table :data="documents" stripe style="width: 100%" :loading="documentLoading">
        <el-table-column prop="title" label="文档标题" min-width="200" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ActionButton @click="openEditDocumentDialog(row)">
              编辑
            </ActionButton>
            <ActionButton action="warning" @click="toggleDocumentStatus(row, 'published')">
              上线
            </ActionButton>
            <ActionButton action="danger" @click="toggleDocumentStatus(row, 'archived')">
              下线
            </ActionButton>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <el-dialog v-model="replyDialogVisible" title="回复工单" width="520px">
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="工单">
          <span>{{ currentTicket?.title }}</span>
        </el-form-item>
        <el-form-item label="回复内容" required>
          <el-input v-model="replyForm.content" type="textarea" :rows="4" placeholder="请输入回复内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">发送</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="documentDialogVisible" :title="currentDocument ? '编辑帮助文档' : '新增帮助文档'" width="520px">
      <el-form :model="documentForm" label-width="90px">
        <el-form-item label="文档标题" required>
          <el-input v-model="documentForm.title" placeholder="请输入文档标题" clearable />
        </el-form-item>
        <el-form-item label="文档分类" required>
          <el-input v-model="documentForm.category" placeholder="例如：入驻配置、业务操作" clearable />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="documentForm.status" placeholder="请选择状态">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="documentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDocument">保存</el-button>
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
