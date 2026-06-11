<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Phone, ArrowRight, View, Hide } from '@element-plus/icons-vue'
import { getSchoolsApi, verifyIdentityApi, registerApi } from '@/api/auth'

const router = useRouter()

const loading = ref(false)
const schoolsLoading = ref(false)
const verifyLoading = ref(false)
const activeStep = ref(0)
const schools = ref([])
const schoolFormRef = ref(null)
const identityFormRef = ref(null)
const accountFormRef = ref(null)

// 步骤1：选择学校
const schoolForm = reactive({
  schoolId: null,
})

// 步骤2：身份验证
const identityForm = reactive({
  studentNo: '',
  realName: '',
})
const verifiedInfo = ref(null)

// 步骤3：设置账号
const accountForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
})
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const schoolRules = {
  schoolId: [
    { required: true, message: '请选择学校', trigger: 'change' },
  ],
}

const identityRules = {
  studentNo: [
    { required: true, message: '请输入学号/工号', trigger: 'blur' },
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
  ],
}

const accountRules = {
  username: [
    { required: true, message: '请设置用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '用户名只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== accountForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
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

onMounted(async () => {
  try {
    schoolsLoading.value = true
    const res = await getSchoolsApi()
    schools.value = res.data
  } catch {
    ElMessage.error('获取学校列表失败')
  } finally {
    schoolsLoading.value = false
  }
})

async function handleNextStep() {
  if (activeStep.value === 0) {
    // 步骤1：校验学校选择
    if (!schoolForm.schoolId) {
      ElMessage.warning('请选择所在学校')
      return
    }
    activeStep.value = 1
  } else if (activeStep.value === 1) {
    // 步骤2：校验身份字段
    if (!identityForm.studentNo) {
      ElMessage.warning('请输入学号/工号')
      return
    }
    if (!identityForm.realName) {
      ElMessage.warning('请输入真实姓名')
      return
    }
    await handleVerify()
  }
}

async function handleVerify() {
  verifyLoading.value = true
  try {
    const res = await verifyIdentityApi(
      schoolForm.schoolId,
      identityForm.studentNo,
      identityForm.realName
    )
    verifiedInfo.value = res.data
    // 自动填充用户名（学号/工号）
    accountForm.username = res.data.studentNo
    ElMessage.success('身份验证通过')
    activeStep.value = 2
  } catch (err) {
    ElMessage.error(err.message || '身份验证失败')
  } finally {
    verifyLoading.value = false
  }
}

async function handleRegister() {
  const valid = await accountFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await registerApi({
      schoolId: schoolForm.schoolId,
      username: accountForm.username,
      password: accountForm.password,
      realName: identityForm.realName,
      phone: accountForm.phone,
      email: accountForm.email,
      studentNo: verifiedInfo.value.role === 'student' ? identityForm.studentNo : null,
      workNo: verifiedInfo.value.role === 'staff' ? identityForm.studentNo : null,
      role: verifiedInfo.value.role,
      department: verifiedInfo.value.department,
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

function goBack() {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}
</script>

<template>
  <div class="form-card">
    <h2 class="form-title">注册账号</h2>
    <p class="form-desc">填写信息，开启您的评测之旅</p>

    <!-- 步骤条 -->
    <el-steps :active="activeStep" finish-status="success" align-center class="register-steps">
      <el-step title="选择学校" />
      <el-step title="身份验证" />
      <el-step title="设置账号" />
    </el-steps>

    <!-- 步骤1：选择学校 -->
    <el-form
      v-show="activeStep === 0"
      ref="schoolFormRef"
      :model="schoolForm"
      :rules="schoolRules"
      size="large"
      label-width="0"
      class="step-form"
    >
      <div class="form-group">
        <label class="form-label">所在学校</label>
        <el-select
          v-model="schoolForm.schoolId"
          placeholder="请选择所在学校"
          :loading="schoolsLoading"
          style="width: 100%"
        >
          <el-option
            v-for="school in schools"
            :key="school.id"
            :label="school.schoolName"
            :value="school.id"
          />
        </el-select>
      </div>
    </el-form>

    <!-- 步骤2：身份验证 -->
    <el-form
      v-show="activeStep === 1"
      ref="identityFormRef"
      :model="identityForm"
      :rules="identityRules"
      size="large"
      label-width="0"
      class="step-form"
    >
      <div class="verify-school-hint">
        已选择：<strong>{{ schools.find((s) => s.id === schoolForm.schoolId)?.schoolName }}</strong>
      </div>
      <div class="form-group">
        <label class="form-label">学号 / 工号</label>
        <el-input
          v-model="identityForm.studentNo"
          placeholder="请输入学号或工号"
          :prefix-icon="User"
          
        />
      </div>
      <div class="form-group">
        <label class="form-label">真实姓名</label>
        <el-input
          v-model="identityForm.realName"
          placeholder="请输入真实姓名"
          
        />
      </div>
    </el-form>

    <!-- 步骤3：设置账号 -->
    <el-form
      v-show="activeStep === 2"
      ref="accountFormRef"
      :model="accountForm"
      :rules="accountRules"
      size="large"
      label-width="0"
      class="step-form"
    >
      <div class="verify-school-hint">
        验证通过：<strong>{{ verifiedInfo?.realName }}</strong>
        （{{ verifiedInfo?.role === 'student' ? '学生' : '教职工' }}）
      </div>
      <div class="form-group">
        <label class="form-label">用户名</label>
        <el-input
          v-model="accountForm.username"
          placeholder="3-20位字母数字下划线"
          :prefix-icon="User"
          
        />
      </div>
      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">手机号</label>
          <el-input
            v-model="accountForm.phone"
            placeholder="请输入手机号"
            :prefix-icon="Phone"
            
          />
        </div>
        <div class="form-group half">
          <label class="form-label">邮箱</label>
          <el-input
            v-model="accountForm.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
            
          />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">密码</label>
        <el-input
          v-model="accountForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="6-20位密码"
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
        <label class="form-label">确认密码</label>
        <el-input
          v-model="accountForm.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="请再次输入密码"
          :prefix-icon="Lock"
          
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
    </el-form>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <el-button
        v-if="activeStep > 0"
        class="back-btn"
        @click="goBack"
      >
        上一步
      </el-button>

      <el-button
        v-if="activeStep < 2"
        type="success"
        class="next-btn"
        :loading="verifyLoading"
        @click="handleNextStep"
      >
        {{ activeStep === 0 ? '下一步' : '验证身份' }}
        <el-icon class="btn-arrow"><ArrowRight /></el-icon>
      </el-button>

      <el-button
        v-if="activeStep === 2"
        type="success"
        class="next-btn"
        :loading="loading"
        @click="handleRegister"
      >
        注 册
        <el-icon class="btn-arrow"><ArrowRight /></el-icon>
      </el-button>
    </div>

    <div class="login-link">
      <span>已有账号？</span>
      <el-link type="success" underline="never" @click="goToLogin">
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
  padding: var(--space-8) var(--space-8) var(--space-6);
  box-shadow: var(--shadow-xl);
  animation: fadeInRight 0.4s ease;
}

.form-title {
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.form-desc {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0 0 var(--space-5);
}

.register-steps {
  margin-bottom: var(--space-6);
}

.step-form {
  min-height: 200px;
}

.verify-school-hint {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-accent-50);
  border-radius: var(--radius-md);
}

.verify-school-hint strong {
  color: var(--color-accent-500);
}

.form-row {
  display: flex;
  gap: var(--space-3);
}

.form-group {
  margin-bottom: var(--space-3);
}

.form-group.half {
  flex: 1;
  min-width: 0;
}

.form-label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-regular);
  margin-bottom: var(--space-1);
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

.step-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.back-btn {
  flex: 1;
  height: 44px;
  font-size: var(--font-md);
  border-radius: var(--radius-lg);
}

.next-btn {
  flex: 2;
  height: 44px;
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

.next-btn:hover {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.btn-arrow {
  font-size: var(--font-xl);
}

.login-link {
  text-align: center;
  margin-top: var(--space-4);
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.login-link .el-link {
  font-weight: var(--font-weight-semibold);
}

@media (max-width: 900px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
