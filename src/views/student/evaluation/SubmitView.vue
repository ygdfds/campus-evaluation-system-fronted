<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getEvaluationSubmitPageData,
  saveEvaluationDraft, submitEvaluation, updateEvaluationSubmission,
  getServiceItemsApi, getCoursesApi, getCourseEnrollmentsApi, getTeachingOrgUnitsApi,
} from '@/api/evaluation'
import QuestionRenderer from '@/components/student/QuestionRenderer.vue'

defineOptions({ name: 'StudentEvaluationSubmitView' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const pageMode = ref('loading') // loading | create | draft | edit | readonly | not_started | closed
const formInfo = ref(null)
const windowInfo = ref(null)
const questions = ref([])
const questionOptions = ref({})
const existingSubmission = ref(null)
const rulesExpanded = ref(false)
const questionErrors = reactive({})

const answers = reactive({})
const scores = reactive({})

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(5, 10)
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').slice(0, 16)
}

// ==================== 计算属性 ====================

const isEditMode = computed(() => pageMode.value === 'edit')

const isReadonly = computed(() => {
  if (pageMode.value === 'loading') return true
  return ['readonly', 'not_started', 'closed'].includes(pageMode.value)
})

const statusLabel = computed(() => {
  const map = {
    create: '待评价', draft: '草稿', edit: '可修改',
    readonly: '已锁定', not_started: '未开始', closed: '已截止', loading: '',
  }
  return map[pageMode.value] || ''
})

const statusType = computed(() => {
  const map = { '待评价': 'warning', '草稿': 'info', '可修改': 'warning', '已锁定': 'danger', '已截止': 'info', '未开始': 'info' }
  return map[statusLabel.value] || 'info'
})

const readonlyReason = computed(() => {
  if (pageMode.value === 'not_started') return '评价尚未开始，无法提交'
  if (pageMode.value === 'closed') return '评价已截止，无法继续提交'
  if (pageMode.value === 'readonly') return pageReadonlyReason.value || '评价已锁定，无法修改'
  return ''
})

const pageReadonlyReason = ref('')

const hasExtremeRating = computed(() => {
  const ratingQuestions = questions.value.filter(q => q.type === 'rating')
  for (const q of ratingQuestions) {
    const score = scores[q.id]
    if (score === 1 || score === (q.max_score || 5)) {
      const textQuestions = questions.value.filter(tq => tq.type === 'text')
      const hasText = textQuestions.some(tq => (answers[tq.id] || '').trim().length > 0)
      if (!hasText) return true
    }
  }
  return false
})

function goBack() {
  router.push({ name: 'StudentEvaluationTasks' })
}

function cancelEdit() {
  goBack()
}

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true
  const formId = Number(route.params.taskId)
  const userId = userStore.userInfo?.id
  const tenantId = userStore.tenantId
  const schoolId = userStore.schoolId
  if (!formId || !userId || !tenantId) { loading.value = false; return }

  const context = { tenantId, schoolId, userId, role: 'student' }

  try {
    const data = await getEvaluationSubmitPageData(formId, context)
    if (!data) { loading.value = false; return }

    formInfo.value = data.form
    windowInfo.value = data.window
    questions.value = data.questions
    questionOptions.value = data.options || {}
    existingSubmission.value = data.submission
    pageMode.value = data.mode
    pageReadonlyReason.value = data.readonlyReason

    // 解析目标名称和部门
    const [serviceItems, courses, enrollments, orgUnits] = await Promise.all([
      getServiceItemsApi(tenantId),
      getCoursesApi(tenantId),
      getCourseEnrollmentsApi(tenantId, userId),
      getTeachingOrgUnitsApi(tenantId),
    ])

    if (data.form.type === 'teaching' && data.form.course_id) {
      const enrolled = enrollments.some(e => e.course_id === data.form.course_id)
      if (!enrolled) {
        ElMessage.error('您未选修该课程，无法参与评价')
        goBack()
        return
      }
    }

    if (data.form.service_item_id) {
      const si = serviceItems.find(s => s.id === data.form.service_item_id)
      formInfo.value._target_name = si ? si.name : ''
      const org = si ? orgUnits.find(o => o.id === si.service_org_id) : null
      formInfo.value._dept_name = org ? org.name : '后勤管理处'
    }
    if (data.form.course_id) {
      const course = courses.find(c => c.id === data.form.course_id)
      formInfo.value._target_name = course ? course.course_name : ''
      const org = course ? orgUnits.find(o => o.id === course.teaching_org_id) : null
      formInfo.value._dept_name = org ? org.name : '教务处'
    }
    formInfo.value._type_label = data.form.type === 'teaching' ? '教学评价' : data.form.type === 'instant' ? '即时评价' : '后勤服务'

    // 回填答案和评分
    if (data.answers && data.answers.length > 0) {
      for (const a of data.answers) {
        const q = questions.value.find(qq => qq.id === a.question_id)
        if (!q) continue
        const val = a.answer_value
        if (q.type === 'text') {
          answers[q.id] = val || ''
        } else if (q.type === 'multiple') {
          answers[q.id] = Array.isArray(val) ? val : (val ? [String(val)] : [])
        } else if (q.type === 'single') {
          answers[q.id] = val != null ? String(val) : null
        }
      }
    }
    if (data.scores && data.scores.length > 0) {
      for (const s of data.scores) {
        scores[s.question_id] = s.score
      }
    }
  } catch (err) {
    console.error('加载评价表单失败:', err)
    ElMessage.error('加载评价信息失败')
  } finally {
    loading.value = false
  }
}

// ==================== 校验 ====================

function validate() {
  let firstErrorIdx = -1
  Object.keys(questionErrors).forEach(k => delete questionErrors[k])

  for (let i = 0; i < questions.value.length; i++) {
    const q = questions.value[i]
    if (q.required) {
      if (q.type === 'rating' && !scores[q.id]) {
        questionErrors[q.id] = '请完成评分'
        if (firstErrorIdx < 0) firstErrorIdx = i
      }
      if ((q.type === 'single' || q.type === 'multiple') && !answers[q.id]) {
        questionErrors[q.id] = '请选择一个选项'
        if (firstErrorIdx < 0) firstErrorIdx = i
      }
      if (q.type === 'text' && q.min_length && (answers[q.id] || '').length < q.min_length) {
        questionErrors[q.id] = `至少输入 ${q.min_length} 字`
        if (firstErrorIdx < 0) firstErrorIdx = i
      }
      if (q.type === 'text' && !q.min_length && !(answers[q.id] || '').trim()) {
        questionErrors[q.id] = '请输入回答'
        if (firstErrorIdx < 0) firstErrorIdx = i
      }
    }
  }

  if (firstErrorIdx >= 0) {
    const el = document.querySelectorAll('.question-item')[firstErrorIdx]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return false
  }
  return true
}

// ==================== 构建答案/评分数据 ====================

function buildAnswerPayload() {
  const result = []
  for (const q of questions.value) {
    if (q.type === 'rating') continue // 评分题走 scores
    const val = answers[q.id]
    if (val === undefined || val === null || val === '') continue
    let answerValue = val
    if (q.type === 'multiple' && Array.isArray(val)) {
      answerValue = val
    } else if (q.type === 'single') {
      answerValue = String(val)
    }
    result.push({ question_id: q.id, answer_value: answerValue })
  }
  return result
}

function buildScorePayload() {
  const result = []
  for (const q of questions.value) {
    if (q.type === 'rating' && scores[q.id]) {
      result.push({ question_id: q.id, score: scores[q.id] })
    }
  }
  return result
}

// ==================== 提交逻辑 ====================

async function handleSubmit(isDraft = false) {
  if (!isDraft && !validate()) return

  if (!isDraft && hasExtremeRating.value) {
    try {
      await ElMessageBox.confirm(
        '您的评分较为极端且未提供文字说明，可能进入人工审核流程。确认继续提交吗？',
        '极端评分提示',
        { confirmButtonText: '确认提交', cancelButtonText: '返回修改', type: 'warning' }
      )
    } catch { return }
  }

  if (!isDraft) {
    try {
      await ElMessageBox.confirm(
        `提交后 ${windowInfo.value?.modifiable_hours || 24} 小时内可修改，逾期将锁定。`,
        '确认提交评价？',
        { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'info' }
      )
    } catch { return }
  }

  submitting.value = true
  const userId = userStore.userInfo?.id
  const tenantId = userStore.tenantId
  const schoolId = userStore.schoolId
  const formId = Number(route.params.taskId)
  const context = { tenantId, schoolId, userId, role: 'student' }

  const answerPayload = buildAnswerPayload()
  const scorePayload = buildScorePayload()

  try {
    if (pageMode.value === 'edit' && existingSubmission.value) {
      // 修改模式：不新建 submission，只更新答案
      await updateEvaluationSubmission(existingSubmission.value.id, {
        answers: answerPayload,
        scores: scorePayload,
        reviewStatus: hasExtremeRating.value ? 'pending' : existingSubmission.value.review_status,
      }, context)
      ElMessage.success('评价修改成功')
      router.push({ name: 'StudentEvalHistory' })
    } else {
      // create / draft 模式
      const basePayload = {
        submissionId: existingSubmission.value?.id || null,
        formId,
        windowId: windowInfo.value?.id,
        targetType: formInfo.value.course_id ? 'course' : 'service_item',
        targetId: formInfo.value.course_id || formInfo.value.service_item_id,
        answers: answerPayload,
        scores: scorePayload,
        reviewStatus: hasExtremeRating.value ? 'pending' : null,
      }

      if (isDraft) {
        await saveEvaluationDraft(basePayload, context)
        ElMessage.success('草稿已保存')
        await loadData() // 重新加载以更新模式
      } else {
        basePayload.modifiableHours = windowInfo.value?.modifiable_hours || 24
        await submitEvaluation(basePayload, context)
        ElMessage.success('评价提交成功！')
        router.push({ name: 'StudentEvalHistory' })
      }
    }
  } catch (err) {
    console.error('提交评价失败:', err)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="page-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="formInfo && windowInfo">
      <!-- 返回 -->
      <div class="back-bar">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回评价中心
        </el-button>
      </div>

      <div class="evaluation-form-paper">

      <!-- 修改模式提示 -->
      <div v-if="isEditMode && !isReadonly" class="edit-mode-hint">
        当前为修改评价模式，可修改至 {{ formatDateTime(existingSubmission?.modifiable_until) }}
      </div>

      <!-- 评价对象信息卡 -->
      <div class="form-header-card">
        <div class="form-header-top">
          <h2 class="form-title">{{ formInfo.title }}</h2>
          <div class="status-area">
            <el-tag :type="statusType" size="small" effect="plain">{{ statusLabel }}</el-tag>
            <span v-if="isReadonly && readonlyReason" class="readonly-hint">{{ readonlyReason }}</span>
          </div>
        </div>
        <div class="form-info-grid">
          <div class="info-item">
            <span class="info-label">类型</span>
            <span class="info-value">{{ formInfo._type_label }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">评价对象</span>
            <span class="info-value">{{ formInfo._target_name || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所属部门</span>
            <span class="info-value">{{ formInfo._dept_name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">时间范围</span>
            <span class="info-value">{{ formatShortDate(windowInfo.start_at) }} ~ {{ formatShortDate(windowInfo.end_at) }}</span>
          </div>
          <div v-if="isEditMode && existingSubmission?.modifiable_until" class="info-item info-highlight">
            <span class="info-label">可修改至</span>
            <span class="info-value">{{ formatDateTime(existingSubmission.modifiable_until) }}</span>
          </div>
        </div>
      </div>

      <!-- 评价须知（轻量折叠） -->
      <div class="rules-card">
        <div class="rules-summary" @click="rulesExpanded = !rulesExpanded">
          <el-icon :size="14"><Warning /></el-icon>
          <span>评价须知：提交后 {{ windowInfo.modifiable_hours || 48 }} 小时内可修改，评价内容匿名展示，极端评分可能进入人工审核。</span>
          <span class="rules-toggle">{{ rulesExpanded ? '收起' : '查看详细规则' }}</span>
        </div>
        <div v-if="rulesExpanded" class="rules-detail">
          <ul>
            <li>提交后 {{ windowInfo.modifiable_hours || 48 }} 小时内可修改评价内容</li>
            <li>请客观真实地进行评价</li>
            <li>极端评分且无文字说明可能进入人工审核流程</li>
            <li>评价内容匿名展示，但后台保留授权追溯机制</li>
          </ul>
        </div>
      </div>

      <!-- 极端评分提示 -->
      <div v-if="hasExtremeRating && !isReadonly" class="extreme-hint">
        <el-alert type="warning" :closable="false" show-icon title="当前存在极端评分且缺少文字说明，提交后可能进入人工审核" />
      </div>

      <!-- 题目区域 -->
      <div class="questions-area">
        <QuestionRenderer
          v-for="(q, idx) in questions"
          :key="q.id"
          :question="q"
          :options="questionOptions[q.id] || []"
          :model-value="answers[q.id]"
          :score-value="scores[q.id]"
          :index="idx + 1"
          :disabled="isReadonly"
          :error="questionErrors[q.id] || ''"
          @update:model-value="answers[q.id] = $event; delete questionErrors[q.id]"
          @update:score-value="scores[q.id] = $event; delete questionErrors[q.id]"
        />
      </div>

      <!-- 底部操作区 -->
      <div v-if="!isReadonly" class="action-bar">
        <div class="action-btns">
          <el-button v-if="isEditMode" @click="cancelEdit">取消修改</el-button>
          <el-button v-else @click="handleSubmit(true)" :loading="submitting">保存草稿</el-button>
          <el-button type="primary" class="submit-btn" @click="handleSubmit(false)" :loading="submitting">
            {{ isEditMode ? '提交修改' : '提交评价' }}
          </el-button>
        </div>
      </div>
      </div>
    </template>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <el-empty description="评价表单不存在或无法参与">
        <el-button type="primary" @click="goBack">返回评价中心</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: var(--space-8);
}

.loading-skeleton {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

/* ===== 返回 ===== */
.back-bar {
  display: flex;
  align-items: center;
}

/* ===== 信息卡 ===== */
.form-header-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.status-area {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.readonly-hint {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.form-title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

.form-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3) var(--space-5);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.info-value {
  font-size: var(--font-sm);
  color: var(--color-text-heading);
  font-weight: var(--font-weight-medium);
}

.info-highlight .info-value {
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-semibold);
}

/* ===== 评价须知（折叠） ===== */
.rules-card {
  background: var(--color-primary-50);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-5);
  border: 1px solid var(--color-primary-100);
}

.rules-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed);
  cursor: pointer;
  flex-wrap: wrap;
}

.rules-toggle {
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
  margin-left: auto;
}

.rules-detail {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-primary-100);
}

.rules-detail ul {
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
}

.rules-detail li {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed);
  list-style: disc;
}

.extreme-hint {
  margin-top: calc(-1 * var(--space-2));
}

/* ===== 题目区域 ===== */
.questions-area {
  display: flex;
  flex-direction: column;
}

/* ===== 修改模式提示 ===== */
.edit-mode-hint {
  font-size: var(--font-sm);
  color: var(--color-accent-user-700);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary-100);
}

/* ===== 底部操作区 ===== */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-border-light);
}

.action-btns {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.submit-btn {
  background: var(--color-accent-user-700) !important;
  border-color: var(--color-accent-user-700) !important;
  color: var(--color-text-white) !important;
}

.submit-btn:hover {
  background: var(--color-accent-user-600) !important;
  border-color: var(--color-accent-user-600) !important;
}

.error-state {
  padding: var(--space-10) 0;
}

.evaluation-form-paper {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: #fff;
  border: 1px solid var(--color-border-lighter);
  border-radius: 18px;
  box-shadow: var(--shadow-card);
}

.evaluation-form-paper .form-header-card,
.evaluation-form-paper .rules-card,
.evaluation-form-paper .question-item {
  box-shadow: none;
}

.evaluation-form-paper .form-header-card {
  padding: 0 0 var(--space-4);
  border-bottom: 1px solid var(--color-border-lighter);
  border-radius: 0;
  background: transparent;
}

.evaluation-form-paper .rules-card {
  margin: 0;
}

.evaluation-form-paper .action-bar {
  margin-top: var(--space-2);
  padding-bottom: 0;
}
</style>
