<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="appealItem.appeal_no" class="appeal-context">
      <span>{{ appealItem.appeal_no }}</span>
      <span class="context-sep">·</span>
      <span>{{ appealItem.form_name || appealItem.target_name || '-' }}</span>
      <span class="context-sep">·</span>
      <span>{{ statusLabel(appealItem.status) }}</span>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <!-- 驳回 -->
      <template v-if="action === 'reject'">
        <el-form-item label="驳回原因" prop="comment">
          <el-input
            v-model="formData.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因（10-300字）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </template>

      <!-- 要求补充 -->
      <template v-if="action === 'supplement'">
        <el-form-item label="补充说明" prop="comment">
          <el-input
            v-model="formData.comment"
            type="textarea"
            :rows="4"
            placeholder="请说明需要补充的内容（10-300字）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </template>

      <!-- 申请追溯授权 -->
      <template v-if="action === 'trace_auth'">
        <el-alert
          title="追溯授权需学校超级管理员审核，授权前不可查看评价者真实身份"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-form-item label="申请原因" prop="reason">
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="5"
            placeholder="请详细说明需要追溯评价者身份的原因（20-500字）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </template>

      <!-- 完成处理 -->
      <template v-if="action === 'resolve'">
        <el-form-item label="处理结果" prop="result">
          <el-select v-model="formData.result" placeholder="请选择处理结果" style="width: 100%">
            <el-option
              v-for="(label, val) in APPEAL_RESULT_MAP"
              :key="val"
              :label="label"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明" prop="comment">
          <el-input
            v-model="formData.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理说明（10-500字）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </template>

      <!-- 关闭 -->
      <template v-if="action === 'close'">
        <el-form-item label="关闭说明（可选）">
          <el-input
            v-model="formData.comment"
            type="textarea"
            :rows="3"
            placeholder="可填写关闭说明"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :type="confirmBtnType" :loading="submitting" @click="handleSubmit">
        确认{{ dialogTitle }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  APPEAL_STATUS_MAP,
  APPEAL_RESULT_MAP,
  acceptAppealApi,
  rejectAppealApi,
  requestSupplementApi,
  requestTraceAuthorizationApi,
  resolveAppealApi,
  closeAppealApi,
} from '@/api/staffAppeals'

const ACTION_CONFIG = {
  accept: { title: '受理申诉' },
  reject: { title: '驳回申诉' },
  supplement: { title: '要求补充' },
  trace_auth: { title: '申请追溯授权' },
  resolve: { title: '完成处理' },
  close: { title: '关闭申诉' },
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  action: { type: String, default: '' },
  appealItem: { type: Object, default: () => ({}) },
  userContext: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const dialogTitle = computed(() => ACTION_CONFIG[props.action]?.title || '操作')

const confirmBtnType = computed(() => {
  const map = {
    accept: 'primary',
    reject: 'danger',
    supplement: 'warning',
    trace_auth: 'primary',
    resolve: 'success',
    close: 'info',
  }
  return map[props.action] || 'primary'
})

function statusLabel(status) {
  return APPEAL_STATUS_MAP[status] || status || ''
}

const formRef = ref(null)
const submitting = ref(false)

const formData = ref({
  comment: '',
  result: '',
  reason: '',
})

const formRules = computed(() => {
  const rules = {}
  if (props.action === 'reject') {
    rules.comment = [
      { required: true, message: '请输入驳回原因', trigger: 'blur' },
      { min: 10, max: 300, message: '驳回原因需10-300字', trigger: 'blur' },
    ]
  }
  if (props.action === 'supplement') {
    rules.comment = [
      { required: true, message: '请输入补充说明', trigger: 'blur' },
      { min: 10, max: 300, message: '补充说明需10-300字', trigger: 'blur' },
    ]
  }
  if (props.action === 'trace_auth') {
    rules.reason = [
      { required: true, message: '请输入申请原因', trigger: 'blur' },
      { min: 20, max: 500, message: '申请原因需20-500字', trigger: 'blur' },
    ]
  }
  if (props.action === 'resolve') {
    rules.result = [{ required: true, message: '请选择处理结果', trigger: 'change' }]
    rules.comment = [
      { required: true, message: '请输入处理说明', trigger: 'blur' },
      { min: 10, max: 500, message: '处理说明需10-500字', trigger: 'blur' },
    ]
  }
  return rules
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      formData.value = { comment: '', result: '', reason: '' }
    }
  },
)

function handleClose() {
  visible.value = false
}

function getApiParams() {
  const uc = props.userContext
  const item = props.appealItem
  return {
    tenantId: uc.tenantId,
    schoolId: uc.schoolId || null,
    appealId: item.id,
    operatorId: uc.userId,
    appellantUserId: item.appellant_user_id,
    appealNo: item.appeal_no,
    submissionId: item.submission_id,
  }
}

async function handleSubmit() {
  // accept has no form fields
  if (props.action === 'accept') {
    await doAction('accept', async () => {
      const p = getApiParams()
      await acceptAppealApi(p.tenantId, p.schoolId, p.appealId, p.operatorId, p.appellantUserId, p.appealNo)
    })
    return
  }

  // close has optional comment
  if (props.action === 'close') {
    await doAction('close', async () => {
      const p = getApiParams()
      await closeAppealApi(p.tenantId, p.appealId, p.operatorId, p.appealNo, formData.value.comment)
    })
    return
  }

  // validate form
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const confirmMsg = {
    reject: '确认驳回该申诉？',
    supplement: '确认要求申诉人补充材料？',
    trace_auth: '确认发起追溯授权申请？申请后需等待学校管理员审核。',
    resolve: '确认完成该申诉处理？',
  }

  try {
    await ElMessageBox.confirm(confirmMsg[props.action] || '确认执行该操作？', '操作确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  const actionFn = async () => {
    const p = getApiParams()
    switch (props.action) {
      case 'reject':
        await rejectAppealApi(p.tenantId, p.schoolId, p.appealId, p.operatorId, p.appellantUserId, p.appealNo, formData.value.comment)
        break
      case 'supplement':
        await requestSupplementApi(p.tenantId, p.schoolId, p.appealId, p.operatorId, p.appellantUserId, p.appealNo, formData.value.comment)
        break
      case 'trace_auth':
        await requestTraceAuthorizationApi(p.tenantId, p.schoolId, p.appealId, p.submissionId, p.operatorId, p.appellantUserId, p.appealNo, formData.value.reason)
        break
      case 'resolve':
        await resolveAppealApi(p.tenantId, p.schoolId, p.appealId, p.operatorId, p.appellantUserId, p.appealNo, formData.value.result, formData.value.comment)
        break
    }
  }

  await doAction(props.action, actionFn)
}

async function doAction(actionKey, fn) {
  if (actionKey !== 'accept') {
    // confirm already shown in handleSubmit
  } else {
    try {
      await ElMessageBox.confirm('确认受理该申诉？', '受理确认', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }
  }

  submitting.value = true
  try {
    await fn()
    ElMessage.success(`${dialogTitle.value}成功`)
    handleClose()
    emit('success')
  } catch {
    ElMessage.error(`${dialogTitle.value}失败`)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding-top: 16px;
  padding-bottom: 8px;
}

.appeal-context {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary, #999);
  margin-bottom: 16px;
  line-height: 1.4;
}

.context-sep {
  color: var(--el-border-color, #dcdfe6);
}
</style>
