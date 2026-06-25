<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Plus, Picture, Delete, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CoverImage from '@/components/common/CoverImage.vue'
import QuestionEditor from './QuestionEditor.vue'
import {
  createEvalFormDraftApi,
  updateEvalFormApi,
  saveEvalQuestionsApi,
  createEvalWindowApi,
  getEvalQuestionsByFormApi,
  getPublishTargetOptionsApi,
} from '@/api/staffEvaluationForms'

defineOptions({ name: 'StaffEvalFormDrawer' })

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // create | edit
  formData: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:visible', 'saved'])

const currentStep = ref(0)
const saving = ref(false)
const formLoading = ref(false)

// 封面上传
const coverPreviewUrl = ref('')
const uploadDialogVisible = ref(false)
const coverPreviewVisible = ref(false)

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
  // 本地预览（后续接入后端上传接口）
  coverPreviewUrl.value = URL.createObjectURL(file)
  form.cover_file_id = Date.now() // mock ID，后续替换为后端返回值
  uploadDialogVisible.value = false
  ElMessage.success('封面图片已选择（待接入后端上传）')
}

function handleRemoveCover() {
  coverPreviewUrl.value = ''
  form.cover_file_id = null
}

function handlePreviewCover() {
  coverPreviewVisible.value = true
}

// 表单基础数据
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

// 题目列表
const questions = ref([])

// 评价窗口
const windowForm = reactive({
  start_at: '',
  end_at: '',
  modifiable_hours: 24,
})

// 目标选项
const targetOptions = ref({ serviceItems: [], courses: [], serviceOrgs: [], teachingOrgs: [] })

// 表单校验
const stepValid = computed(() => {
  if (isLimitedEdit.value) {
    // 有限编辑模式：步骤 0 = 基础信息, 步骤 1 = 评价窗口
    switch (currentStep.value) {
      case 0: return !!form.title.trim()
      case 1: return !!windowForm.start_at && !!windowForm.end_at
      default: return true
    }
  }
  switch (currentStep.value) {
    case 0: return !!form.title.trim() && !!form.type
    case 1:
      if (isTeaching.value) return !!form.course_id || !!form.teaching_org_id
      return !!form.service_item_id || !!form.service_org_id
    case 2: return questions.value.length > 0
    case 3: return !!windowForm.start_at && !!windowForm.end_at
    case 4: return true
    default: return false
  }
})

const typeOptions = [
  { label: '教学评价', value: 'teaching' },
  { label: '后勤服务评价', value: 'service' },
  { label: '即时评价', value: 'instant' },
]

const isTeaching = computed(() => form.type === 'teaching')
const isEdit = computed(() => props.mode === 'edit')
const isLimitedEdit = computed(() => props.formData?._limitedEdit === true)

// 有限编辑模式只显示可修改的步骤
const steps = computed(() => {
  if (isLimitedEdit.value) {
    return ['基础信息', '评价窗口']
  }
  return ['基础信息', '评价对象', '题目配置', '评价窗口', '预览提交']
})

// 加载目标选项
async function loadTargetOptions() {
  try {
    const ctx = { tenantId: props.formData.tenant_id || props.formData._context?.tenantId }
    if (!ctx.tenantId) return
    targetOptions.value = await getPublishTargetOptionsApi(ctx)
  } catch { /* ignore */ }
}

// 加载编辑数据
async function loadEditData() {
  if (!isEdit.value || !props.formData?.id) return
  formLoading.value = true
  try {
    // 填充基础信息
    Object.assign(form, {
      title: props.formData.title || '',
      type: props.formData.type || 'teaching',
      description: props.formData.description || '',
      cover_file_id: props.formData.cover_file_id || null,
      anonymous: props.formData.anonymous ?? true,
      publish_scope: props.formData.publish_scope || 'all_students',
      course_id: props.formData.course_id || null,
      teaching_org_id: props.formData.teaching_org_id || null,
      service_item_id: props.formData.service_item_id || null,
      service_org_id: props.formData.service_org_id || null,
    })

    coverPreviewUrl.value = props.formData._cover_url || ''

    // 加载题目
    const ctx = { tenantId: props.formData.tenant_id }
    const loadedQuestions = await getEvalQuestionsByFormApi(ctx, props.formData.id)
    questions.value = loadedQuestions.map(q => ({
      ...q,
      _options: q._options || [],
    }))
  } catch (err) {
    console.error('加载编辑数据失败:', err)
  } finally {
    formLoading.value = false
  }
}

// 添加题目
function addQuestion(type = 'rating') {
  questions.value.push({
    type,
    title: '',
    required: true,
    max_score: type === 'rating' ? 5 : null,
    min_length: type === 'text' ? 10 : null,
    sort_order: questions.value.length + 1,
    _options: ['single', 'multiple'].includes(type) ? [{ option_text: '', sort_order: 1 }] : [],
  })
}

// 上一步 / 下一步
function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function nextStep() {
  if (currentStep.value < steps.value.length - 1 && stepValid.value) currentStep.value++
}

// 保存并提交预览中的完整保存
async function handleSaveAndPreview() {
  saving.value = true
  try {
    const ctx = { tenantId: props.formData._context?.tenantId, userId: props.formData._context?.userId }
    let formId = props.formData?.id

    if (isEdit.value && formId) {
      await updateEvalFormApi(ctx, formId, { ...form })
    } else {
      const created = await createEvalFormDraftApi(ctx, { ...form })
      formId = created.id
    }

    // 保存题目
    if (formId && questions.value.length > 0) {
      await saveEvalQuestionsApi(ctx, formId, questions.value)
    }

    // 保存窗口
    if (formId && windowForm.start_at && windowForm.end_at) {
      await createEvalWindowApi(ctx, {
        form_id: formId,
        type: form.type,
        start_at: new Date(windowForm.start_at).toISOString(),
        end_at: new Date(windowForm.end_at).toISOString(),
        modifiable_hours: windowForm.modifiable_hours,
        status: new Date(windowForm.end_at) > new Date() ? 'open' : 'closed',
      })
    }

    emit('saved')
    handleClose()
  } catch (err) {
    console.error('保存失败:', err)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

function handleClose() {
  currentStep.value = 0
  resetForm()
  emit('update:visible', false)
}

function resetForm() {
  Object.assign(form, {
    title: '', type: 'teaching', description: '', cover_file_id: null,
    anonymous: true, publish_scope: 'all_students',
    course_id: null, teaching_org_id: null, service_item_id: null, service_org_id: null,
  })
  coverPreviewUrl.value = ''
  questions.value = []
  Object.assign(windowForm, { start_at: '', end_at: '', modifiable_hours: 24 })
}

// 题型标签
const typeLabelMap = { rating: '评分题', text: '文本题', single: '单选题', multiple: '多选题' }

watch(() => props.visible, (val) => {
  if (val) {
    loadTargetOptions()
    if (isEdit.value) loadEditData()
  } else {
    resetForm()
    currentStep.value = 0
  }
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="isLimitedEdit ? '有限修改评价表单' : isEdit ? '编辑评价表单' : '新建评价表单'"
    size="760px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 步骤条 -->
    <el-steps :active="currentStep" finish-status="success" align-center class="drawer-steps">
      <el-step v-for="(s, i) in steps" :key="i" :title="s" />
    </el-steps>

    <div v-loading="formLoading" class="drawer-body">
      <!-- 步骤 1: 基础信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form label-width="80px" label-position="top">
          <el-form-item label="表单名称" required>
            <el-input v-model="form.title" placeholder="请输入评价表单名称" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item v-if="!isLimitedEdit" label="表单类型" required>
            <el-select v-model="form.type" style="width: 100%">
              <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="表单说明">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="简要描述评价目的和范围（选填）" maxlength="500" show-word-limit />
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
              <span class="cover-upload-hint">建议尺寸 16:9，不超过 5MB</span>
            </div>
          </el-form-item>
          <el-form-item label="匿名评价">
            <el-switch v-model="form.anonymous" />
            <span class="field-hint">开启后学生提交评价时不显示个人信息</span>
          </el-form-item>
          <el-alert v-if="isLimitedEdit" type="info" :closable="false" show-icon>
            已发布表单仅允许修改说明、封面、评价窗口设置，不可修改题目结构和评价对象
          </el-alert>
        </el-form>
      </div>

      <!-- 步骤 2: 评价对象与范围 -->
      <div v-show="currentStep === 1 && !isLimitedEdit" class="step-content">
        <el-form label-width="80px" label-position="top">
          <template v-if="isTeaching">
            <el-form-item label="选择课程">
              <el-select v-model="form.course_id" placeholder="选择关联课程（可选）" clearable filterable style="width: 100%">
                <el-option v-for="c in targetOptions.courses" :key="c.id" :label="c.course_name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="教学组织">
              <el-select v-model="form.teaching_org_id" placeholder="选择教学组织（可选）" clearable filterable style="width: 100%">
                <el-option v-for="o in targetOptions.teachingOrgs" :key="o.id" :label="o.name" :value="o.id" />
              </el-select>
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item label="服务项目">
              <el-select v-model="form.service_item_id" placeholder="选择关联服务项目（可选）" clearable filterable style="width: 100%">
                <el-option v-for="s in targetOptions.serviceItems" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务组织">
              <el-select v-model="form.service_org_id" placeholder="选择服务组织（可选）" clearable filterable style="width: 100%">
                <el-option v-for="o in targetOptions.serviceOrgs" :key="o.id" :label="o.name" :value="o.id" />
              </el-select>
            </el-form-item>
          </template>
          <el-form-item label="发布范围">
            <el-select v-model="form.publish_scope" style="width: 100%">
              <el-option label="全部学生" value="all_students" />
              <el-option label="指定班级" value="specified_class" />
              <el-option label="指定专业" value="specified_major" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤 3: 题目配置 -->
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

        <div v-if="questions.length === 0" class="questions-empty">
          <p>暂无题目，请点击上方按钮添加</p>
        </div>

        <QuestionEditor
          v-for="(q, i) in questions"
          :key="i"
          :questions="questions"
          :index="i"
          @update:questions="questions = $event"
        />
      </div>

      <!-- 步骤 4: 评价窗口 -->
      <div v-show="(currentStep === 3 && !isLimitedEdit) || (currentStep === 1 && isLimitedEdit)" class="step-content">
        <el-form label-width="100px" label-position="top">
          <el-form-item label="开始时间" required>
            <el-date-picker
              v-model="windowForm.start_at"
              type="datetime"
              placeholder="选择评价开始时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="结束时间" required>
            <el-date-picker
              v-model="windowForm.end_at"
              type="datetime"
              placeholder="选择评价截止时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="允许修改时长">
            <el-input-number v-model="windowForm.modifiable_hours" :min="0" :max="720" style="width: 200px" />
            <span class="field-hint">小时内学生可修改评价（0 表示不可修改）</span>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤 5: 预览与提交 -->
      <div v-show="currentStep === 4 && !isLimitedEdit" class="step-content">
        <div class="preview-section">
          <div v-if="coverPreviewUrl" class="preview-cover">
            <CoverImage :src="coverPreviewUrl" width="100%" height="200px" radius="var(--radius-lg)" />
          </div>
          <h3 class="preview-title">{{ form.title || '未命名表单' }}</h3>
          <div class="preview-meta">
            <el-tag size="small" effect="light">{{ typeOptions.find(t => t.value === form.type)?.label || form.type }}</el-tag>
            <span v-if="form.anonymous" class="preview-tag">匿名评价</span>
          </div>
          <p v-if="form.description" class="preview-desc">{{ form.description }}</p>

          <div class="preview-block">
            <div class="preview-label">评价对象</div>
            <div class="preview-value">
              <template v-if="isTeaching">
                {{ targetOptions.courses.find(c => c.id === form.course_id)?.course_name || '未指定' }}
                <span v-if="form.teaching_org_id"> / {{ targetOptions.teachingOrgs.find(o => o.id === form.teaching_org_id)?.name }}</span>
              </template>
              <template v-else>
                {{ targetOptions.serviceItems.find(s => s.id === form.service_item_id)?.name || '未指定' }}
                <span v-if="form.service_org_id"> / {{ targetOptions.serviceOrgs.find(o => o.id === form.service_org_id)?.name }}</span>
              </template>
            </div>
          </div>

          <div class="preview-block">
            <div class="preview-label">题目（{{ questions.length }} 道）</div>
            <div v-for="(q, i) in questions" :key="i" class="preview-question">
              <span class="pq-index">{{ i + 1 }}.</span>
              <span class="pq-title">{{ q.title || '未填写标题' }}</span>
              <el-tag size="small" type="info">{{ typeLabelMap[q.type] || q.type }}</el-tag>
              <span v-if="q.required" class="pq-required">必填</span>
            </div>
          </div>

          <div class="preview-block">
            <div class="preview-label">评价窗口</div>
            <div class="preview-value">
              {{ windowForm.start_at ? new Date(windowForm.start_at).toLocaleString() : '未设置' }}
              — {{ windowForm.end_at ? new Date(windowForm.end_at).toLocaleString() : '未设置' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="drawer-footer">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button v-if="currentStep < steps.length - 1" type="primary" :disabled="!stepValid" @click="nextStep">下一步</el-button>
          <el-button v-if="currentStep === steps.length - 1" type="primary" :loading="saving" @click="handleSaveAndPreview">保存</el-button>
        </div>
      </div>
    </template>
  </el-drawer>

  <!-- 封面上传弹窗 -->
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
      <el-alert type="info" :closable="false" show-icon style="margin-top: 16px">
        当前为本地预览模式，后端上传接口开发后将自动对接真实上传
      </el-alert>
    </div>
  </el-dialog>

  <!-- 封面预览弹窗 -->
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

/* 题目配置 */
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

/* 预览 */
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

/* 底部 */
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

/* 封面上传 */
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

/* 上传弹窗 */
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
