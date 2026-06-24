<script setup>
import { computed } from 'vue'

defineOptions({ name: 'QuestionRenderer' })

const props = defineProps({
  question: { type: Object, required: true },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number, Array], default: null },
  scoreValue: { type: Number, default: null },
  index: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:scoreValue'])

const stars = computed(() => {
  const max = props.question.max_score || 5
  return Array.from({ length: max }, (_, i) => i + 1)
})

const ratingLabels = { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' }

const currentRatingLabel = computed(() => {
  if (!props.scoreValue) return ''
  return ratingLabels[props.scoreValue] || `${props.scoreValue} 分`
})

const maxTextLength = computed(() => props.question.max_length || 200)

function handleRatingClick(val) {
  if (props.disabled) return
  emit('update:scoreValue', val)
}

function handleTextInput(e) {
  emit('update:modelValue', e.target.value)
}

function handleOptionToggle(optionId) {
  if (props.disabled) return
  if (props.question.type === 'single') {
    emit('update:modelValue', String(optionId))
  } else if (props.question.type === 'multiple') {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = current.indexOf(String(optionId))
    if (idx >= 0) current.splice(idx, 1)
    else current.push(String(optionId))
    emit('update:modelValue', current)
  }
}

function isOptionSelected(optionId) {
  if (props.question.type === 'single') {
    return props.modelValue === String(optionId)
  }
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(String(optionId))
  }
  return false
}

const typeTagClass = computed(() => {
  const map = { rating: 'tag-rating', single: 'tag-single', multiple: 'tag-multiple', text: 'tag-text', file: 'tag-file' }
  return map[props.question.type] || ''
})

const typeLabel = computed(() => {
  const map = { rating: '评分', single: '单选', multiple: '多选', text: '文本', file: '附件' }
  return map[props.question.type] || ''
})
</script>

<template>
  <div class="question-item" :class="{ 'is-required': question.required, 'has-error': error, 'is-disabled': disabled }">
    <div class="question-header">
      <span class="question-index">{{ index }}.</span>
      <span class="question-type-tag" :class="typeTagClass">{{ typeLabel }}</span>
      <span class="required-mark" v-if="question.required">*</span>
    </div>
    <div class="question-title">{{ question.title }}</div>

    <!-- 评分题 -->
    <div v-if="question.type === 'rating'" class="rating-group">
      <div class="star-rating">
        <span
          v-for="star in stars"
          :key="star"
          class="star"
          :class="{ active: scoreValue && star <= scoreValue, disabled: disabled }"
          @click="handleRatingClick(star)"
        >★</span>
      </div>
      <span class="rating-label" v-if="scoreValue">{{ scoreValue }} 分 · {{ currentRatingLabel }}</span>
      <span class="rating-label rating-placeholder" v-else>请点击评分</span>
    </div>

    <!-- 单选/多选 -->
    <div v-else-if="question.type === 'single' || question.type === 'multiple'" class="option-group">
      <div
        v-for="opt in options"
        :key="opt.id"
        class="option-item"
        :class="{ selected: isOptionSelected(opt.id), disabled: disabled }"
        @click="handleOptionToggle(opt.id)"
      >
        <span class="option-indicator">
          <span v-if="question.type === 'single'" class="radio-dot" :class="{ checked: isOptionSelected(opt.id) }" />
          <span v-else class="checkbox-dot" :class="{ checked: isOptionSelected(opt.id) }" />
        </span>
        <span class="option-text">{{ opt.option_text }}</span>
      </div>
    </div>

    <!-- 文本题 -->
    <div v-else-if="question.type === 'text'" class="text-input-group">
      <textarea
        class="text-input"
        :class="{ 'has-error': error }"
        :placeholder="question.min_length ? `请输入至少 ${question.min_length} 字` : '请输入您的回答'"
        :value="modelValue || ''"
        :disabled="disabled"
        @input="handleTextInput"
        rows="4"
        :maxlength="maxTextLength"
      />
      <div class="text-hint-row">
        <span v-if="question.min_length" class="text-min-hint">至少 {{ question.min_length }} 字</span>
        <span class="text-count">{{ (modelValue || '').length }} / {{ maxTextLength }}</span>
      </div>
    </div>

    <!-- 文件上传题 (mock) -->
    <div v-else-if="question.type === 'file'" class="file-input-group">
      <div class="file-upload-area" :class="{ disabled: disabled }">
        <span>点击或拖拽上传文件（Mock 环境暂不支持真实上传）</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="question-error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.question-item {
  padding: var(--space-5) var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  margin-bottom: var(--space-5);
  transition: border-color 0.2s;
}

.question-item.has-error {
  border-color: var(--color-danger);
}

.question-item.is-disabled {
  opacity: 0.7;
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.question-index {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.question-type-tag {
  font-size: var(--font-2xs);
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

.tag-rating { background: var(--color-primary-50); color: var(--color-accent-user-700); }
.tag-single { background: #e3f2fd; color: #1565c0; }
.tag-multiple { background: #fff3e0; color: #e65100; }
.tag-text { background: var(--color-primary-50); color: var(--color-accent-user-700); }
.tag-file { background: var(--color-info-light); color: var(--color-info); }

.required-mark {
  color: var(--color-danger);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-md);
}

.question-title {
  font-size: 15px;
  color: var(--color-text-body);
  margin-bottom: var(--space-4);
  line-height: var(--line-height-relaxed);
}

/* 评分题 */
.rating-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.star-rating {
  display: flex;
  gap: var(--space-2);
}

.star {
  font-size: 28px;
  color: var(--color-border-dark);
  cursor: pointer;
  transition: color 0.15s, transform 0.15s;
  user-select: none;
}

.star:hover:not(.disabled) {
  transform: scale(1.15);
}

.star.active {
  color: #ffc107;
}

.star.disabled {
  cursor: default;
}

.rating-label {
  font-size: var(--font-sm);
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-medium);
}

.rating-placeholder {
  color: var(--color-text-placeholder);
  font-weight: var(--font-weight-normal);
}

/* 单选/多选 */
.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
}

.option-item:hover:not(.disabled) {
  border-color: var(--color-primary-200);
  background: var(--color-primary-50);
}

.option-item.selected {
  border-color: var(--color-accent-user-700);
  background: var(--color-primary-50);
}

.option-item.disabled {
  cursor: default;
}

.option-indicator {
  flex-shrink: 0;
}

.radio-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-text-placeholder);
  position: relative;
}

.radio-dot.checked {
  border-color: var(--color-accent-user-700);
}

.radio-dot.checked::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-accent-user-700);
}

.checkbox-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-text-placeholder);
  position: relative;
}

.checkbox-dot.checked {
  border-color: var(--color-accent-user-700);
  background: var(--color-accent-user-700);
}

.checkbox-dot.checked::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 1px;
  font-size: 12px;
  color: white;
  font-weight: bold;
}

.option-text {
  font-size: var(--font-base);
  color: var(--color-text-body);
}

/* 文本题 */
.text-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.text-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  color: var(--color-text-body);
  background: var(--color-bg-card);
  resize: vertical;
  font-family: inherit;
  line-height: var(--line-height-relaxed);
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-accent-user-700);
}

.text-input.has-error {
  border-color: var(--color-danger);
}

.text-input:disabled {
  background: var(--color-bg-light);
  cursor: not-allowed;
}

.text-hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-xs);
}

.text-min-hint {
  color: var(--color-text-placeholder);
}

.text-count {
  color: var(--color-text-placeholder);
  margin-left: auto;
}

/* 文件上传 */
.file-upload-area {
  padding: var(--space-8);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: border-color 0.2s;
}

.file-upload-area:hover:not(.disabled) {
  border-color: var(--color-accent-user-700);
}

.file-upload-area.disabled {
  cursor: default;
  opacity: 0.6;
}

/* 错误提示 */
.question-error {
  margin-top: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-danger);
  padding-left: var(--space-1);
}
</style>
