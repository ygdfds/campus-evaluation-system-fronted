<script setup>
import { computed } from 'vue'
import { Plus, Delete, Top, Bottom } from '@element-plus/icons-vue'

defineOptions({ name: 'QuestionEditor' })

const props = defineProps({
  questions: { type: Array, default: () => [] },
  index: { type: Number, required: true },
})

const emit = defineEmits(['update:questions'])

const question = computed({
  get: () => props.questions[props.index],
  set: (val) => {
    const arr = [...props.questions]
    arr[props.index] = val
    emit('update:questions', arr)
  },
})

const typeOptions = [
  { label: '评分题', value: 'rating' },
  { label: '文本题', value: 'text' },
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
]

const showOptions = computed(() => ['single', 'multiple'].includes(question.value?.type))
const showMaxScore = computed(() => question.value?.type === 'rating')
const showMinLength = computed(() => question.value?.type === 'text')

function updateField(field, value) {
  question.value = { ...question.value, [field]: value }
}

function addOption() {
  const opts = [...(question.value._options || [])]
  opts.push({ option_text: '', sort_order: opts.length + 1 })
  updateField('_options', opts)
}

function removeOption(idx) {
  const opts = [...(question.value._options || [])]
  opts.splice(idx, 1)
  opts.forEach((o, i) => { o.sort_order = i + 1 })
  updateField('_options', opts)
}

function updateOptionText(idx, text) {
  const opts = [...(question.value._options || [])]
  opts[idx] = { ...opts[idx], option_text: text }
  updateField('_options', opts)
}

function moveUp() {
  if (props.index <= 0) return
  const arr = [...props.questions]
  ;[arr[props.index - 1], arr[props.index]] = [arr[props.index], arr[props.index - 1]]
  arr.forEach((q, i) => { q.sort_order = i + 1 })
  emit('update:questions', arr)
}

function moveDown() {
  if (props.index >= props.questions.length - 1) return
  const arr = [...props.questions]
  ;[arr[props.index], arr[props.index + 1]] = [arr[props.index + 1], arr[props.index]]
  arr.forEach((q, i) => { q.sort_order = i + 1 })
  emit('update:questions', arr)
}

function removeQuestion() {
  const arr = [...props.questions]
  arr.splice(props.index, 1)
  arr.forEach((q, i) => { q.sort_order = i + 1 })
  emit('update:questions', arr)
}
</script>

<template>
  <div class="question-editor">
    <div class="question-header">
      <span class="question-index">题目 {{ index + 1 }}</span>
      <div class="question-actions">
        <el-button :icon="Top" size="small" text :disabled="index <= 0" @click="moveUp" />
        <el-button :icon="Bottom" size="small" text :disabled="index >= questions.length - 1" @click="moveDown" />
        <el-button :icon="Delete" size="small" type="danger" text @click="removeQuestion" />
      </div>
    </div>

    <div class="question-body">
      <el-form-item label="题目标题" required>
        <el-input v-model="question.title" placeholder="请输入题目标题" maxlength="200" show-word-limit @update:model-value="updateField('title', $event)" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="题型">
            <el-select :model-value="question.type" @update:model-value="updateField('type', $event)" style="width: 100%">
              <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否必填">
            <el-switch :model-value="question.required" @update:model-value="updateField('required', $event)" />
          </el-form-item>
        </el-col>
        <el-col v-if="showMaxScore" :span="8">
          <el-form-item label="最高分值">
            <el-input-number :model-value="question.max_score" :min="1" :max="10" @update:model-value="updateField('max_score', $event)" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col v-if="showMinLength" :span="8">
          <el-form-item label="最少字数">
            <el-input-number :model-value="question.min_length" :min="0" :max="500" @update:model-value="updateField('min_length', $event)" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 选项编辑 -->
      <div v-if="showOptions" class="options-section">
        <div class="options-label">选项列表</div>
        <div v-for="(opt, oi) in (question._options || [])" :key="oi" class="option-row">
          <span class="option-index">{{ oi + 1 }}.</span>
          <el-input :model-value="opt.option_text || opt.text" placeholder="请输入选项内容" @update:model-value="updateOptionText(oi, $event)" />
          <el-button :icon="Delete" size="small" text type="danger" @click="removeOption(oi)" />
        </div>
        <el-button :icon="Plus" size="small" text type="primary" @click="addOption">添加选项</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-editor {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.question-index {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-accent-user-700);
}

.question-actions {
  display: flex;
  gap: var(--space-1);
}

.question-body :deep(.el-form-item) {
  margin-bottom: var(--space-3);
}

.options-section {
  margin-top: var(--space-2);
}

.options-label {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-bottom: var(--space-2);
}

.option-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.option-index {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  width: 20px;
  text-align: right;
  flex-shrink: 0;
}
</style>
