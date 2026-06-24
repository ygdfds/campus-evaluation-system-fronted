<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Paperclip, Close } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { createHelpTicketApi } from '@/api/staffHelp'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const userStore = useUserStore()

// 表单数据
const form = ref({
  category: '',
  priority: 'normal',
  title: '',
  content: '',
  attachment_file_ids: [],
})

const submitting = ref(false)

// 分类选项
const categoryOptions = [
  { label: '权限与数据', value: 'permission' },
  { label: '评价管理', value: 'evaluation' },
  { label: '反馈处理', value: 'feedback' },
  { label: '申诉处理', value: 'appeal' },
  { label: '消息通知', value: 'notification' },
  { label: '账号安全', value: 'account' },
  { label: '系统问题', value: 'system' },
]

// 优先级选项
const priorityOptions = [
  { label: '普通', value: 'normal' },
  { label: '紧急', value: 'urgent' },
]

// 模拟可选附件列表
const mockAttachments = ref([
  { id: 1, name: '错误截图.png', size: '245 KB' },
  { id: 2, name: '操作日志.txt', size: '12 KB' },
  { id: 3, name: '配置文件.json', size: '3 KB' },
])

// 已添加的附件
const addedAttachments = computed(() =>
  mockAttachments.value.filter(f => form.value.attachment_file_ids.includes(f.id))
)

// 可选附件（排除已添加的）
const availableAttachments = computed(() =>
  mockAttachments.value.filter(f => !form.value.attachment_file_ids.includes(f.id))
)

const showAttachmentPicker = ref(false)

function showAddAttachment() {
  if (availableAttachments.value.length === 0) {
    ElMessage.warning('没有更多可选附件')
    return
  }
  showAttachmentPicker.value = true
}

// 表单校验
const rules = {
  category: [{ required: true, message: '请选择问题分类', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 50, message: '标题最多50字', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { min: 10, message: '问题描述至少10字', trigger: 'blur' },
    { max: 500, message: '问题描述最多500字', trigger: 'blur' },
  ],
}

const formRef = ref(null)

// 打开/关闭
watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
  }
})

function resetForm() {
  form.value = {
    category: '',
    priority: 'normal',
    title: '',
    content: '',
    attachment_file_ids: [],
  }
}

// 添加附件
function addAttachment(file) {
  if (form.value.attachment_file_ids.length >= 3) {
    ElMessage.warning('最多添加3个附件')
    return
  }
  form.value.attachment_file_ids.push(file.id)
}

// 删除附件
function removeAttachment(fileId) {
  form.value.attachment_file_ids = form.value.attachment_file_ids.filter(id => id !== fileId)
}

// 提交
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  submitting.value = true
  try {
    const ctx = getUserContext()
    await createHelpTicketApi(form.value, ctx)
    ElMessage.success('工单提交成功，我们将尽快处理')
    emit('update:modelValue', false)
    emit('submitted')
  } catch (err) {
    ElMessage.error(err.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function getUserContext() {
  const info = userStore.userInfo || {}
  return {
    tenantId: userStore.tenantId || info.tenant_id,
    userId: info.id || info.user_id || info.account_id,
    schoolId: info.school_id || 1,
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="600px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <h3 class="drawer-title">提交帮助请求</h3>
        <p class="drawer-desc">描述你遇到的问题，工作人员会尽快处理</p>
      </div>
    </template>
    <div class="ticket-form">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="form-content"
      >
        <el-form-item label="问题分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择问题分类" style="width: 100%">
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请简要描述问题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="问题描述" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            placeholder="请详细描述您遇到的问题，至少10字"
            :rows="6"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="附件（最多3个）">
          <div class="attachment-section">
            <div v-if="addedAttachments.length > 0" class="attachment-list">
              <div
                v-for="file in addedAttachments"
                :key="file.id"
                class="attachment-item selected"
              >
                <div class="attachment-info">
                  <span class="attachment-name">{{ file.name }}</span>
                  <span class="attachment-size">{{ file.size }}</span>
                </div>
                <el-icon class="attachment-delete" @click="removeAttachment(file.id)">
                  <Delete />
                </el-icon>
              </div>
            </div>
            <div
              v-if="form.attachment_file_ids.length < 3"
              class="add-attachment-btn"
              @click="showAddAttachment"
            >
              <el-icon :size="16"><Paperclip /></el-icon>
              <span>添加附件</span>
            </div>
            <!-- 可选附件弹出 -->
            <div v-if="showAttachmentPicker" class="attachment-picker-overlay" @click.self="showAttachmentPicker = false">
              <div class="attachment-picker">
                <div class="picker-header">
                  <span>选择附件</span>
                  <el-icon @click="showAttachmentPicker = false"><Close /></el-icon>
                </div>
                <div
                  v-for="file in availableAttachments"
                  :key="file.id"
                  class="picker-item"
                  @click="addAttachment(file); showAttachmentPicker = false"
                >
                  <span class="attachment-name">{{ file.name }}</span>
                  <span class="attachment-size">{{ file.size }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.ticket-form {
  padding: var(--space-2, 8px) 0;
}

.form-content :deep(.el-form-item__label) {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-heading, #1a2e1a);
}

.attachment-section {
  width: 100%;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--color-bg-page, #f5f7f0);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.attachment-item:hover {
  border-color: var(--color-primary-light-5, #95d475);
}

.attachment-item.selected {
  background: var(--color-primary-light-9, #f0f9eb);
  border-color: var(--color-primary, #2d7a4f);
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
}

.attachment-name {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-heading, #1a2e1a);
}

.attachment-size {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted, #6b7c6b);
}

.attachment-delete {
  color: var(--color-danger, #f56c6c);
}

.attachment-add {
  color: var(--color-primary, #2d7a4f);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3, 12px);
}

.drawer-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-title {
  font-size: var(--font-lg, 18px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0;
}

.drawer-desc {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-muted, #6b7c6b);
  margin: 0;
}

.add-attachment-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border: 1px dashed var(--color-border, #d0d7d0);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-size: var(--font-sm, 14px);
  color: var(--color-text-muted, #6b7c6b);
  transition: all 0.2s ease;
}

.add-attachment-btn:hover {
  border-color: var(--color-primary, #2d6a2e);
  color: var(--color-primary, #2d6a2e);
}

.attachment-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-picker {
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4, 16px);
  min-width: 300px;
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.1));
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3, 12px);
  font-size: var(--font-base, 15px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-heading, #1a2e1a);
}

.picker-header .el-icon {
  cursor: pointer;
  color: var(--color-text-muted, #6b7c6b);
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background 0.2s ease;
}

.picker-item:hover {
  background: var(--color-primary-light-9, #f0f9eb);
}

/* 主按钮绿色覆盖 */
:deep(.el-button--primary) {
  --el-button-bg-color: var(--color-primary, #2d6a2e);
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
}
</style>
