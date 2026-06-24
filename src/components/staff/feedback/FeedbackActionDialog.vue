<script setup>
import { computed, ref, watch } from 'vue'

defineOptions({ name: 'FeedbackActionDialog' })

const props = defineProps({
  visible: { type: Boolean, default: false },
  action: { type: String, default: '' }, // accept, progress, transfer, resolve, reject
  item: { type: Object, default: () => ({}) },
  orgOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:visible', 'confirm'])

const formRef = ref(null)
const form = ref({ content: '', targetOrgId: null, reason: '' })

const dialogTitle = computed(() => {
  const map = {
    accept: '受理反馈',
    progress: '更新进度',
    transfer: '转交处理',
    resolve: '办结反馈',
    reject: '驳回反馈',
  }
  return map[props.action] || '操作确认'
})

const placeholderMap = {
  accept: '确认受理该反馈？',
  progress: '请输入处理说明（至少5字）',
  transfer: '请输入转交原因（必填）',
  resolve: '请输入办结说明（至少10字）',
  reject: '请输入驳回原因（至少10字）',
}

const minLength = computed(() => {
  if (props.action === 'progress') return 5
  if (props.action === 'resolve' || props.action === 'reject') return 10
  return 0
})

const rules = computed(() => {
  const r = {}
  if (props.action === 'progress' || props.action === 'resolve' || props.action === 'reject') {
    r.content = [
      { required: true, message: placeholderMap[props.action], trigger: 'blur' },
      { min: minLength.value, message: `至少输入${minLength.value}个字符`, trigger: 'blur' },
    ]
  }
  if (props.action === 'transfer') {
    r.targetOrgId = [{ required: true, message: '请选择转交部门', trigger: 'change' }]
    r.reason = [
      { required: true, message: '请输入转交原因', trigger: 'blur' },
      { min: 5, message: '转交原因至少5个字符', trigger: 'blur' },
    ]
  }
  return r
})

const showContent = computed(() => ['progress', 'resolve', 'reject'].includes(props.action))
const showTransfer = computed(() => props.action === 'transfer')
const showAccept = computed(() => props.action === 'accept')

watch(() => props.visible, (val) => {
  if (val) {
    form.value = { content: '', targetOrgId: null, reason: '' }
  }
})

async function handleConfirm() {
  if (showAccept.value) {
    emit('confirm', { action: props.action })
    return
  }
  if (formRef.value) {
    try {
      await formRef.value.validate()
    } catch {
      return
    }
  }
  if (showTransfer.value) {
    emit('confirm', { action: props.action, targetOrgId: form.value.targetOrgId, reason: form.value.reason })
  } else {
    emit('confirm', { action: props.action, content: form.value.content })
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-if="showAccept" class="action-confirm">
      <el-icon :size="48" color="var(--color-accent-user-700)"><CircleCheck /></el-icon>
      <p>确认受理该反馈？受理后将进入处理中状态。</p>
    </div>

    <el-form v-if="showContent" ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="处理说明" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          :placeholder="placeholderMap[action]"
          maxlength="300"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <el-form v-if="showTransfer" ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="转交部门" prop="targetOrgId">
        <el-select v-model="form.targetOrgId" placeholder="请选择转交部门" style="width: 100%">
          <el-option v-for="org in orgOptions" :key="org.id" :label="org.name" :value="org.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="转交原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入转交原因（至少5字）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        :type="action === 'reject' ? 'danger' : 'primary'"
        @click="handleConfirm"
      >
        确认{{ action === 'reject' ? '驳回' : '' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { CircleCheck } from '@element-plus/icons-vue'
export default { components: { CircleCheck } }
</script>

<style scoped>
.action-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  text-align: center;
}

.action-confirm p {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
