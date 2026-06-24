<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'StaffNotificationPreferencePanel' })

const props = defineProps({
  preference: { type: Object, default: null },
})

const emit = defineEmits(['save'])

const loading = ref(false)
const savedKey = ref('')
const formData = ref({
  feedback_notice: true,
  evaluation_notice: true,
  appeal_notice: true,
  report_warning_notice: true,
  system_notice: true,
})

watch(() => props.preference, (val) => {
  if (val) {
    formData.value = {
      feedback_notice: val.feedback_notice ?? true,
      evaluation_notice: val.evaluation_notice ?? true,
      appeal_notice: val.appeal_notice ?? true,
      report_warning_notice: val.report_warning_notice ?? true,
      system_notice: val.system_notice ?? true,
    }
  }
}, { immediate: true })

const items = [
  { key: 'feedback_notice', label: '反馈处理提醒', desc: '有新反馈需要处理时通知' },
  { key: 'evaluation_notice', label: '评价管理提醒', desc: '评价表单审核、发布等通知' },
  { key: 'appeal_notice', label: '申诉处理提醒', desc: '有新申诉需要受理或处理完成时通知' },
  { key: 'report_warning_notice', label: '低分预警提醒', desc: '课程评价均分低于阈值时预警' },
  { key: 'system_notice', label: '系统通知', desc: '系统维护、账号变更等通知' },
]

async function handleToggle(key, val) {
  formData.value[key] = val
  loading.value = true
  try {
    emit('save', { ...formData.value })
    savedKey.value = key
    setTimeout(() => { savedKey.value = '' }, 1500)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <h3 class="panel-title">通知偏好</h3>
      <span class="save-hint">修改后自动保存</span>
    </div>

    <div class="pref-list">
      <div v-for="item in items" :key="item.key" class="pref-item">
        <div class="pref-info">
          <div class="pref-label">{{ item.label }}</div>
          <div class="pref-desc">{{ item.desc }}</div>
        </div>
        <div class="pref-action">
          <el-switch
            :model-value="formData[item.key]"
            :loading="loading"
            active-color="var(--color-primary, #2d6a2e)"
            @change="(val) => handleToggle(item.key, val)"
          />
          <span v-if="savedKey === item.key" class="saved-tag">已保存</span>
        </div>
      </div>
    </div>

    <div class="pref-notes">
      <div class="pref-note-item">
        <span class="note-dot" />
        关闭某类提醒后，不影响历史消息查看
      </div>
      <div class="pref-note-item">
        <span class="note-dot" />
        紧急系统通知仍可能强制发送
      </div>
      <div class="pref-note-item">
        <span class="note-dot" />
        设置修改后自动保存
      </div>
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
.save-hint {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted);
  background: var(--color-primary-50, #e8f5e9);
  padding: 2px 8px;
  border-radius: var(--radius-sm, 4px);
}
.pref-list { display: flex; flex-direction: column; gap: var(--space-1, 4px); }
.pref-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-3, 12px);
  border-radius: var(--radius-md, 8px);
  transition: background 0.15s;
}
.pref-item:hover { background: var(--color-bg-page, #f7f8fa); }
.pref-info { flex: 1; }
.pref-label { font-size: var(--font-sm, 13px); color: var(--color-text-heading); font-weight: 500; }
.pref-desc { font-size: var(--font-xs, 12px); color: var(--color-text-muted); margin-top: 2px; }
.pref-action {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  flex-shrink: 0;
}
.saved-tag {
  font-size: var(--font-xs, 12px);
  color: var(--color-primary, #2d6a2e);
  background: var(--color-primary-50, #e8f5e9);
  padding: 1px 6px;
  border-radius: var(--radius-sm, 4px);
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
.pref-notes {
  margin-top: var(--space-5, 20px);
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--color-bg-page, #f7f8fa);
  border-radius: var(--radius-md, 8px);
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}
.pref-note-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2, 8px);
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted);
  line-height: 1.5;
}
.note-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary, #2d6a2e);
  flex-shrink: 0;
  margin-top: 5px;
}
</style>
