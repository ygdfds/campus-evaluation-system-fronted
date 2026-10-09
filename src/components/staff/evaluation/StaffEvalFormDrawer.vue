<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Plus, Picture, Delete, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/request'
import CoverImage from '@/components/common/CoverImage.vue'
import QuestionEditor from './QuestionEditor.vue'
import {
  createEvalFormDraftApi,
  updateEvalFormApi,
  saveEvalQuestionsApi,
  createEvalWindowApi,
  getEvalQuestionsByFormApi,
  getPublishTargetOptionsApi,
  createCourseOptionApi,
} from '@/api/staffEvaluationForms'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  formData: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:visible', 'saved'])

const currentStep = ref(0)
const saving = ref(false)
const formLoading = ref(false)
const coverPreviewUrl = ref('')
const uploadDialogVisible = ref(false)
const coverPreviewVisible = ref(false)

const form = reactive({
  title: '',
  type: 'teaching',
  description: '',
  cover_file_id: null,
  anonymous: true,
  publish_scope: 'all_students',
  course_id: null,
  teaching_org_id: null,
  service_item_id: null,
  service_org_id: null,
})

const questions = ref([])
const windowForm = reactive({
  start_at: '',
  end_at: '',
  modifiable_hours: 24,
})
const targetOptions = ref({ serviceItems: [], courses: [], serviceOrgs: [], teachingOrgs: [] })

const typeOptions = [
  { label: '教学评价', value: 'teaching' },
  { label: '后勤服务评价', value: 'service' },
  { label: '即时评价', value: 'instant' },
]

const publishScopeOptions = [
  { label: '全部学生', value: 'all_students' },
  { label: '指定班级', value: 'specified_class' },
  { label: '指定专业', value: 'specified_major' },
]

const typeLabelMap = {
  rating: '评分题',
  text: '文本题',
  single: '单选题',
  multiple: '多选题',
}

const isTeaching = computed(() => form.type === 'teaching')
const isEdit = computed(() => props.mode === 'edit')
const isLimitedEdit = computed(() => props.formData?._limitedEdit === true)
const steps = computed(() => (isLimitedEdit.value
  ? ['基础信息', '评价窗口']
  : ['基础信息', '评价对象', '题目配置', '评价窗口', '预览提交']))

const filteredServiceItems = computed(() => {
  if (!form.service_org_id) return targetOptions.value.serviceItems
  return targetOptions.value.serviceItems.filter((item) => Number(item.service_org_id) === Number(form.service_org_id))
})

const stepValid = computed(() => {
  if (isLimitedEdit.value) {
    if (currentStep.value === 0) return !!form.title.trim()
    if (currentStep.value === 1) return !!windowForm.start_at && !!windowForm.end_at
    return true
  }
  if (currentStep.value === 0) return !!form.title.trim() && !!form.type
  if (currentStep.value === 1) return isTeaching.value ? !!form.course_id : !!form.service_item_id
  if (currentStep.value === 2) return questions.value.length > 0 && questions.value.every((q) => !!String(q.title || '').trim())
  if (currentStep.value === 3) return !!windowForm.start_at && !!windowForm.end_at
  return true
})

function resetForm() {
  Object.assign(form, {
    title: '',
    type: 'teaching',
    description: '',
    cover_file_id: null,
    anonymous: true,
    publish_scope: 'all_students',
    course_id: null,
    teaching_org_id: null,
    service_item_id: null,
    service_org_id: null,
  })
  coverPreviewUrl.value = ''
  questions.value = []
  Object.assign(windowForm, { start_at: '', end_at: '', modifiable_hours: 24 })
}

function getTargetId(data = {}) {
  return data.target_id || data.targetId || null
}

function fillWindow(data = {}) {
  const window = data._window || data.window || data._windows?.[0]
  if (!window) return
  windowForm.start_at = window.start_at || window.startTime || window.start_time || ''
  windowForm.end_at = window.end_at || window.endTime || window.end_time || ''
  windowForm.modifiable_hours = window.modifiable_hours || window.modifiableHours || 24
}

async function loadTargetOptions() {
  try {
    targetOptions.value = await getPublishTargetOptionsApi()
  } catch (error) {
    console.error('加载评价对象失败:', error)
    ElMessage.error('评价对象加载失败')
  }
}

async function loadEditData() {
  if (!isEdit.value || !props.formData?.id) return
  formLoading.value = true
  try {
    const targetType = props.formData.target_type || props.formData.targetType
    Object.assign(form, {
      title: props.formData.title || '',
      type: props.formData.type || 'teaching',
      description: props.formData.description || '',
      cover_file_id: props.formData.cover_file_id || props.formData.coverFileId || null,
      anonymous: props.formData.anonymous ?? props.formData.anonymousEnabled ?? true,
      publish_scope: props.formData.publish_scope || 'all_students',
      course_id: props.formData.course_id || props.formData.courseId || (targetType === 'course' ? getTargetId(props.formData) : null),
      teaching_org_id: props.formData.teaching_org_id || props.formData.teachingOrgId || null,
      service_item_id: props.formData.service_item_id || props.formData.serviceItemId || (targetType === 'service_item' ? getTargetId(props.formData) : null),
      service_org_id: props.formData.service_org_id || props.formData.serviceOrgId || null,
    })
    coverPreviewUrl.value = props.formData._cover_url || props.formData.coverUrl || ''
    fillWindow(props.formData)

    const loadedQuestions = await getEvalQuestionsByFormApi(props.formData._context, props.formData.id)
    questions.value = loadedQuestions.map((q) => ({ ...q, _options: q._options || [] }))
  } catch (error) {
    console.error('加载编辑数据失败:', error)
    ElMessage.error('加载表单数据失败')
  } finally {
    formLoading.value = false
  }
}

function addQuestion(type = 'rating') {
  questions.value.push({
    type,
    question_type: type,
    title: '',
    required: true,
    max_score: type === 'rating' ? 5 : null,
    min_length: type === 'text' ? 10 : null,
    sort_order: questions.value.length + 1,
    _options: ['single', 'multiple'].includes(type) ? [{ option_text: '', sort_order: 1 }] : [],
  })
}

function updateQuestions(nextQuestions) {
  questions.value = nextQuestions
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function nextStep() {
  if (!stepValid.value) {
    ElMessage.warning('请先填写当前步骤的必填内容')
    return
  }
  if (currentStep.value < steps.value.length - 1) currentStep.value++
}

function generatedCourseCode(courseName) {
  return `CUSTOM_${Date.now().toString(36).toUpperCase()}_${courseName.length}`
}

async function ensureSelectedCourse() {
  if (!isTeaching.value || !form.course_id || typeof form.course_id !== 'string') return
  const courseName = form.course_id.trim()
  if (!courseName) return
  const teachingOrgId = form.teaching_org_id || targetOptions.value.teachingOrgs?.[0]?.id
  if (!teachingOrgId) throw new Error('请先选择教学组织，再填写新课程')
  const created = await createCourseOptionApi({
    teachingOrgId,
    courseCode: generatedCourseCode(courseName),
    courseName,
  })
  targetOptions.value.courses = [created, ...targetOptions.value.courses]
  form.course_id = created.id
  form.teaching_org_id = created.teaching_org_id || teachingOrgId
}

function validateBeforeSave() {
  if (!form.title.trim()) throw new Error('请填写表单名称')
  if (isTeaching.value && !form.course_id) throw new Error('请选择课程，或直接输入新课程名称')
  if (!isTeaching.value && !form.service_item_id) throw new Error('请选择服务项目')
  if (!isLimitedEdit.value && questions.value.length === 0) throw new Error('请至少添加一道题目')
  if (!isLimitedEdit.value && questions.value.some((q) => !String(q.title || '').trim())) throw new Error('请填写所有题目标题')
  if (!windowForm.start_at || !windowForm.end_at) throw new Error('请设置评价窗口时间')
  if (new Date(windowForm.end_at) <= new Date(windowForm.start_at)) throw new Error('结束时间必须晚于开始时间')
}

async function handleSaveAndPreview() {
  saving.value = true
  try {
    await ensureSelectedCourse()
    validateBeforeSave()
    const ctx = { tenantId: props.formData._context?.tenantId, userId: props.formData._context?.userId }
    let formId = props.formData?.id

    const payload = { ...form }
    if (isTeaching.value) {
      payload.service_item_id = null
      payload.service_org_id = null
    } else {
      payload.course_id = null
      payload.teaching_org_id = null
    }

    if (isEdit.value && formId) {
      await updateEvalFormApi(ctx, formId, payload)
    } else {
      const created = await createEvalFormDraftApi(ctx, payload)
      formId = created.id
    }

    if (!isLimitedEdit.value && formId) {
      await saveEvalQuestionsApi(ctx, formId, questions.value)
    }

    if (formId) {
      await createEvalWindowApi(ctx, {
        form_id: formId,
        start_at: new Date(windowForm.start_at).toISOString(),
        end_at: new Date(windowForm.end_at).toISOString(),
      })
    }

    ElMessage.success('评价表单已保存')
    emit('saved')
    handleClose()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

function handleClose() {
  currentStep.value = 0
  resetForm()
  emit('update:visible', false)
}

function handleOpenUpload() {
  uploadDialogVisible.value = true
}

function handleCoverSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  coverPreviewUrl.value = URL.createObjectURL(file)
  const body = new FormData()
  body.append('file', file)
  body.append('bizType', 'evaluation_cover')
  request.post('/files/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((response) => {
      const uploaded = response?.data?.data || response?.data || response
      form.cover_file_id = uploaded?.id || null
      if (!form.cover_file_id) throw new Error('后端未返回文件ID')
      uploadDialogVisible.value = false
      ElMessage.success('封面图片上传成功')
    })
    .catch((error) => {
      coverPreviewUrl.value = ''
      form.cover_file_id = null
      console.error('封面图片上传失败:', error)
      ElMessage.error('封面图片上传失败')
    })
}

function handleRemoveCover() {
  coverPreviewUrl.value = ''
  form.cover_file_id = null
}

function handlePreviewCover() {
  coverPreviewVisible.value = true
}

watch(() => form.type, () => {
  form.course_id = null
  form.teaching_org_id = null
  form.service_item_id = null
  form.service_org_id = null
})

watch(() => form.service_org_id, () => {
  if (!form.service_item_id) return
  const selected = targetOptions.value.serviceItems.find((item) => Number(item.id) === Number(form.service_item_id))
  if (selected && form.service_org_id && Number(selected.service_org_id) !== Number(form.service_org_id)) {
    form.service_item_id = null
  }
})

watch(() => form.service_item_id, (id) => {
  const selected = targetOptions.value.serviceItems.find((item) => Number(item.id) === Number(id))
  if (selected?.service_org_id) form.service_org_id = selected.service_org_id
})

watch(() => props.visible, async (visible) => {
  if (visible) {
    resetForm()
    currentStep.value = 0
    await loadTargetOptions()
    await loadEditData()
  } else {
    resetForm()
    currentStep.value = 0
  }
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="isLimitedEdit ? '修改评价表单' : isEdit ? '编辑评价表单' : '新建评价表单'"
    size="760px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-steps :active="currentStep" finish-status="success" align-center class="drawer-steps">
      <el-step v-for="(step, index) in steps" :key="index" :title="step" />
    </el-steps>

    <div v-loading="formLoading" class="drawer-body">
      <div v-show="currentStep === 0" class="step-content">
        <el-form label-position="top">
          <el-form-item label="表单名称" required>
            <el-input v-model="form.title" placeholder="请输入评价表单名称" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item v-if="!isLimitedEdit" label="表单类型" required>
            <el-select v-model="form.type" style="width: 100%">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="表单说明">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简要描述评价目的和范围" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="封面图片">
            <div v-if="coverPreviewUrl" class="cover-preview-wrapper">
              <CoverImage :src="coverPreviewUrl" width="160px" height="100px" radius="var(--radius-md)" />
              <div class="cover-actions">
                <el-button size="small" :icon="ZoomIn" circle @click="handlePreviewCover" />
                <el-button size="small" :icon="Delete" type="danger" circle @click="handleRemoveCover" />
              </div>
            </div>
            <div v-else class="cover-upload-trigger" @click="handleOpenUpload">
              <el-icon :size="28" class="cover-upload-icon"><Picture /></el-icon>
              <span class="cover-upload-text">点击上传封面</span>
              <span class="cover-upload-hint">16:9，不超过 5MB</span>
            </div>
          </el-form-item>
          <el-form-item label="匿名评价">
            <el-switch v-model="form.anonymous" />
            <span class="field-hint">开启后学生提交评价时不展示个人信息</span>
          </el-form-item>
          <el-alert v-if="isLimitedEdit" type="info" :closable="false" show-icon>
            已发布表单仅适合调整说明、封面和评价窗口。
          </el-alert>
        </el-form>
      </div>

      <div v-show="currentStep === 1 && !isLimitedEdit" class="step-content">
        <el-form label-position="top">
          <template v-if="isTeaching">
            <el-form-item label="课程" required>
              <el-select
                v-model="form.course_id"
                placeholder="选择课程，或直接输入新课程名称"
                clearable
                filterable
                allow-create
                default-first-option
                style="width: 100%"
              >
                <el-option v-for="course in targetOptions.courses" :key="course.id" :label="course.course_name || course.label" :value="course.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="教学组织">
              <el-select v-model="form.teaching_org_id" placeholder="选择教学组织" clearable filterable style="width: 100%">
                <el-option v-for="org in targetOptions.teachingOrgs" :key="org.id" :label="org.name || org.label" :value="org.id" />
              </el-select>
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item label="服务组织">
              <el-select v-model="form.service_org_id" placeholder="先选择服务组织可筛选项目" clearable filterable style="width: 100%">
                <el-option v-for="org in targetOptions.serviceOrgs" :key="org.id" :label="org.name || org.label" :value="org.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务项目" required>
              <el-select v-model="form.service_item_id" placeholder="请选择服务项目" clearable filterable style="width: 100%">
                <el-option v-for="item in filteredServiceItems" :key="item.id" :label="item.name || item.label" :value="item.id" />
              </el-select>
            </el-form-item>
          </template>
          <el-form-item label="发布范围">
            <el-select v-model="form.publish_scope" style="width: 100%">
              <el-option v-for="item in publishScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="currentStep === 2 && !isLimitedEdit" class="step-content">
        <div class="questions-header">
          <span class="questions-title">题目列表（{{ questions.length }} 道）</span>
          <el-dropdown trigger="click" @command="addQuestion">
            <el-button type="primary" :icon="Plus" size="small">添加题目</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rating">评分题</el-dropdown-item>
                <el-dropdown-item command="text">文本题</el-dropdown-item>
                <el-dropdown-item command="single">单选题</el-dropdown-item>
                <el-dropdown-item command="multiple">多选题</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div v-if="questions.length === 0" class="questions-empty">暂无题目，请点击上方按钮添加</div>
        <QuestionEditor
          v-for="(question, index) in questions"
          :key="index"
          :questions="questions"
          :index="index"
          @update:questions="updateQuestions"
        />
      </div>

      <div v-show="(currentStep === 3 && !isLimitedEdit) || (currentStep === 1 && isLimitedEdit)" class="step-content">
        <el-form label-position="top">
          <el-form-item label="开始时间" required>
            <el-date-picker v-model="windowForm.start_at" type="datetime" placeholder="选择评价开始时间" style="width: 100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
          <el-form-item label="结束时间" required>
            <el-date-picker v-model="windowForm.end_at" type="datetime" placeholder="选择评价结束时间" style="width: 100%" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" />
          </el-form-item>
          <el-form-item label="允许修改时长">
            <el-input-number v-model="windowForm.modifiable_hours" :min="0" :max="720" style="width: 200px" />
            <span class="field-hint">小时内学生可修改评价，0 表示不可修改</span>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="currentStep === 4 && !isLimitedEdit" class="step-content">
        <div class="preview-section">
          <div v-if="coverPreviewUrl" class="preview-cover">
            <CoverImage :src="coverPreviewUrl" width="100%" height="200px" radius="var(--radius-lg)" />
          </div>
          <h3 class="preview-title">{{ form.title || '未命名表单' }}</h3>
          <div class="preview-meta">
            <el-tag size="small" effect="light">{{ typeOptions.find((item) => item.value === form.type)?.label || form.type }}</el-tag>
            <span v-if="form.anonymous" class="preview-tag">匿名评价</span>
          </div>
          <p v-if="form.description" class="preview-desc">{{ form.description }}</p>
          <div class="preview-block">
            <div class="preview-label">评价对象</div>
            <div class="preview-value">
              <template v-if="isTeaching">
                {{ targetOptions.courses.find((item) => item.id === form.course_id)?.course_name || form.course_id || '未指定' }}
                <span v-if="form.teaching_org_id"> / {{ targetOptions.teachingOrgs.find((item) => item.id === form.teaching_org_id)?.name }}</span>
              </template>
              <template v-else>
                {{ targetOptions.serviceItems.find((item) => item.id === form.service_item_id)?.name || '未指定' }}
                <span v-if="form.service_org_id"> / {{ targetOptions.serviceOrgs.find((item) => item.id === form.service_org_id)?.name }}</span>
              </template>
            </div>
          </div>
          <div class="preview-block">
            <div class="preview-label">题目（{{ questions.length }} 道）</div>
            <div v-for="(question, index) in questions" :key="index" class="preview-question">
              <span class="pq-index">{{ index + 1 }}.</span>
              <span class="pq-title">{{ question.title || '未填写标题' }}</span>
              <el-tag size="small" type="info">{{ typeLabelMap[question.type] || question.type }}</el-tag>
              <span v-if="question.required" class="pq-required">必填</span>
            </div>
          </div>
          <div class="preview-block">
            <div class="preview-label">评价窗口</div>
            <div class="preview-value">
              {{ windowForm.start_at ? new Date(windowForm.start_at).toLocaleString() : '未设置' }} -
              {{ windowForm.end_at ? new Date(windowForm.end_at).toLocaleString() : '未设置' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button v-if="currentStep < steps.length - 1" type="primary" :disabled="!stepValid" @click="nextStep">下一步</el-button>
          <el-button v-else type="primary" :loading="saving" @click="handleSaveAndPreview">保存</el-button>
        </div>
      </div>
    </template>
  </el-drawer>

  <el-dialog v-model="uploadDialogVisible" title="上传封面图片" width="480px" :close-on-click-modal="true">
    <div class="upload-dialog-body">
      <div class="upload-drop-zone">
        <el-icon :size="48" class="upload-drop-icon"><Picture /></el-icon>
        <p class="upload-drop-title">选择封面图片</p>
        <p class="upload-drop-hint">支持 JPG、PNG、WebP 格式，不超过 5MB</p>
        <label class="upload-drop-btn">
          选择文件
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleCoverSelect" />
        </label>
      </div>
    </div>
  </el-dialog>

  <el-dialog v-model="coverPreviewVisible" title="封面预览" width="640px">
    <CoverImage v-if="coverPreviewUrl" :src="coverPreviewUrl" width="100%" height="auto" radius="var(--radius-lg)" />
  </el-dialog>
</template>

<style scoped>
.drawer-steps {
  margin-bottom: var(--space-6);
  padding: 0 var(--space-4);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.step-content {
  padding: 0 var(--space-2);
}

.step-content :deep(.el-form-item) {
  margin-bottom: var(--space-4);
}

.field-hint {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-left: var(--space-2);
}

.questions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.questions-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.questions-empty {
  text-align: center;
  padding: var(--space-10) 0;
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.preview-title {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.preview-tag {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}

.preview-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.preview-block {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.preview-label {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
}

.preview-value {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}

.preview-question {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-lighter);
}

.preview-question:last-child {
  border-bottom: none;
}

.pq-index {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  width: 20px;
  flex-shrink: 0;
}

.pq-title {
  flex: 1;
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pq-required {
  font-size: var(--font-xs);
  color: var(--color-danger);
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-right {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.cover-upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  width: 160px;
  height: 100px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  justify-content: center;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.cover-upload-trigger:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.cover-upload-icon {
  color: var(--color-text-placeholder);
}

.cover-upload-text {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.cover-upload-hint {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.cover-preview-wrapper {
  position: relative;
  width: 160px;
  height: 100px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cover-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.cover-preview-wrapper:hover .cover-actions {
  opacity: 1;
}

.preview-cover {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.upload-dialog-body {
  padding: var(--space-2) 0;
}

.upload-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-10) var(--space-6);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-secondary);
}

.upload-drop-icon {
  color: var(--color-text-placeholder);
}

.upload-drop-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0;
}

.upload-drop-hint {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin: 0;
}

.upload-drop-btn {
  display: inline-block;
  padding: var(--space-2) var(--space-5);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.upload-drop-btn:hover {
  background: var(--color-primary-hover);
}
</style>