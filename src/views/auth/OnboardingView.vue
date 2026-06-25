<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { School, User, Phone, Message, Upload, ArrowRight, ArrowLeft, Check } from '@element-plus/icons-vue'
import { getOnboardingPlansApi, submitOnboardingApi } from '@/api/school'
import { clearAuth } from '@/utils/auth'

defineOptions({ name: 'OnboardingView' })

const router = useRouter()
const loading = ref(false)
const activeStep = ref(0)
const plans = ref([])

const schoolForm = reactive({
  schoolName: '',
  creditCode: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
})

const planForm = reactive({
  planId: null,
})

const schoolFormRef = ref(null)

const schoolRules = {
  schoolName: [{ required: true, message: '请输入学校全称', trigger: 'blur' }],
  creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  contactEmail: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
}

onMounted(async () => {
  try {
    const res = await getOnboardingPlansApi()
    plans.value = res.data
  } catch {
    ElMessage.error('获取套餐列表失败')
  }
})

async function handleNextStep() {
  if (activeStep.value === 0) {
    const valid = await schoolFormRef.value?.validate().catch(() => false)
    if (!valid) return
    activeStep.value = 1
  } else if (activeStep.value === 1) {
    if (!planForm.planId) {
      ElMessage.warning('请选择套餐方案')
      return
    }
    activeStep.value = 2
  } else if (activeStep.value === 2) {
    activeStep.value = 3
  }
}

function handlePrevStep() {
  activeStep.value--
}

async function handleSubmit() {
  loading.value = true
  try {
    await submitOnboardingApi({
      ...schoolForm,
      planId: planForm.planId,
    })
    ElMessage.success('入驻申请已提交，请等待审核')
    clearAuth()
    router.push('/login/school')
  } catch (err) {
    ElMessage.error(err.message || '提交失败，请重试')
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login/school')
}
</script>

<template>
  <div class="onboarding-page">
    <!-- 顶部标题栏 -->
    <header class="page-header">
      <div class="header-inner">
        <div class="header-logo">
          <div class="logo-icon">评</div>
          <span class="logo-text">校园服务质量在线评测系统</span>
        </div>
        <el-link type="default" underline="never" @click="goToLogin" class="header-link">
          已有账号？返回登录
        </el-link>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="page-main">
      <div class="page-title-area">
        <h1 class="page-title">学校入驻申请</h1>
        <p class="page-desc">请填写学校真实信息，提交后平台管理员将在 3 个工作日内完成审核</p>
      </div>

      <!-- 步骤条 -->
      <div class="steps-wrapper">
        <el-steps :active="activeStep" finish-status="success" align-center>
          <el-step title="基本信息" description="学校与联系人" />
          <el-step title="选择套餐" description="服务方案" />
          <el-step title="上传材料" description="证照文件" />
          <el-step title="确认提交" description="核对信息" />
        </el-steps>
      </div>

      <!-- 表单卡片 -->
      <div class="form-card">
        <!-- 步骤1：学校基本信息 -->
        <div v-show="activeStep === 0" class="step-section">
          <h3 class="section-title">学校基本信息</h3>
          <el-form
            ref="schoolFormRef"
            :model="schoolForm"
            :rules="schoolRules"
            size="large"
            label-width="140px"
            class="info-form"
          >
            <el-form-item label="学校全称" prop="schoolName">
              <el-input v-model="schoolForm.schoolName" placeholder="请输入学校全称" :prefix-icon="School" clearable />
            </el-form-item>
            <el-form-item label="信用代码" prop="creditCode">
              <el-input v-model="schoolForm.creditCode" placeholder="请输入18位统一社会信用代码" clearable />
            </el-form-item>
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="schoolForm.contactName" placeholder="请输入联系人姓名" :prefix-icon="User" clearable />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="schoolForm.contactPhone" placeholder="请输入手机号码" :prefix-icon="Phone" clearable />
            </el-form-item>
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="schoolForm.contactEmail" placeholder="请输入邮箱地址" :prefix-icon="Message" clearable />
            </el-form-item>
            <el-form-item label="学校地址">
              <el-input v-model="schoolForm.address" placeholder="请输入学校详细地址" clearable />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤2：选择套餐 -->
        <div v-show="activeStep === 1" class="step-section">
          <h3 class="section-title">选择服务套餐</h3>
          <div class="plan-grid">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="plan-card"
              :class="{ 'is-selected': planForm.planId === plan.id }"
              @click="planForm.planId = plan.id"
            >
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.planName }}</h3>
                <el-icon v-if="planForm.planId === plan.id" class="plan-check"><Check /></el-icon>
              </div>
              <p class="plan-desc">{{ plan.features }}</p>
              <div class="plan-footer">
                <el-tag :type="plan.status === 'active' ? 'success' : 'info'" size="small">
                  {{ plan.status === 'active' ? '可开通' : '即将上线' }}
                </el-tag>
                <span class="plan-price">
                  {{ plan.price === 0 ? '免费' : `¥${plan.price.toLocaleString()}/年` }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤3：上传材料 -->
        <div v-show="activeStep === 2" class="step-section">
          <h3 class="section-title">上传证照材料</h3>
          <p class="section-hint">请上传清晰的扫描件或照片，支持 PDF、JPG、PNG 格式，单个文件不超过 10MB</p>
          <div class="upload-list">
            <div class="upload-item">
              <label class="upload-label">营业执照 / 法人证书 <span class="required">*</span></label>
              <el-upload class="upload-area" drag action="#" :auto-upload="false" :limit="1">
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
            </div>
            <div class="upload-item">
              <label class="upload-label">法人身份证 <span class="required">*</span></label>
              <el-upload class="upload-area" drag action="#" :auto-upload="false" :limit="1">
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
            </div>
            <div class="upload-item">
              <label class="upload-label">授权委托书</label>
              <el-upload class="upload-area" drag action="#" :auto-upload="false" :limit="1">
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
            </div>
          </div>
        </div>

        <!-- 步骤4：确认提交 -->
        <div v-show="activeStep === 3" class="step-section">
          <h3 class="section-title">确认申请信息</h3>
          <el-descriptions :column="1" border size="large" class="confirm-desc">
            <el-descriptions-item label="学校名称">{{ schoolForm.schoolName }}</el-descriptions-item>
            <el-descriptions-item label="信用代码">{{ schoolForm.creditCode }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ schoolForm.contactName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ schoolForm.contactPhone }}</el-descriptions-item>
            <el-descriptions-item label="联系邮箱">{{ schoolForm.contactEmail }}</el-descriptions-item>
            <el-descriptions-item label="学校地址">{{ schoolForm.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="服务套餐">
              <strong>{{ plans.find(p => p.id === planForm.planId)?.planName || '-' }}</strong>
            </el-descriptions-item>
          </el-descriptions>
          <el-alert
            class="confirm-tip"
            title="提交后平台管理员将在 3 个工作日内完成审核，审核结果将通过邮件和短信通知。"
            type="info"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button v-if="activeStep > 0" size="large" @click="handlePrevStep">
            <el-icon><ArrowLeft /></el-icon> 上一步
          </el-button>
          <div class="actions-spacer" />
          <el-button
            v-if="activeStep < 3"
            type="primary"
            size="large"
            class="action-primary"
            @click="handleNextStep"
          >
            下一步 <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button
            v-if="activeStep === 3"
            type="primary"
            size="large"
            class="action-primary"
            :loading="loading"
            @click="handleSubmit"
          >
            确认提交 <el-icon><Check /></el-icon>
          </el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
}

/* ===== 顶部导航栏 ===== */
.page-header {
  background: var(--color-bg-card);
  border-bottom: var(--border-base);
  border-color: var(--color-border-light);
  padding: var(--space-4) var(--space-8);
  flex-shrink: 0;
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-primary-500);
  color: var(--color-text-white);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
}

.logo-text {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.header-link {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* ===== 主体区域 ===== */
.page-main {
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-8) var(--space-8) var(--space-16);
}

.page-title-area {
  text-align: center;
  margin-bottom: var(--space-8);
}

.page-title {
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
}

.page-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}

/* ===== 步骤条 ===== */
.steps-wrapper {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-6) var(--space-8);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
}

/* ===== 表单卡片 ===== */
.form-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-10);
  box-shadow: var(--shadow-sm);
}

.step-section {
  min-height: 300px;
  padding-bottom: var(--space-4);
}

.section-title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-base);
  border-color: var(--color-border-light);
}

.section-hint {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0 0 var(--space-5);
}

.required {
  color: var(--color-danger);
}

/* ===== 信息表单 ===== */
.info-form {
  max-width: 640px;
}

/* ===== 套餐卡片 ===== */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.plan-card {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.plan-card.is-selected {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
  box-shadow: var(--shadow-md);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.plan-name {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.plan-check {
  color: var(--color-primary-500);
  font-size: var(--font-2xl);
}

.plan-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--space-4);
  flex: 1;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  border-top: var(--border-base);
  border-color: var(--color-border-light);
}

.plan-price {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-500);
}

/* ===== 上传区域 ===== */
.upload-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.upload-item {
  max-width: 640px;
}

.upload-label {
  display: block;
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-regular);
  margin-bottom: var(--space-2);
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
}

.upload-icon {
  font-size: var(--font-3xl);
  color: var(--color-text-placeholder);
  margin-bottom: var(--space-2);
}

.upload-text {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.upload-text em {
  color: var(--color-primary-500);
  font-style: normal;
}

/* ===== 确认信息 ===== */
.confirm-desc {
  max-width: 640px;
  margin-bottom: var(--space-5);
}

.confirm-tip {
  max-width: 640px;
}

/* ===== 操作按钮 ===== */
.form-actions {
  display: flex;
  align-items: center;
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: var(--border-base);
  border-color: var(--color-border-light);
}

.actions-spacer {
  flex: 1;
}

.action-primary {
  min-width: 140px;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .page-main {
    padding: var(--space-5) var(--space-4) var(--space-10);
  }

  .form-card {
    padding: var(--space-5) var(--space-4);
  }

  .steps-wrapper {
    padding: var(--space-4) var(--space-4);
  }

  .info-form {
    max-width: 100%;
  }

  .upload-item {
    max-width: 100%;
  }

  .plan-grid {
    grid-template-columns: 1fr;
  }
}
</style>
