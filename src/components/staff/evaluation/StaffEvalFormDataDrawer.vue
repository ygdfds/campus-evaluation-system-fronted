<script setup>
import { ref, watch } from 'vue'
import { getEvalFormDataApi } from '@/api/staffEvaluationForms'

defineOptions({ name: 'StaffEvalFormDataDrawer' })

const props = defineProps({
  visible: { type: Boolean, default: false },
  formItem: { type: Object, default: () => ({}) },
  context: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:visible'])

const loading = ref(false)
const formData = ref({
  totalCount: 0,
  avgScore: 0,
  scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  recentSubmissions: [],
  questions: [],
})

const typeMap = {
  teaching: { label: '教学评价', type: 'primary' },
  service: { label: '服务评价', type: 'success' },
  instant: { label: '即时评价', type: 'warning' },
}

async function loadData() {
  if (!props.formItem?.id || !props.context?.tenantId) return
  loading.value = true
  try {
    const data = await getEvalFormDataApi(props.context, props.formItem.id)
    formData.value = data
  } catch (err) {
    console.error('加载评价数据失败:', err)
  } finally {
    loading.value = false
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}

function getScoreColor(score) {
  if (score >= 4) return 'var(--color-success)'
  if (score >= 3) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function handleClose() {
  emit('update:visible', false)
}

watch(() => props.visible, (val) => {
  if (val) {
    loadData()
  }
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="评价数据统计"
    size="720px"
    @close="handleClose"
  >
    <div v-loading="loading" class="data-body">
      <!-- 表单信息 -->
      <div class="form-header">
        <h3 class="form-title">{{ formItem.title }}</h3>
        <div class="form-meta">
          <el-tag :type="typeMap[formItem.type]?.type || 'info'" size="small" effect="light">
            {{ typeMap[formItem.type]?.label || formItem.type }}
          </el-tag>
          <span class="meta-text">{{ formItem._target_name }}</span>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">{{ formData.totalCount }}</div>
          <div class="stat-label">提交总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" :style="{ color: getScoreColor(formData.avgScore) }">
            {{ formData.avgScore.toFixed(2) }}
          </div>
          <div class="stat-label">平均分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formData.questions.length }}</div>
          <div class="stat-label">题目数量</div>
        </div>
      </div>

      <!-- 分数分布 -->
      <div v-if="formData.totalCount > 0" class="section">
        <h4 class="section-title">分数分布</h4>
        <div class="score-distribution">
          <div v-for="score in [5, 4, 3, 2, 1]" :key="score" class="score-row">
            <span class="score-label">{{ score }} 分</span>
            <div class="score-bar-wrap">
              <div
                class="score-bar"
                :style="{
                  width: formData.totalCount > 0 ? (formData.scoreDistribution[score] / formData.totalCount * 100) + '%' : '0%',
                  backgroundColor: getScoreColor(score),
                }"
              />
            </div>
            <span class="score-count">{{ formData.scoreDistribution[score] }}</span>
          </div>
        </div>
      </div>

      <!-- 最近提交 -->
      <div v-if="formData.recentSubmissions.length > 0" class="section">
        <h4 class="section-title">最近提交（{{ formData.recentSubmissions.length }} 条）</h4>
        <div class="submissions-list">
          <div v-for="sub in formData.recentSubmissions" :key="sub.id" class="submission-item">
            <div class="submission-main">
              <span class="submission-score" :style="{ color: getScoreColor(sub.overall_score) }">
                {{ sub.overall_score }} 分
              </span>
              <span class="submission-time">{{ formatTime(sub.submitted_at) }}</span>
            </div>
            <div class="submission-meta">
              <el-tag v-if="sub.status === 'submitted'" size="small" type="success">已提交</el-tag>
              <el-tag v-else-if="sub.status === 'modified'" size="small" type="warning">已修改</el-tag>
              <el-tag v-else size="small">{{ sub.status }}</el-tag>
              <span v-if="sub.anonymous" class="submission-anon">匿名</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && formData.totalCount === 0" class="empty-state">
        <p>暂无评价数据</p>
        <p class="empty-hint">评价表单发布后，学生提交的评价将在此显示</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.data-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.form-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.meta-text {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

/* 分数分布 */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0;
}

.score-distribution {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.score-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.score-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.score-bar-wrap {
  flex: 1;
  height: 24px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.score-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.score-count {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}

/* 提交列表 */
.submissions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.submission-item {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.submission-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.submission-score {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
}

.submission-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.submission-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.submission-anon {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  background: var(--color-bg-card);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-10) 0;
  color: var(--color-text-placeholder);
}

.empty-hint {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}
</style>
