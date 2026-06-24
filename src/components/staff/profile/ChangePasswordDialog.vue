<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'ChangePasswordDialog' })

defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'submit'])

const formRef = ref(null)
const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

function handleClose() {
  emit('update:visible', false)
  resetForm()
}

function resetForm() {
  formData.oldPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    // 检查新密码不能与原密码相同
    if (formData.oldPassword === formData.newPassword) {
      ElMessage.error('新密码不能与原密码相同')
      return
    }
    emit('submit', {
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    })
    resetForm()
  } catch {
    // validation failed
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="修改密码"
    width="420px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px" size="default">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="formData.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="formData.newPassword" type="password" show-password placeholder="至少8位，建议包含字母和数字" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button class="btn-green" @click="handleSubmit">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.btn-green {
  --el-button-bg-color: var(--color-primary, #2d6a2e);
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
  color: #fff;
}
</style>
