<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Paperclip } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/request'
import { createHelpTicketApi } from '@/api/staffHelp'
import { dataOf } from '@/api/backend'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'submitted'])
const userStore = useUserStore()

const formRef = ref(null)
const submitting = ref(false)
const files = ref([])
const form = ref({ category: '', priority: 'normal', title: '', content: '', attachment_file_ids: [] })

const categoryOptions = [
  { label: '权限与数据', value: 'permission' },
  { label: '评价管理', value: 'evaluation' },
  { label: '反馈处理', value: 'feedback' },
  { label: '申诉处理', value: 'appeal' },
  { label: '消息通知', value: 'notification' },
  { label: '账号安全', value: 'account' },
  { label: '系统问题', value: 'system' },
]

const rules = {
  category: [{ required: true, message: '请选择问题分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { min: 10, message: '问题描述至少10个字', trigger: 'blur' },
  ],
}

watch(() => props.modelValue, (visible) => {
  if (visible) {
    form.value = { category: '', priority: 'normal', title: '', content: '', attachment_file_ids: [] }
    files.value = []
  }
})

function removeFile(index) {
  files.value.splice(index, 1)
}

async function handleFileSelect(event) {
  const selected = Array.from(event.target.files || [])
  event.target.value = ''
  if (files.value.length + selected.length > 3) {
    ElMessage.warning('最多上传3个附件')
    return
  }
  for (const file of selected) {
    try {
      const uploaded = await request.post('/files/upload', (() => {
        const data = new FormData()
        data.append('file', file)
        data.append('bizType', 'help_ticket')
        return data
      })(), { headers: { 'Content-Type': 'multipart/form-data' } }).then(dataOf)
      files.value.push({ file, id: uploaded.id, name: file.name, size: file.size })
    } catch (error) {
      ElMessage.error(error.message || '附件上传失败')
    }
  }
  form.value.attachment_file_ids = files.value.map((file) => file.id)
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const info = userStore.userInfo || {}
    await createHelpTicketApi(form.value, {
      tenantId: userStore.tenantId || info.tenant_id,
      userId: info.id || info.user_id,
      schoolId: userStore.schoolId || info.school_id,
    })
    ElMessage.success('工单提交成功')
    emit('update:modelValue', false)
    emit('submitted')
  } catch (error) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="600px"
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div>
        <h3>提交帮助请求</h3>
        <p>描述遇到的问题，工作人员会尽快处理。</p>
      </div>
    </template>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="问题分类" prop="category">
        <el-select v-model="form.category" placeholder="请选择问题分类" style="width: 100%">
          <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级">
        <el-radio-group v-model="form.priority">
          <el-radio value="normal">普通</el-radio>
          <el-radio value="urgent">紧急</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="问题描述" prop="content">
        <el-input v-model="form.content" type="textarea" :rows="6" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="附件（最多3个）">
        <input type="file" multiple @change="handleFileSelect" />
        <div v-for="(file, index) in files" :key="file.id" class="file-row">
          <span><Paperclip /> {{ file.name }}</span>
          <el-button text type="danger" :icon="Delete" @click="removeFile(index)" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
    </template>
  </el-drawer>
</template>
