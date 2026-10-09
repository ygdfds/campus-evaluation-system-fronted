<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  formItem: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:visible', 'confirm'])

const submitReason = ref('')

const typeMap = {
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

function handleConfirm() {
  emit('confirm', { submit_reason: submitReason.value })
}

function handleClose() {
  submitReason.value = ''
  emit('update:visible', false)
}

watch(() => props.visible, (visible) => {
  if (visible) submitReason.value = '申请发布评价表单，请审核。'
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="提交审核"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-body">
      <div class="form-info">
        <div class="info-row">
          <span class="info-label">表单名称：</span>
          <span class="info-value">{{ formItem.title }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">表单类型：</span>
          <el-tag size="small" effect="light">{{ typeMap[formItem.type] || formItem.type }}</el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">题目数量：</span>
          <span class="info-value">{{ formItem._question_count || 0 }} 道</span>
        </div>
      </div>

      <el-form label-position="top">
        <el-form-item label="提交说明">
          <el-input
            v-model="submitReason"
            type="textarea"
            :rows="4"
            placeholder="请填写提交审核的说明，可留空"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <el-alert type="info" :closable="false" show-icon>
        提交后将进入学校管理员审核流程，审核通过后表单会正式发布。
      </el-alert>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认提交</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-info {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.info-label {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}

.info-value {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}

.dialog-body :deep(.el-form-item) {
  margin-bottom: 0;
}
</style>