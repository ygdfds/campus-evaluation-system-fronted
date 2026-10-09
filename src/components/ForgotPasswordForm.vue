<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, User } from '@element-plus/icons-vue'
import { forgotPasswordApi } from '@/api/auth'

defineOptions({ name: 'ForgotPasswordForm' })

const router = useRouter()
const loading = ref(false)
const submitted = ref(false)
const resultMessage = ref('')
const formRef = ref(null)
const form = reactive({
  username: '',
  realName: '',
  identityNo: '',
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await forgotPasswordApi({ ...form })
    submitted.value = true
    resultMessage.value = res?.data?.message || '申请已提交，请联系学校管理员核验身份并重置密码。'
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error?.message || '提交失败')
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
      <p class="form-subtitle">提交找回申请后，由学校管理员核验身份并重置密码</p>
    </div>

    <template v-if="!submitted">
      <el-form ref="formRef" :model="form" :rules="rules" size="large" class="step-form">
        <el-form-item prop="username" label="账号">
          <el-input v-model="form.username" placeholder="请输入登录账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" placeholder="可填写真实姓名，便于管理员核验" />
        </el-form-item>
        <el-form-item label="学号/工号">
          <el-input v-model="form.identityNo" placeholder="可填写学号或工号" />
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button class="action-btn" @click="goToLogin">
          <el-icon><ArrowLeft /></el-icon>返回登录
        </el-button>
        <el-button type="primary" class="action-btn primary" :loading="loading" @click="handleSubmit">
          提交申请
        </el-button>
      </div>
    </template>

    <div v-else class="success-panel">
      <el-icon class="success-icon"><Check /></el-icon>
      <p>{{ resultMessage }}</p>
      <el-button type="primary" class="action-btn primary" @click="goToLogin">返回登录</el-button>
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
.form-header { margin-bottom: var(--space-6); }
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
.step-form { min-height: 180px; }
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
}
.action-btn.primary {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--color-text-white);
}
.success-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  color: var(--color-text-regular);
}
.success-icon {
  font-size: 44px;
  color: var(--color-success-500);
}
</style>
