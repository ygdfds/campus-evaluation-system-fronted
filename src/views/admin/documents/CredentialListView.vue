<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ActionButton from '@/components/admin/ActionButton.vue'
import {
  getAdminStatusOptionsApi,
  getCredentialListApi,
  getCredentialTypeOptionsApi,
  SYSTEM_STATUS_MAP,
} from '@/api/system'

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

const credentialTypes = ref([])
const statusOptions = ref([])
const previewDialogVisible = ref(false)
const expirationDialogVisible = ref(false)
const currentCredential = ref(null)
const expirationForm = ref({ expirationDate: '' })

// 获取证件列表
const fetchCredentials = async () => {
  loading.value = true
  try {
    const response = await getCredentialListApi(searchForm.value)
    credentials.value = response.data?.list || []
  } finally {
    loading.value = false
  }
}

const resolveCredentialTypeLabel = (type) => {
  return credentialTypes.value.find((item) => item.value === type)?.label || '-'
}

const resetSearch = () => {
  searchForm.value = { schoolName: '', credentialType: '', status: '', expirationDate: '' }
  fetchCredentials()
}

// 预览证件
const previewCredential = (credential) => {
  currentCredential.value = credential
  previewDialogVisible.value = true
}

// 下载证件
const downloadCredential = (credential) => {
  ElMessage.success(`已加入归档下载：${credential.fileName}`)
}

// 配置有效期
const configureExpiration = (credential) => {
  currentCredential.value = credential
  expirationForm.value = { expirationDate: credential.expirationDate }
  expirationDialogVisible.value = true
}

// 续期操作
const renewCredential = (credential) => {
  currentCredential.value = credential
  expirationForm.value = { expirationDate: credential.expirationDate }
  expirationDialogVisible.value = true
}

// 撤销授权
const revokeCredential = async (credential) => {
  try {
    await ElMessageBox.confirm(`确定撤销「${credential.schoolName}」的证件授权吗？`, '撤销授权', { type: 'warning' })
    ElMessage.success('授权已撤销')
  } catch {
    // 用户取消
  }
}

const saveExpiration = () => {
  if (!expirationForm.value.expirationDate) {
    ElMessage.warning('请选择有效期')
    return
  }
  ElMessage.success('证件有效期已更新')
  expirationDialogVisible.value = false
}

const handleCredentialCommand = (command, credential) => {
  const commandMap = {
    expiration: configureExpiration,
    renew: renewCredential,
    revoke: revokeCredential,
  }
  commandMap[command]?.(credential)
}

onMounted(() => {
  Promise.all([
    getCredentialTypeOptionsApi(),
    getAdminStatusOptionsApi('credential'),
  ]).then(([typeResponse, statusResponse]) => {
    credentialTypes.value = typeResponse.data?.list || []
    statusOptions.value = statusResponse.data?.list || []
  })
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
    <PageSection>
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
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </PageSection>

    <!-- 数据表格 -->
    <PageSection>
      <el-table 
        :data="credentials" 
        stripe 
        style="width: 100%"
        :loading="loading"
      >
        <el-table-column prop="schoolName" label="学校名称" min-width="150" />
        <el-table-column prop="credentialType" label="证件类型" width="120">
          <template #default="{ row }">
            <span>{{ resolveCredentialTypeLabel(row.credentialType) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="180" />
        <el-table-column prop="uploadTime" label="上传时间" width="160" />
        <el-table-column prop="expirationDate" label="有效期至" width="120" />
        <el-table-column prop="status" label="授权状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <div class="credential-actions">
            <ActionButton variant="subtle" @click="previewCredential(row)">
              预览
            </ActionButton>
            <ActionButton variant="subtle" action="muted" @click="downloadCredential(row)">
              下载
            </ActionButton>
            <el-dropdown trigger="click" @command="(command) => handleCredentialCommand(command, row)">
              <ActionButton variant="subtle" action="warning">
                更多
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </ActionButton>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="expiration">配置有效期</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'valid'" command="renew">续期</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== 'revoked'" command="revoke" divided>撤销</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <el-dialog v-model="previewDialogVisible" title="证件预览" width="560px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="学校名称">{{ currentCredential?.schoolName }}</el-descriptions-item>
        <el-descriptions-item label="证件类型">{{ resolveCredentialTypeLabel(currentCredential?.credentialType) }}</el-descriptions-item>
        <el-descriptions-item label="文件名称">{{ currentCredential?.fileName }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ currentCredential?.expirationDate }}</el-descriptions-item>
      </el-descriptions>
      <div class="preview-box">证件文件预览区域</div>
    </el-dialog>

    <el-dialog v-model="expirationDialogVisible" title="配置授权有效期" width="420px">
      <el-form :model="expirationForm" label-width="90px">
        <el-form-item label="有效期至" required>
          <el-date-picker
            v-model="expirationForm.expirationDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="expirationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExpiration">保存</el-button>
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
.preview-box {
  min-height: 220px;
  margin-top: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
}

.credential-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.dropdown-icon {
  margin-left: var(--space-1);
}
</style>
