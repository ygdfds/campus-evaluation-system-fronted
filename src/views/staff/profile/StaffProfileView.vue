<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getStaffProfileApi,
  updateStaffBasicInfoApi,
  changeStaffPasswordApi,
  updateStaffNotificationPreferenceApi,
} from '@/api/staffProfile'

import StaffProfileCard from '@/components/staff/profile/StaffProfileCard.vue'
import StaffAccountOverviewCard from '@/components/staff/profile/StaffAccountOverviewCard.vue'
import StaffBasicInfoPanel from '@/components/staff/profile/StaffBasicInfoPanel.vue'
import StaffSecurityPanel from '@/components/staff/profile/StaffSecurityPanel.vue'
import StaffPermissionPanel from '@/components/staff/profile/StaffPermissionPanel.vue'
import StaffNotificationPreferencePanel from '@/components/staff/profile/StaffNotificationPreferencePanel.vue'
import ChangePasswordDialog from '@/components/staff/profile/ChangePasswordDialog.vue'

defineOptions({ name: 'StaffProfileView' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const loadError = ref('')

const account = ref(null)
const profile = ref(null)
const roles = ref([])
const teachingOrg = ref(null)
const serviceOrg = ref(null)
const permissionTexts = ref([])
const notificationPreference = ref(null)
const overviewStats = ref({ unreadCount: 0, pendingTotal: 0, pendingFeedbackCount: 0, pendingAppealCount: 0, permissionModuleCount: 0 })

const activeTab = ref('basic')
const pwdDialogVisible = ref(false)

const schoolName = computed(() => userStore.schoolName || '')
const orgName = computed(() => teachingOrg.value?.name || serviceOrg.value?.name || '')

function getUserContext() {
  const info = userStore.userInfo || {}
  return {
    tenantId: userStore.tenantId || info.tenant_id,
    userId: info.id || info.user_id || info.account_id,
  }
}

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const ctx = getUserContext()
    const data = await getStaffProfileApi(ctx)
    account.value = data.account
    profile.value = data.profile
    roles.value = data.roles || []
    teachingOrg.value = data.teachingOrg
    serviceOrg.value = data.serviceOrg
    permissionTexts.value = data.permissionScope || []
    notificationPreference.value = data.notificationPreference
    overviewStats.value = data.overviewStats || { unreadCount: 0, pendingTotal: 0, pendingFeedbackCount: 0, pendingAppealCount: 0, permissionModuleCount: 0 }
  } catch (e) {
    console.error('加载个人信息失败:', e)
    loadError.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/staff/dashboard')
  }
}

async function handleSaveBasicInfo(payload) {
  try {
    const ctx = getUserContext()
    await updateStaffBasicInfoApi(payload, ctx)
    await loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

async function handleChangePassword(payload) {
  try {
    const ctx = getUserContext()
    await changeStaffPasswordApi(payload, ctx)
    pwdDialogVisible.value = false
    ElMessage.success('密码修改成功')
  } catch (e) {
    ElMessage.error(e.message || '密码修改失败')
  }
}

async function handleSaveNotificationPref(payload) {
  try {
    const ctx = getUserContext()
    await updateStaffNotificationPreferenceApi(payload, ctx)
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="profile-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" class="back-btn" @click="handleBack">返回</el-button>
        <div class="header-text">
          <h1 class="page-title">个人信息</h1>
          <p class="page-subtitle">查看账号资料、安全设置和当前授权范围</p>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-area">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="error-area">
      <p class="error-text">{{ loadError }}</p>
      <el-button class="btn-green" @click="loadData">重新加载</el-button>
    </div>

    <!-- 主内容 -->
    <template v-else>
      <div class="profile-layout">
        <!-- 左侧资料卡 -->
        <div class="profile-sidebar">
          <StaffProfileCard
            :profile="profile"
            :account="account"
            :roles="roles"
            :school-name="schoolName"
            :org-name="orgName"
          />
          <StaffAccountOverviewCard
            :account="account"
            :stats="overviewStats"
          />
        </div>

        <!-- 右侧内容区 -->
        <div class="profile-main">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane label="基本资料" name="basic">
              <StaffBasicInfoPanel
                :profile="profile"
                :account="account"
                :school-name="schoolName"
                :org-name="orgName"
                @save="handleSaveBasicInfo"
              />
            </el-tab-pane>
            <el-tab-pane label="账号安全" name="security">
              <StaffSecurityPanel
                :account="account"
                @change-password="pwdDialogVisible = true"
              />
            </el-tab-pane>
            <el-tab-pane label="角色授权" name="permission">
              <StaffPermissionPanel
                :roles="roles"
                :permission-texts="permissionTexts"
              />
            </el-tab-pane>
            <el-tab-pane label="通知偏好" name="notification">
              <StaffNotificationPreferencePanel
                :preference="notificationPreference"
                @save="handleSaveNotificationPref"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>

    <!-- 修改密码弹窗 -->
    <ChangePasswordDialog
      v-model:visible="pwdDialogVisible"
      @submit="handleChangePassword"
    />
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1160px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: var(--space-8, 32px);
  min-height: 580px;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 var(--space-3, 12px);
  gap: var(--space-4, 16px);
}
.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
}
.back-btn { margin-top: 4px; flex-shrink: 0; }
.header-text { flex: 1; }
.page-title { font-size: 22px; font-weight: 600; color: var(--color-text-heading); margin: 0 0 var(--space-1, 4px); }
.page-subtitle { font-size: var(--font-sm, 13px); color: var(--color-text-secondary); margin: 0; }

.loading-area, .error-area {
  padding: var(--space-8, 32px);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg, 12px);
  text-align: center;
}
.error-text { color: var(--color-text-muted); margin-bottom: var(--space-4, 16px); }

.profile-layout {
  display: flex;
  gap: var(--space-5, 20px);
  align-items: flex-start;
}
.profile-sidebar {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 72px;
}
.profile-main {
  flex: 1;
  min-width: 0;
}

/* Tabs 样式 */
.profile-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--space-4, 16px);
}
.profile-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-primary, #2d6a2e);
  font-weight: 600;
}
.profile-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--color-primary, #2d6a2e);
}

.btn-green {
  --el-button-bg-color: var(--color-primary, #2d6a2e);
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
  color: #fff;
}

/* 响应式 */
@media (max-width: 900px) {
  .profile-layout {
    flex-direction: column;
  }
  .profile-sidebar {
    width: 100%;
    position: static;
  }
}
</style>
