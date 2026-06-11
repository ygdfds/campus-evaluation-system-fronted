<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/common/PageHeader.vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'ProfileView' })

const userStore = useUserStore()
const editing = ref(false)

const profileForm = reactive({
  realName: userStore.realName || '',
  phone: userStore.userInfo?.phone || '',
  email: userStore.userInfo?.email || '',
  department: userStore.userInfo?.department || '',
})

const formRef = ref(null)

const rules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
}

function handleEdit() {
  editing.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  userStore.updateUserInfo(profileForm)
  ElMessage.success('个人信息已更新')
  editing.value = false
}

function handleCancel() {
  editing.value = false
}
</script>

<template>
  <div class="page-container">
    <PageHeader title="个人信息" subtitle="查看和编辑个人资料" />
    <el-card shadow="hover" class="section-card">
      <el-form
        ref="formRef"
        :model="profileForm"
        :rules="rules"
        label-width="100px"
        :disabled="!editing"
        style="max-width: 600px"
      >
        <el-form-item label="用户名">
          <el-input :model-value="userStore.userInfo?.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-tag>{{ userStore.roleName }}</el-tag>
        </el-form-item>
        <el-form-item v-if="userStore.schoolName" label="所属学校">
          <el-input :model-value="userStore.schoolName" disabled />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="profileForm.realName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profileForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="profileForm.department" disabled />
        </el-form-item>
        <el-form-item>
          <template v-if="!editing">
            <el-button type="primary" @click="handleEdit">编辑资料</el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="handleSave">保存</el-button>
            <el-button @click="handleCancel">取消</el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: var(--space-5); }
.section-card { border-radius: var(--radius-lg); }
</style>
