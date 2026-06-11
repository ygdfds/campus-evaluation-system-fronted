<script setup>
import { ref, reactive, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowRight, View, Hide, School } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'

defineOptions({ name: 'SchoolAdminLoginForm' })

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const formRef = ref(null)
const showPassword = ref(false)
const captchaText = ref('')
const captchaCode = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
})

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
}

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode.value = code
  captchaText.value = ''
}

generateCaptcha()

provide('fillTestAccount', (username, password) => {
  loginForm.username = username
  loginForm.password = password
})

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (captchaText.value.toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误')
    generateCaptcha()
    return
  }

  loading.value = true
  try {
    const res = await loginApi(loginForm.username, loginForm.password)
    userStore.login(res.data)
    ElMessage.success('登录成功')

    const redirect = route.query.redirect
    if (redirect) {
      router.push(redirect)
    } else {
      router.push('/school/dashboard')
    }
  } catch (err) {
    ElMessage.error(err.message || '登录失败，请检查账号和密码')
    generateCaptcha()
  } finally {
    loading.value = false
  }
}

function goToForgotPassword() {
  router.push('/forgot-password')
}
</script>

<template>
  <div class="form-card">
    <div class="form-header">
      <div class="header-icon">
        <el-icon :size="28"><School /></el-icon>
      </div>
      <h2 class="form-title">学校管理端登录</h2>
      <p class="form-subtitle">学校管理员专属入口</p>
    </div>

    <el-form
      ref="formRef"
      :model="loginForm"
      :rules="rules"
      size="large"
      @keyup.enter="handleLogin"
    >
      <div class="form-group">
        <label class="form-label">账号</label>
        <el-input
          v-model="loginForm.username"
          placeholder="请输入学校管理员账号"
          :prefix-icon="User"
          
        />
      </div>

      <div class="form-group">
        <label class="form-label">密码</label>
        <el-input
          v-model="loginForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入登录密码"
          :prefix-icon="Lock"
          
        >
          <template #suffix>
            <el-icon
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <View v-if="!showPassword" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div class="form-group">
        <label class="form-label">验证码</label>
        <div class="captcha-row">
          <el-input
            v-model="captchaText"
            placeholder="请输入验证码"
            class="captcha-input"
            
            @keyup.enter="handleLogin"
          />
          <div class="captcha-image" @click="generateCaptcha" title="点击刷新验证码">
            {{ captchaCode }}
          </div>
        </div>
      </div>

      <div class="form-options">
        <el-checkbox v-model="loginForm.remember">记住身份</el-checkbox>
        <el-link type="primary" underline="never" @click="goToForgotPassword">忘记密码？</el-link>
      </div>

      <el-button
        type="primary"
        class="login-btn"
        :loading="loading"
        @click="handleLogin"
      >
        登 录
        <el-icon class="btn-arrow"><ArrowRight /></el-icon>
      </el-button>
    </el-form>

    <div class="footer-links">
      <span>还没有账号？</span>
      <el-link type="primary" underline="never" @click="$router.push('/onboarding')">
        学校入驻申请
      </el-link>
    </div>
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

.captcha-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 96px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-accent-50), var(--color-accent-100));
  border: var(--border-base);
  border-color: var(--color-accent-200);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-500);
  letter-spacing: var(--letter-spacing-wider);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.captcha-image:hover {
  opacity: 0.8;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  letter-spacing: var(--letter-spacing-wider);
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

.footer-links {
  text-align: center;
  margin-top: var(--space-5);
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.footer-links .el-link {
  font-weight: var(--font-weight-semibold);
}
</style>
