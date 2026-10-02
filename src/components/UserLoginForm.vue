<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Avatar, Hide, Lock, User, View } from '@element-plus/icons-vue'
import { loginApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { testAccountData, testAccountTrigger } from '@/utils/testAccountFill'

defineOptions({ name: 'UserLoginForm' })

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const formRef = ref(null)
const showPassword = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
})

const rules = {
  username: [
    { required: true, message: 'Please enter account', trigger: 'blur' },
    { min: 3, max: 64, message: 'Account length must be 3-64 characters', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 6, max: 64, message: 'Password length must be 6-64 characters', trigger: 'blur' },
  ],
}

const roleRouteMap = {
  system_admin: '/admin/dashboard',
  school_admin: '/school/dashboard',
  staff: '/staff/dashboard',
  student: '/student/dashboard',
}

watch(testAccountTrigger, () => {
  if (testAccountTrigger.value > 0) {
    loginForm.username = testAccountData.value.username
    loginForm.password = testAccountData.value.password
  }
})

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await loginApi(loginForm.username, loginForm.password, loginForm.remember)
    userStore.login(res.data)
    await userStore.confirmSession({ force: true })
    ElMessage.success('Login successful')
    router.push(route.query.redirect || roleRouteMap[userStore.userRole] || '/student/dashboard')
  } catch (err) {
    ElMessage.error(err.message || 'Login failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="form-card">
    <div class="form-header">
      <div class="header-icon">
        <el-icon :size="28"><Avatar /></el-icon>
      </div>
      <h2 class="form-title">User Login</h2>
      <p class="form-subtitle">Staff and student portal</p>
    </div>

    <el-form ref="formRef" :model="loginForm" :rules="rules" size="large" @keyup.enter="handleLogin">
      <div class="form-group">
        <label class="form-label">Account</label>
        <el-input v-model="loginForm.username" placeholder="Enter account" :prefix-icon="User" />
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <el-input
          v-model="loginForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter password"
          :prefix-icon="Lock"
        >
          <template #suffix>
            <el-icon class="password-toggle" @click="showPassword = !showPassword">
              <View v-if="!showPassword" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div class="form-options">
        <el-checkbox v-model="loginForm.remember">Remember me</el-checkbox>
        <span class="help-text">Password reset is handled by the school administrator.</span>
      </div>

      <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
        Login
        <el-icon class="btn-arrow"><ArrowRight /></el-icon>
      </el-button>
    </el-form>
  </div>
</template>

<style scoped>
.form-card {
  width: 100%;
  max-width: 460px;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-10) var(--space-8) var(--space-8);
  box-shadow: var(--shadow-xl);
  animation: fadeInRight 0.4s ease;
}

.form-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.header-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary-50);
  border-radius: var(--radius-xl);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-500);
  margin-bottom: var(--space-3);
}

.form-title {
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.form-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0;
}

.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-regular);
  margin-bottom: var(--space-2);
}

.password-toggle {
  cursor: pointer;
  color: var(--color-text-placeholder);
  font-size: var(--font-xl);
  transition: color 0.2s;
}

.password-toggle:hover {
  color: var(--color-accent-500);
}

.form-options {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-5);
}

.help-text {
  color: var(--color-text-placeholder);
  font-size: var(--font-xs);
  text-align: right;
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.login-btn:hover {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.btn-arrow {
  font-size: var(--font-xl);
}
</style>
