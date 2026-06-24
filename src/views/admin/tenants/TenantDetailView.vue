<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ActionButton from '@/components/admin/ActionButton.vue'
import { getTenantDetailApi, SYSTEM_STATUS_MAP } from '@/api/system'

defineOptions({ name: 'AdminTenantDetailView' })

const route = useRoute()
const loading = ref(false)
const detail = ref({
  tenant: {},
  admins: [],
  quotas: {},
  auditLogs: [],
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const response = await getTenantDetailApi(route.params.tenantId)
    detail.value = response.data
  } finally {
    loading.value = false
  }
}

const saveAdmin = () => {
  ElMessage.success('管理员账号信息已保存')
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <PageHeader :title="`${detail.tenant.schoolName || ''} 租户详情`" subtitle="开通信息、管理员账号、资源配额与审计记录" />

    <PageSection title="租户基础开通信息">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="租户ID">{{ detail.tenant.tenantId }}</el-descriptions-item>
        <el-descriptions-item label="学校名称">{{ detail.tenant.schoolName }}</el-descriptions-item>
        <el-descriptions-item label="运行状态">
          <StatusTag :status="detail.tenant.status" :status-map="SYSTEM_STATUS_MAP" />
        </el-descriptions-item>
        <el-descriptions-item label="当前套餐">{{ detail.tenant.planName }}</el-descriptions-item>
        <el-descriptions-item label="开通时间">{{ detail.tenant.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="到期时间">{{ detail.tenant.expireAt }}</el-descriptions-item>
      </el-descriptions>
    </PageSection>

    <PageSection title="本校超级管理员账号">
      <template #header>
        <div class="card-header">
          <span>本校超级管理员账号</span>
          <el-button type="primary" @click="saveAdmin">新增账号</el-button>
        </div>
      </template>
      <el-table :data="detail.admins" stripe style="width: 100%">
        <el-table-column prop="username" label="账号" width="160" />
        <el-table-column prop="realName" label="姓名" width="140" />
        <el-table-column prop="phone" label="手机号" width="160" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="SYSTEM_STATUS_MAP" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default>
            <ActionButton>编辑</ActionButton>
            <ActionButton action="danger">删除</ActionButton>
          </template>
        </el-table-column>
      </el-table>
    </PageSection>

    <PageSection title="资源配额">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="表单数量">{{ detail.quotas.formQuota }}</el-descriptions-item>
        <el-descriptions-item label="存储空间">{{ detail.quotas.storageQuota }}</el-descriptions-item>
        <el-descriptions-item label="评价并发">{{ detail.quotas.concurrencyQuota }}</el-descriptions-item>
      </el-descriptions>
    </PageSection>

    <PageSection title="平台操作审计记录">
      <el-table :data="detail.auditLogs" stripe style="width: 100%">
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="150" />
        <el-table-column prop="description" label="操作描述" min-width="240" />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="createdAt" label="操作时间" width="170" />
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
