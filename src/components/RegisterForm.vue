<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Phone, ArrowRight, View, Hide } from '@element-plus/icons-vue'
import { registerApi } from '@/api/auth'

const router = useRouter()

const loading = ref(false)
const formRef = ref(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  phone: '',
  email: '',
  agreeTerms: false,
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '用户名只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (!registerForm.agreeTerms) {
    ElMessage.warning('请先同意用户协议')
    return
  }

  loading.value = true
  try {
    await registerApi({
      username: registerForm.username,
      password: registerForm.password,
      realName: registerForm.realName,
      phone: registerForm.phone,
      email: registerForm.email,
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="form-card">
    <h2 class="form-title">注册账号</h2>
    <p class="form-desc">填写信息，开启您的评测之旅</p>

    <el-form
      ref="formRef"
      :model="registerForm"
      :rules="rules"
      size="large"
      label-width="0"
    >
      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">用户名</label>
          <el-input
            v-model="registerForm.username"
            placeholder="3-20位字母数字下划线"
            :prefix-icon="User"
            clearable
          />
        </div>
        <div class="form-group half">
          <label class="form-label">真实姓名</label>
          <el-input
            v-model="registerForm.realName"
            placeholder="请输入真实姓名"
            clearable
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">手机号</label>
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            :prefix-icon="Phone"
            clearable
          />
        </div>
        <div class="form-group half">
          <label class="form-label">邮箱</label>
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
            clearable
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">密码</label>
        <el-input
          v-model="registerForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="6-20位密码"
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
        <label class="form-label">确认密码</label>
        <el-input
          v-model="registerForm.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="请再次输入密码"
          :prefix-icon="Lock"
          clearable
        >
          <template #suffix>
            <el-icon
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <View v-if="!showConfirmPassword" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div class="form-group agree-group">
        <el-checkbox v-model="registerForm.agreeTerms">
          我已阅读并同意
          <el-link type="success" :underline="false">用户服务协议</el-link>
        </el-checkbox>
      </div>

      <el-button
        type="success"
        class="register-btn"
        :loading="loading"
        @click="handleRegister"
      >
        注 册
        <el-icon class="btn-arrow"><ArrowRight /></el-icon>
      </el-button>
    </el-form>

    <div class="login-link">
      <span>已有账号？</span>
      <el-link type="success" :underline="false" @click="goToLogin">
        返回登录
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
  padding: 32px 32px 24px;
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
  margin: 0 0 4px;
}

.form-desc {
  font-size: 13px;
  color: #999;
  margin: 0 0 20px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group.half {
  flex: 1;
  min-width: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
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

.agree-group {
  margin-bottom: 16px;
}

.register-btn {
  width: 100%;
  height: 44px;
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

.register-btn:hover {
  background: #245a25;
  border-color: #245a25;
}

.btn-arrow {
  font-size: 18px;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.login-link .el-link {
  font-weight: 600;
}

@media (max-width: 900px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
