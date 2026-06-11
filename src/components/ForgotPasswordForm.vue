<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Message, Key, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { forgotPasswordApi } from '@/api/auth'

defineOptions({ name: 'ForgotPasswordForm' })

const router = useRouter()
const loading = ref(false)
const activeStep = ref(0)

const accountForm = reactive({ username: '' })
const verifyForm = reactive({ method: 'phone', code: '' })
const passwordForm = reactive({ newPassword: '', confirmPassword: '' })

const accountRules = {
  username: [
    { required: true, message: '请输入注册账号', trigger: 'blur' },
  ],
}

const verifyRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
  ],
}

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const accountFormRef = ref(null)
const verifyFormRef = ref(null)
const passwordFormRef = ref(null)

async function handleNextStep() {
  if (activeStep.value === 0) {
    const valid = await accountFormRef.value?.validate().catch(() => false)
    if (!valid) return
    activeStep.value = 1
  } else if (activeStep.value === 1) {
    const valid = await verifyFormRef.value?.validate().catch(() => false)
    if (!valid) return
    activeStep.value = 2
  }
}

async function handlePrevStep() {
  activeStep.value--
}

async function handleSubmit() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await forgotPasswordApi(accountForm.username, passwordForm.newPassword)
    ElMessage.success('密码重置成功，请使用新密码登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.message || '密码重置失败')
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
    <div class="form-header">
      <h2 class="form-title">忘记密码</h2>
      <p class="form-subtitle">通过验证身份重置您的密码</p>
    </div>

    <el-steps :active="activeStep" align-center class="steps" finish-status="success">
      <el-step title="输入账号" />
      <el-step title="身份验证" />
      <el-step title="设置密码" />
    </el-steps>

    <!-- 步骤1：输入账号 -->
    <el-form
      v-show="activeStep === 0"
      ref="accountFormRef"
      :model="accountForm"
      :rules="accountRules"
      size="large"
      class="step-form"
    >
      <div class="form-group">
        <label class="form-label">注册账号</label>
        <el-input
          v-model="accountForm.username"
          placeholder="请输入您的注册账号"
          :prefix-icon="User"
          
        />
      </div>
    </el-form>

    <!-- 步骤2：身份验证 -->
    <el-form
      v-show="activeStep === 1"
      ref="verifyFormRef"
      :model="verifyForm"
      :rules="verifyRules"
      size="large"
      class="step-form"
    >
      <div class="form-group">
        <label class="form-label">验证方式</label>
        <el-radio-group v-model="verifyForm.method" class="method-group">
          <el-radio-button value="phone">
            <el-icon><Message /></el-icon> 手机验证
          </el-radio-button>
          <el-radio-button value="email">
            <el-icon><Message /></el-icon> 邮箱验证
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="form-group">
        <label class="form-label">验证码</label>
        <div class="code-row">
          <el-input
            v-model="verifyForm.code"
            placeholder="请输入验证码"
            :prefix-icon="Key"
            
          />
          <el-button class="send-code-btn" type="primary" plain>
            发送验证码
          </el-button>
        </div>
      </div>
    </el-form>

    <!-- 步骤3：设置新密码 -->
    <el-form
      v-show="activeStep === 2"
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="passwordRules"
      size="large"
      class="step-form"
    >
      <div class="form-group">
        <label class="form-label">新密码</label>
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="请输入新密码（6-20位）"
          :prefix-icon="Key"
          show-password
          
        />
      </div>

      <div class="form-group">
        <label class="form-label">确认新密码</label>
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          :prefix-icon="Key"
          show-password
          
        />
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button
        v-if="activeStep > 0"
        class="action-btn"
        @click="handlePrevStep"
      >
        <el-icon><ArrowLeft /></el-icon> 上一步
      </el-button>

      <el-button
        v-if="activeStep < 2"
        type="primary"
        class="action-btn primary"
        @click="handleNextStep"
      >
        下一步 <el-icon><ArrowRight /></el-icon>
      </el-button>

      <el-button
        v-if="activeStep === 2"
        type="primary"
        class="action-btn primary"
        :loading="loading"
        @click="handleSubmit"
      >
        确认重置
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="back-link">
      <el-link type="primary" underline="never" @click="goToLogin">
        返回登录
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
  margin-bottom: var(--space-6);
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

.steps {
  margin-bottom: var(--space-8);
}

.step-form {
  min-height: 160px;
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

.method-group {
  display: flex;
  width: 100%;
}

.method-group :deep(.el-radio-button) {
  flex: 1;
}

.method-group :deep(.el-radio-button__inner) {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.code-row {
  display: flex;
  gap: var(--space-3);
}

.code-row .el-input {
  flex: 1;
}

.send-code-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.action-btn {
  flex: 1;
  height: 44px;
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.action-btn.primary {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-text-white);
}

.action-btn.primary:hover {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.back-link {
  text-align: center;
  margin-top: var(--space-5);
}
</style>
