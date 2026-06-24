<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'StaffBasicInfoPanel' })

const props = defineProps({
  profile: { type: Object, default: null },
  account: { type: Object, default: null },
  schoolName: { type: String, default: '' },
  orgName: { type: String, default: '' },
})

const emit = defineEmits(['save'])

const editing = ref(false)
const formData = reactive({
  phone: '',
  email: '',
  office_phone: '',
  intro: '',
})
const originalData = reactive({
  phone: '',
  email: '',
  office_phone: '',
  intro: '',
})

// 同步数据
watch(() => [props.profile, props.account], () => {
  const p = props.profile || {}
  const a = props.account || {}
  formData.phone = a.phone || ''
  formData.email = a.email || ''
  formData.office_phone = p.office_phone || ''
  formData.intro = p.intro || ''
  Object.assign(originalData, { ...formData })
}, { immediate: true })

const rules = {
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  intro: [{ max: 200, message: '简介不超过200字', trigger: 'blur' }],
}

const formRef = ref(null)

function startEdit() {
  Object.assign(formData, originalData)
  editing.value = true
}

function cancelEdit() {
  Object.assign(formData, originalData)
  editing.value = false
}

async function handleSave() {
  try {
    await formRef.value?.validate()
    emit('save', { ...formData })
    Object.assign(originalData, { ...formData })
    editing.value = false
    ElMessage.success('保存成功')
  } catch (e) {
    if (e !== false) ElMessage.error('请检查输入格式')
  }
}

const genderMap = { male: '男', female: '女' }

const statusMap = {
  active: { label: '正常', type: 'success' },
  inactive: { label: '已停用', type: 'danger' },
  locked: { label: '已锁定', type: 'warning' },
}

function getStatusInfo(status) {
  return statusMap[status] || { label: status || '未知', type: 'info' }
}
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <h3 class="panel-title">基本资料</h3>
      <el-button v-if="!editing" size="small" class="btn-green-outline" @click="startEdit">编辑资料</el-button>
      <div v-else class="edit-actions">
        <el-button size="small" @click="cancelEdit">取消</el-button>
        <el-button size="small" class="btn-green" @click="handleSave">保存</el-button>
      </div>
    </div>

    <!-- 只读模式：文本展示 -->
    <template v-if="!editing">
      <div class="info-grid">
        <div class="info-section">
          <h4 class="section-label">个人信息</h4>
          <div class="info-row">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ profile?.real_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">工号</span>
            <span class="info-value">{{ profile?.no_work || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">性别</span>
            <span class="info-value">{{ genderMap[profile?.gender] || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">所属学校</span>
            <span class="info-value">{{ schoolName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">所属组织</span>
            <span class="info-value">{{ orgName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">账号状态</span>
            <el-tag :type="getStatusInfo(account?.account_status || account?.status).type" size="small">
              {{ getStatusInfo(account?.account_status || account?.status).label }}
            </el-tag>
          </div>
        </div>
        <div class="info-section">
          <h4 class="section-label">联系方式</h4>
          <div class="info-row">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ formData.phone || '暂未填写' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ formData.email || '暂未填写' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">办公电话</span>
            <span class="info-value">{{ formData.office_phone || '暂未填写' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">个人简介</span>
            <span class="info-value intro-value">{{ formData.intro || '暂未填写' }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 编辑模式：输入框 -->
    <template v-else>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px" size="default">
        <div class="info-grid">
          <div class="info-section">
            <h4 class="section-label">个人信息</h4>
            <el-form-item label="姓名">
              <span class="readonly-text">{{ profile?.real_name || '-' }}</span>
            </el-form-item>
            <el-form-item label="工号">
              <span class="readonly-text">{{ profile?.no_work || '-' }}</span>
            </el-form-item>
            <el-form-item label="性别">
              <span class="readonly-text">{{ genderMap[profile?.gender] || '-' }}</span>
            </el-form-item>
            <el-form-item label="所属学校">
              <span class="readonly-text">{{ schoolName || '-' }}</span>
            </el-form-item>
            <el-form-item label="所属组织">
              <span class="readonly-text">{{ orgName || '-' }}</span>
            </el-form-item>
            <el-form-item label="账号状态">
              <el-tag :type="getStatusInfo(account?.account_status || account?.status).type" size="small">
                {{ getStatusInfo(account?.account_status || account?.status).label }}
              </el-tag>
            </el-form-item>
          </div>
          <div class="info-section">
            <h4 class="section-label">联系方式</h4>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="办公电话" prop="office_phone">
              <el-input v-model="formData.office_phone" placeholder="请输入办公电话" />
            </el-form-item>
            <el-form-item label="个人简介" prop="intro">
              <el-input v-model="formData.intro" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入个人简介" />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </template>

    <div class="panel-note">
      资料中的姓名、工号、学校和所属组织由学校管理员维护，如需调整请联系管理员。
    </div>
  </div>
</template>

<style scoped>
.panel-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
  padding: var(--space-5, 20px) var(--space-6, 24px);
  min-height: 420px;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--space-4, 16px);
  padding-bottom: var(--space-3, 12px);
  border-bottom: 1px solid var(--color-border-light, #f0f0f0);
}
.panel-title { font-size: var(--font-md, 15px); font-weight: 600; color: var(--color-text-heading); margin: 0; }
.edit-actions { display: flex; gap: var(--space-2, 8px); }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4, 16px); }
.info-section { }
.section-label { font-size: var(--font-sm, 13px); color: var(--color-text-secondary); font-weight: 500; margin: 0 0 var(--space-3, 12px); }
.info-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: var(--space-2, 8px) 0;
  border-bottom: 1px solid var(--color-border-lighter, #f5f5f5);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: var(--font-sm, 13px); color: var(--color-text-secondary); flex-shrink: 0; min-width: 70px; }
.info-value { font-size: var(--font-sm, 13px); color: var(--color-text-heading); text-align: right; word-break: break-all; }
.intro-value { white-space: pre-wrap; line-height: 1.5; max-width: 60%; }
.readonly-text { font-size: var(--font-sm, 13px); color: var(--color-text-body); }
.btn-green {
  --el-button-bg-color: var(--color-primary, #2d6a2e);
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
  color: #fff;
}
.btn-green-outline {
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-text-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-50, #e8f5e9);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-text-color: var(--color-primary-hover, #3d8a3e);
}
.panel-note {
  margin-top: var(--space-5, 20px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--color-primary-50, #e8f5e9);
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-xs, 12px);
  color: var(--color-text-secondary);
  line-height: 1.5;
}
@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>
