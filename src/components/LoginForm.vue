<script setup>
import { ref, reactive, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowRight, View, Hide } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'

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

// 提供给父布局的测试账号填充方法
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
      const role = res.data.userInfo.role
      if (role === 'dept_admin') {
        router.push('/dept/dashboard')
      } else if (role === 'system_admin' || role === 'school_admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/user/dashboard')
      }
    }
  } catch (err) {
    ElMessage.error(err.message || '登录失败，请检查账号和密码')
    generateCaptcha()
  } finally {
    loading.value = false
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="form-card">
    <h2 class="form-title">登录</h2>

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
          placeholder="请输入学号/工号/账号"
          :prefix-icon="User"
          clearable
        />
      </div>

      <div class="form-group">
        <label class="form-label">密码</label>
        <el-input
          v-model="loginForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入登录密码"
          :prefix-icon="Lock"
          clearable
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
            clearable
            @keyup.enter="handleLogin"
          />
          <div class="captcha-image" @click="generateCaptcha" title="点击刷新验证码">
            {{ captchaCode }}
          </div>
        </div>
      </div>

      <div class="form-options">
        <el-checkbox v-model="loginForm.remember">记住身份</el-checkbox>
        <el-link type="success" :underline="false">忘记密码？</el-link>
      </div>

      <el-button
        type="success"
        class="login-btn"
        :loading="loading"
        @click="handleLogin"
      >
        登 录
        <el-icon class="btn-arrow"><ArrowRight /></el-icon>
      </el-button>
    </el-form>

    <div class="register-link">
      <span>还没有账号？</span>
      <el-link type="success" :underline="false" @click="goToRegister">
        立即注册
      </el-link>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 16px;
  padding: 36px 32px 28px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  animation: fadeInRight 0.4s ease;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 24px;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.password-toggle {
  cursor: pointer;
  color: #999;
  font-size: 18px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #2d6a2e;
}

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 96px;
  height: 40px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #2d6a2e;
  letter-spacing: 4px;
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
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: #2d6a2e;
  border-color: #2d6a2e;
  letter-spacing: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover {
  background: #245a25;
  border-color: #245a25;
}

.btn-arrow {
  font-size: 18px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.register-link .el-link {
  font-weight: 600;
}
</style>
