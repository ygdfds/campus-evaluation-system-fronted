<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { User, Lock, Message, Phone, Connection, Upload, Edit, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getUserAccountApi, getPersonProfileApi, getSchoolProfileApi,
  getLoginLogsApi, updateUserAccountApi,
  updatePasswordApi, updateAvatarApi, createFileResourceApi,
} from '@/api/profile'

defineOptions({ name: 'StudentProfileView' })

const userStore = useUserStore()
const loading = ref(true)
const activeMenu = ref('basic')

// ==================== 数据状态 ====================
const account = ref(null)    // userAccounts
const profile = ref(null)    // personProfiles
const school = ref(null)     // schoolProfiles
const loginLogs = ref([])

// ==================== 基本信息编辑 ====================
const basicEditing = ref(false)
const basicForm = reactive({ phone: '', email: '' })

// ==================== 账号安全 ====================
const pwdForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)

// ==================== 计算属性 ====================
const genderText = computed(() => {
  const g = profile.value?.gender
  return g === 'male' ? '男' : g === 'female' ? '女' : '—'
})
const avatarLetter = computed(() => (profile.value?.real_name || '?').charAt(0))
const schoolName = computed(() => userStore.schoolName || school.value?.name || '—')
const lastLoginTime = computed(() => {
  const lastSuccess = loginLogs.value.find(l => l.result === 'success')
  return lastSuccess ? formatDateTime(lastSuccess.created_at) : '—'
})
const statusMap = { active: '正常', frozen: '冻结', disabled: '禁用' }

// 脱敏
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '—'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}
function maskEmail(email) {
  if (!email) return '—'
  const [name, domain] = email.split('@')
  if (name.length <= 2) return name + '@' + domain
  return name.slice(0, 2) + '***@' + domain
}

function formatDateTime(dt) { return dt ? dt.replace('T', ' ').slice(0, 16) : '—' }

// ==================== 数据加载 ====================
async function loadData() {
  loading.value = true
  const uid = userStore.userInfo?.id
  const tid = userStore.tenantId
  const sid = userStore.schoolId
  if (!uid) return
  try {
    const [acc, prof, sch] = await Promise.all([
      getUserAccountApi(uid),
      getPersonProfileApi(tid, uid),
      sid ? getSchoolProfileApi(sid).catch(() => null) : null,
    ])
    account.value = acc
    profile.value = prof
    school.value = sch
    basicForm.phone = acc?.phone || ''
    basicForm.email = acc?.email || ''
    await loadLoginLogs()
  } catch (e) { console.error('加载个人信息失败:', e) }
  finally { loading.value = false }
}

async function loadLoginLogs() {
  const uid = userStore.userInfo?.id
  const tid = userStore.tenantId
  if (!uid || !tid) return
  try {
    const logs = await getLoginLogsApi(tid, uid)
    loginLogs.value = (logs || []).slice(0, 3)
  } catch (e) { console.error('加载登录日志失败:', e) }
}

// ==================== 基本信息 ====================
function startEditBasic() {
  basicForm.phone = account.value?.phone || ''
  basicForm.email = account.value?.email || ''
  basicEditing.value = true
}
function cancelEditBasic() { basicEditing.value = false }

async function saveBasic() {
  // 校验
  if (basicForm.phone && !/^1[3-9]\d{9}$/.test(basicForm.phone)) {
    ElMessage.warning('请输入正确的手机号'); return
  }
  if (basicForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicForm.email)) {
    ElMessage.warning('请输入正确的邮箱'); return
  }
  try {
    const now = new Date().toISOString()
    await updateUserAccountApi(account.value.id, {
      phone: basicForm.phone, email: basicForm.email, updated_at: now,
    })
    account.value = { ...account.value, phone: basicForm.phone, email: basicForm.email }
    userStore.updateUserInfo({ phone: basicForm.phone, email: basicForm.email })
    ElMessage.success('个人信息已保存')
    basicEditing.value = false
  } catch (e) { ElMessage.error('保存失败'); console.error(e) }
}

// ==================== 修改密码 ====================
async function handleChangePassword() {
  if (!pwdForm.currentPassword) { ElMessage.warning('请输入当前密码'); return }
  if (!pwdForm.newPassword || pwdForm.newPassword.length < 8) {
    ElMessage.warning('新密码不少于 8 位'); return
  }
  if (!/[a-zA-Z]/.test(pwdForm.newPassword) || !/\d/.test(pwdForm.newPassword)) {
    ElMessage.warning('新密码需包含字母和数字'); return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致'); return
  }
  pwdLoading.value = true
  try {
    await updatePasswordApi(account.value.id, `$mock$${pwdForm.newPassword}`)
    ElMessage.success('密码修改成功')
    Object.assign(pwdForm, { currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (e) { ElMessage.error('密码修改失败'); console.error(e) }
  finally { pwdLoading.value = false }
}

// ==================== 更换手机/邮箱 ====================
async function handleChangePhone() {
  const { value } = await ElMessageBox.prompt('请输入新手机号', '更换手机号', {
    confirmButtonText: '确认', cancelButtonText: '取消',
    inputPattern: /^1[3-9]\d{9}$/, inputErrorMessage: '请输入正确的手机号',
  }).catch(() => ({ value: null }))
  if (!value) return
  const now = new Date().toISOString()
  await updateUserAccountApi(account.value.id, { phone: value, updated_at: now })
  account.value = { ...account.value, phone: value }
  basicForm.phone = value
  ElMessage.success('手机号已更新')
}
async function handleChangeEmail() {
  const { value } = await ElMessageBox.prompt('请输入新邮箱', '更换邮箱', {
    confirmButtonText: '确认', cancelButtonText: '取消',
    inputPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, inputErrorMessage: '请输入正确的邮箱',
  }).catch(() => ({ value: null }))
  if (!value) return
  const now = new Date().toISOString()
  await updateUserAccountApi(account.value.id, { email: value, updated_at: now })
  account.value = { ...account.value, email: value }
  basicForm.email = value
  ElMessage.success('邮箱已更新')
}

// ==================== 更换头像 ====================
async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  event.target.value = ''
  try {
    const now = new Date().toISOString()
    const fr = await createFileResourceApi({
      tenant_id: userStore.tenantId, school_id: userStore.schoolId,
      file_name: file.name, file_size: file.size,
      file_type: file.name.split('.').pop() || 'png',
      url: '', uploaded_at: now, deleted: false,
    })
    if (fr?.id) {
      await updateAvatarApi(profile.value.id, fr.id)
      profile.value = { ...profile.value, avatar_file_id: fr.id }
      ElMessage.success('头像已更新')
    }
  } catch (e) { ElMessage.error('头像上传失败'); console.error(e) }
}

// ==================== 菜单切换 ====================
const menuItems = [
  { key: 'basic', label: '基本信息', icon: User },
  { key: 'security', label: '账号安全', icon: Lock },
  { key: 'binding', label: '账号绑定', icon: Message },
]
function switchMenu(key) { activeMenu.value = key }

onMounted(() => { loadData() })
</script>

<template>
  <div class="profile-page">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">个人信息</h1>
      <p class="page-subtitle">查看和维护你的账号资料与安全设置</p>
    </div>

    <div v-if="loading" class="loading-area"><el-skeleton :rows="6" animated /></div>

    <div v-else class="profile-layout">
      <!-- ==================== 左侧边栏 ==================== -->
      <aside class="sidebar">
        <!-- 个人资料卡 -->
        <div class="profile-card">
          <div class="avatar-area">
            <div class="avatar-circle">
              <span class="avatar-letter">{{ avatarLetter }}</span>
            </div>
            <label class="avatar-change-btn">
              <el-icon :size="12"><Upload /></el-icon> 更换头像
              <input type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
            </label>
          </div>
          <div class="profile-info">
            <h3 class="profile-name">{{ profile?.real_name || '—' }}</h3>
            <el-tag size="small" effect="plain" class="role-tag">学生</el-tag>
            <div class="profile-meta">
              <span class="meta-label">学校</span>
              <span class="meta-value">{{ schoolName }}</span>
            </div>
            <div class="profile-meta">
              <span class="meta-label">院系</span>
              <span class="meta-value">{{ profile?.department_name || '—' }}</span>
            </div>
            <div class="profile-meta">
              <span class="meta-label">学号</span>
              <span class="meta-value">{{ profile?.no_student || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- 功能菜单 -->
        <nav class="side-menu">
          <div v-for="item in menuItems" :key="item.key"
            class="menu-item" :class="{ 'is-active': activeMenu === item.key }"
            @click="switchMenu(item.key)">
            <el-icon :size="16"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </nav>
      </aside>

      <!-- ==================== 右侧内容区 ==================== -->
      <main class="content">
        <!-- 基本信息 -->
        <div v-if="activeMenu === 'basic'" class="content-card">
          <div class="card-header">
            <h2 class="card-title">基本信息</h2>
            <el-button v-if="!basicEditing" type="primary" size="small" @click="startEditBasic">
              <el-icon :size="14"><Edit /></el-icon> 编辑信息
            </el-button>
            <div v-else class="card-actions">
              <el-button type="primary" size="small" @click="saveBasic">
                <el-icon :size="14"><Check /></el-icon> 保存
              </el-button>
              <el-button size="small" @click="cancelEditBasic">取消</el-button>
            </div>
          </div>
          <div class="info-grid">
            <!-- 左列 -->
            <div class="info-item">
              <span class="info-label">用户 ID</span>
              <span class="info-value">{{ account?.id || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属班级</span>
              <span class="info-value">{{ profile?.class_name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ profile?.real_name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号码</span>
              <template v-if="basicEditing">
                <el-input v-model="basicForm.phone" placeholder="请输入手机号" size="small" class="inline-input" />
              </template>
              <span v-else class="info-value">{{ account?.phone || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">学号</span>
              <span class="info-value">{{ profile?.no_student || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电子邮箱</span>
              <template v-if="basicEditing">
                <el-input v-model="basicForm.email" placeholder="请输入邮箱" size="small" class="inline-input" />
              </template>
              <span v-else class="info-value">{{ account?.email || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">性别</span>
              <span class="info-value">{{ genderText }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ formatDateTime(account?.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属学校</span>
              <span class="info-value">{{ schoolName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">账号状态</span>
              <span class="status-tag" :class="'status-' + (account?.status || 'unknown')">
                {{ statusMap[account?.status] || account?.status || '—' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">所属院系</span>
              <span class="info-value">{{ profile?.department_name || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最近登录</span>
              <span class="info-value">{{ lastLoginTime }}</span>
            </div>
          </div>
        </div>

        <!-- 账号安全 -->
        <div v-if="activeMenu === 'security'" class="content-card">
          <h2 class="card-title">账号安全</h2>

          <!-- 修改密码 -->
          <div class="security-section">
            <h3 class="section-title">修改密码</h3>
            <div class="pwd-form">
              <div class="pwd-field">
                <label>当前密码</label>
                <el-input v-model="pwdForm.currentPassword" type="password" show-password placeholder="请输入当前密码" />
              </div>
              <div class="pwd-field">
                <label>新密码</label>
                <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="不少于8位，需包含字母和数字" />
              </div>
              <div class="pwd-field">
                <label>确认新密码</label>
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
              </div>
              <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">修改密码</el-button>
            </div>
          </div>

          <!-- 手机绑定 -->
          <div class="security-section">
            <h3 class="section-title">手机绑定</h3>
            <div class="bind-row">
              <el-icon :size="18" class="bind-icon"><Phone /></el-icon>
              <div class="bind-info">
                <span class="bind-status">{{ account?.phone ? '已绑定' : '未绑定' }}</span>
                <span class="bind-detail">{{ account?.phone ? maskPhone(account.phone) : '—' }}</span>
              </div>
              <el-button size="small" text type="primary" @click="handleChangePhone">
                {{ account?.phone ? '更换手机号' : '绑定手机' }}
              </el-button>
            </div>
          </div>

          <!-- 邮箱绑定 -->
          <div class="security-section">
            <h3 class="section-title">邮箱绑定</h3>
            <div class="bind-row">
              <el-icon :size="18" class="bind-icon"><Message /></el-icon>
              <div class="bind-info">
                <span class="bind-status">{{ account?.email ? '已绑定' : '未绑定' }}</span>
                <span class="bind-detail">{{ account?.email ? maskEmail(account.email) : '—' }}</span>
              </div>
              <el-button size="small" text type="primary" @click="handleChangeEmail">
                {{ account?.email ? '更换邮箱' : '绑定邮箱' }}
              </el-button>
            </div>
          </div>
          <!-- 最近登录 -->
          <div class="security-section">
            <h3 class="section-title">最近登录</h3>
            <div v-if="loginLogs.length" class="recent-logins">
              <div v-for="log in loginLogs" :key="log.id" class="recent-login-row">
                <span class="login-time">{{ formatDateTime(log.created_at) }}</span>
                <span class="login-device">{{ log.device || '—' }}</span>
                <span class="login-location">{{ log.location || '—' }}</span>
                <span class="login-result-tag" :class="log.result === 'success' ? 'result-ok' : 'result-fail'">
                  {{ log.result === 'success' ? '成功' : '失败' }}
                </span>
              </div>
            </div>
            <p v-else class="no-data-hint">暂无最近登录记录</p>
          </div>
        </div>

        <!-- 账号绑定 -->
        <div v-if="activeMenu === 'binding'" class="content-card">
          <h2 class="card-title">账号绑定</h2>
          <div class="binding-list">
            <div class="binding-item">
              <el-icon :size="24" class="binding-icon phone-icon"><Phone /></el-icon>
              <div class="binding-info">
                <span class="binding-name">手机绑定</span>
                <span class="binding-desc">{{ account?.phone ? maskPhone(account.phone) : '未绑定' }}</span>
              </div>
              <el-tag :type="account?.phone ? 'success' : 'info'" size="small" effect="light" class="binding-status">
                {{ account?.phone ? '已绑定' : '未绑定' }}
              </el-tag>
              <el-button size="small" text type="primary" @click="handleChangePhone">
                {{ account?.phone ? '更换' : '绑定' }}
              </el-button>
            </div>
            <div class="binding-item">
              <el-icon :size="24" class="binding-icon email-icon"><Message /></el-icon>
              <div class="binding-info">
                <span class="binding-name">邮箱绑定</span>
                <span class="binding-desc">{{ account?.email ? maskEmail(account.email) : '未绑定' }}</span>
              </div>
              <el-tag :type="account?.email ? 'success' : 'info'" size="small" effect="light" class="binding-status">
                {{ account?.email ? '已绑定' : '未绑定' }}
              </el-tag>
              <el-button size="small" text type="primary" @click="handleChangeEmail">
                {{ account?.email ? '更换' : '绑定' }}
              </el-button>
            </div>
            <div class="binding-item">
              <el-icon :size="24" class="binding-icon sso-icon"><Connection /></el-icon>
              <div class="binding-info">
                <span class="binding-name">统一身份认证</span>
                <span class="binding-desc">学校统一身份认证账号</span>
              </div>
              <el-tag type="info" size="small" effect="light" class="binding-status">未绑定</el-tag>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 1200px; margin: 0 auto; width: 100%; padding-bottom: var(--space-8);
}
.page-header { padding: var(--space-2) 0 var(--space-5); }
.page-title { font-size: 28px; font-weight: var(--font-weight-bold); color: var(--color-text-heading); margin-bottom: var(--space-1); }
.page-subtitle { font-size: var(--font-base); color: var(--color-text-secondary); }

.loading-area { padding: var(--space-8); background: var(--color-bg-card); border-radius: var(--radius-lg); }

/* ==================== 左右分栏布局 ==================== */
.profile-layout {
  display: flex; gap: var(--space-6); align-items: flex-start;
}
.sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: var(--space-4); }
.content { flex: 1; min-width: 0; }

/* ==================== 个人资料卡 ==================== */
.profile-card {
  background: var(--color-bg-card); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card); padding: var(--space-6); text-align: center;
}
.avatar-area { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
.avatar-circle {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--color-primary); color: var(--color-text-white);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: var(--font-weight-bold);
}
.avatar-letter { line-height: 1; }
.avatar-change-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: var(--font-xs); color: var(--color-primary); cursor: pointer;
}
.avatar-change-btn:hover { color: var(--color-primary-hover); }

.profile-info { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
.profile-name { font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-heading); }
.role-tag { background: var(--color-primary-50); color: var(--color-primary); border-color: var(--color-primary-200); }

.profile-meta { display: flex; gap: var(--space-2); font-size: var(--font-sm); }
.meta-label { color: var(--color-text-muted); }
.meta-value { color: var(--color-text-body); font-weight: var(--font-weight-medium); }

/* ==================== 侧边菜单 ==================== */
.side-menu {
  background: var(--color-bg-card); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card); padding: var(--space-2); display: flex; flex-direction: column; gap: 2px;
}
.menu-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
  cursor: pointer; font-size: var(--font-sm); color: var(--color-text-body);
  transition: all 0.2s;
}
.menu-item:hover { background: var(--color-bg-subtle); }
.menu-item.is-active {
  background: var(--color-primary-50); color: var(--color-primary); font-weight: 600;
}

/* ==================== 内容卡片 ==================== */
.content-card {
  background: var(--color-bg-card); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card); padding: var(--space-6) var(--space-8);
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); }
.card-title { font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-heading); margin-bottom: var(--space-5); }
.card-header .card-title { margin-bottom: 0; }
.card-actions { display: flex; gap: var(--space-2); }

/* ==================== 基本信息网格 ==================== */
/* 两列交错布局：左列字段 1,3,5,7,9,11 → odd; 右列 2,4,6,8,10,12 → even */
.info-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: var(--space-4) var(--space-8);
}
.info-item {
  display: flex; flex-direction: column; gap: var(--space-1);
  min-height: 44px; justify-content: center;
}
.info-label { font-size: var(--font-xs); color: var(--color-text-muted); }
.info-value { font-size: var(--font-sm); color: var(--color-text-body); font-weight: var(--font-weight-medium); }
.inline-input { max-width: 280px; }

/* 状态小标签 */
.status-tag {
  display: inline-block; padding: 2px 10px; border-radius: 6px;
  font-size: var(--font-xs); font-weight: var(--font-weight-medium); line-height: 1.6;
}
.status-active { background: var(--color-success-light); color: var(--color-primary-700); }
.status-frozen { background: var(--color-warning-light); color: var(--color-warning); }
.status-disabled { background: var(--color-danger-light); color: var(--color-danger); }
.status-unknown { background: var(--color-info-light); color: var(--color-info); }

/* ==================== 账号安全 ==================== */
.security-section { padding: var(--space-5) 0; border-bottom: 1px solid var(--color-border-light); }
.security-section:first-of-type { padding-top: 0; }
.security-section:last-of-type { border-bottom: none; }
.section-title { font-size: var(--font-md); font-weight: var(--font-weight-medium); color: var(--color-text-heading); margin-bottom: var(--space-4); }

.pwd-form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 400px; }
.pwd-field { display: flex; flex-direction: column; gap: var(--space-1); }
.pwd-field label { font-size: var(--font-sm); color: var(--color-text-body); }

.bind-row { display: flex; align-items: center; gap: var(--space-4); }
.bind-icon { color: var(--color-text-muted); flex-shrink: 0; }
.bind-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.bind-status { font-size: var(--font-sm); color: var(--color-text-body); font-weight: var(--font-weight-medium); }
.bind-detail { font-size: var(--font-xs); color: var(--color-text-muted); }

/* ==================== 按钮颜色统一为系统主色 ==================== */
.content-card :is(.el-button--primary) {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-hover);
  --el-button-hover-border-color: var(--color-primary-hover);
  --el-button-active-bg-color: var(--color-primary-active);
  --el-button-active-border-color: var(--color-primary-active);
}
.content-card :is(.el-button.is-text[type="primary"]),
.content-card :is(.el-button--text[type="primary"]) {
  --el-button-text-color: var(--color-primary);
  --el-button-hover-text-color: var(--color-primary-hover);
}
.side-menu :is(.el-button--primary) {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-hover);
  --el-button-hover-border-color: var(--color-primary-hover);
}

/* ==================== 最近登录（账号安全底部） ==================== */
.recent-logins { display: flex; flex-direction: column; gap: var(--space-3); }
.recent-login-row {
  display: flex; align-items: center; gap: var(--space-5);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle); border-radius: var(--radius-md);
  font-size: var(--font-sm);
}
.login-time { color: var(--color-text-body); min-width: 130px; }
.login-device { color: var(--color-text-muted); flex: 1; }
.login-location { color: var(--color-text-muted); min-width: 80px; }
.login-result-tag {
  display: inline-block; padding: 1px 8px; border-radius: 4px;
  font-size: var(--font-xs); font-weight: var(--font-weight-medium);
}
.result-ok { background: var(--color-success-light); color: var(--color-primary-700); }
.result-fail { background: var(--color-danger-light); color: var(--color-danger); }
.no-data-hint { color: var(--color-text-muted); font-size: var(--font-sm); text-align: center; padding: var(--space-4) 0; }

/* ==================== 账号绑定 ==================== */
.binding-list { display: flex; flex-direction: column; gap: var(--space-4); }
.binding-item {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border-light); border-radius: var(--radius-md);
  transition: border-color 0.2s;
}
.binding-item:hover { border-color: var(--color-primary-200); }
.binding-icon { flex-shrink: 0; }
.phone-icon { color: var(--color-primary); }
.email-icon { color: var(--color-accent-school-500); }
.sso-icon { color: var(--color-info); }
.binding-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.binding-name { font-size: var(--font-sm); color: var(--color-text-body); font-weight: var(--font-weight-medium); }
.binding-desc { font-size: var(--font-xs); color: var(--color-text-muted); }
.binding-status { flex-shrink: 0; border-radius: 6px; }

/* ==================== 响应式 ==================== */
@media (max-width: 1024px) {
  .profile-layout { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; }
  .profile-card { flex: 1; min-width: 260px; }
  .side-menu { flex: 1; min-width: 260px; flex-direction: row; flex-wrap: wrap; }
  .info-grid { grid-template-columns: 1fr; }
}

/* profile-stability-pass */
:global(html) {
  scrollbar-gutter: stable;
}

.profile-page {
  overflow-x: clip;
}

.profile-layout {
  width: 100%;
  min-width: 0;
}

.content {
  min-width: 0;
  overflow-x: hidden;
}

.content-card {
  box-sizing: border-box;
  min-height: 620px;
}

.info-grid {
  align-items: stretch;
}

.info-item {
  min-height: 58px;
  box-sizing: border-box;
}

.inline-input {
  width: 100%;
  max-width: 280px;
}

.inline-input :deep(.el-input__wrapper) {
  min-height: 32px;
}

@media (max-width: 1024px) {
  .content-card { min-height: auto; }
}
</style>
