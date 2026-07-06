<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, Plus, Edit, Delete, Document, Notebook } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  getSchoolHelpFaqsApi,
  getSchoolHelpGuidesApi,
  saveSchoolHelpFaqApi,
  saveSchoolHelpGuideApi,
  toggleSchoolHelpFaqApi,
  toggleSchoolHelpGuideApi,
  deleteSchoolHelpFaqApi,
  deleteSchoolHelpGuideApi,
} from '@/api/schoolHelp'

defineOptions({ name: 'SchoolHelpContentManageView' })

const userStore = useUserStore()

const activeTab = ref('faq')
const faqLoading = ref(false)
const guideLoading = ref(false)
const faqs = ref([])
const guides = ref([])

const faqFilters = ref({ keyword: '', category: 'all', enabled: 'all' })
const guideFilters = ref({ keyword: '', enabled: 'all' })

// 编辑弹窗
const editVisible = ref(false)
const editType = ref('faq') // 'faq' | 'guide'
const editForm = ref({})

const faqCategories = [
  { value: 'evaluation', label: '评价相关' },
  { value: 'appeal', label: '申诉追溯' },
  { value: 'feedback', label: '反馈工单' },
  { value: 'report', label: '数据报表' },
  { value: 'notification', label: '消息通知' },
  { value: 'account', label: '账号设置' },
  { value: 'permission', label: '权限管理' },
  { value: 'system', label: '系统功能' },
  { value: 'complaint', label: '投诉建议' },
  { value: 'user', label: '用户管理' },
  { value: 'org', label: '组织架构' },
  { value: 'data', label: '数据统计' },
]

async function loadFaqs() {
  faqLoading.value = true
  try {
    faqs.value = await getSchoolHelpFaqsApi(userStore.tenantId, faqFilters.value)
  } catch { ElMessage.error('加载FAQ失败') }
  finally { faqLoading.value = false }
}

async function loadGuides() {
  guideLoading.value = true
  try {
    guides.value = await getSchoolHelpGuidesApi(userStore.tenantId, guideFilters.value)
  } catch { ElMessage.error('加载操作指引失败') }
  finally { guideLoading.value = false }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'faq') loadFaqs()
  else loadGuides()
}

// FAQ 编辑
function openFaqEdit(faq) {
  editType.value = 'faq'
  editForm.value = faq ? { ...faq } : { question: '', answer: '', category: 'evaluation', keywords: '', sort_order: faqs.value.length + 1, enabled: true }
  editVisible.value = true
}

async function saveFaq() {
  if (!editForm.value.question?.trim()) { ElMessage.warning('请填写问题'); return }
  if (!editForm.value.answer?.trim()) { ElMessage.warning('请填写回答'); return }
  try {
    await saveSchoolHelpFaqApi(userStore.tenantId, userStore.schoolId, userStore.userInfo?.id, editForm.value)
    ElMessage.success('保存成功')
    editVisible.value = false
    loadFaqs()
  } catch { ElMessage.error('保存失败') }
}

async function toggleFaq(faq) {
  try {
    await toggleSchoolHelpFaqApi(faq.id, !faq.enabled)
    ElMessage.success(faq.enabled ? '已停用' : '已启用')
    loadFaqs()
  } catch { ElMessage.error('操作失败') }
}

async function handleDeleteFaq(faq) {
  try {
    await ElMessageBox.confirm(`确认删除 FAQ「${faq.question}」？`, '删除确认', { type: 'warning' })
    await deleteSchoolHelpFaqApi(faq.id)
    ElMessage.success('已删除')
    loadFaqs()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

// 操作指引编辑
function openGuideEdit(guide) {
  editType.value = 'guide'
  editForm.value = guide ? { ...guide, steps: [...(guide.steps || [])] } : { title: '', module: '', summary: '', steps: [''], related_link: '', sort_order: guides.value.length + 1, enabled: true }
  editVisible.value = true
}

function addStep() {
  if (!editForm.value.steps) editForm.value.steps = []
  editForm.value.steps.push('')
}

function removeStep(idx) {
  editForm.value.steps.splice(idx, 1)
}

async function saveGuide() {
  if (!editForm.value.title?.trim()) { ElMessage.warning('请填写标题'); return }
  try {
    await saveSchoolHelpGuideApi(userStore.tenantId, userStore.schoolId, userStore.userInfo?.id, editForm.value)
    ElMessage.success('保存成功')
    editVisible.value = false
    loadGuides()
  } catch { ElMessage.error('保存失败') }
}

async function toggleGuide(guide) {
  try {
    await toggleSchoolHelpGuideApi(guide.id, !guide.enabled)
    ElMessage.success(guide.enabled ? '已停用' : '已启用')
    loadGuides()
  } catch { ElMessage.error('操作失败') }
}

async function handleDeleteGuide(guide) {
  try {
    await ElMessageBox.confirm(`确认删除「${guide.title}」？`, '删除确认', { type: 'warning' })
    await deleteSchoolHelpGuideApi(guide.id)
    ElMessage.success('已删除')
    loadGuides()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

onMounted(() => { loadFaqs(); loadGuides() })
</script>

<template>
  <div class="page">
    <PageHeader title="帮助内容管理" description="管理帮助中心 FAQ 和操作指引内容">
      <template #actions>
        <el-button :icon="Refresh" @click="activeTab === 'faq' ? loadFaqs() : loadGuides()">刷新</el-button>
      </template>
    </PageHeader>

    <div class="toolbar">
      <el-radio-group :model-value="activeTab" @change="switchTab" size="large">
        <el-radio-button value="faq"><el-icon><Document /></el-icon>常见问题 FAQ</el-radio-button>
        <el-radio-button value="guide"><el-icon><Notebook /></el-icon>操作指引</el-radio-button>
      </el-radio-group>
    </div>

    <!-- FAQ Tab -->
    <template v-if="activeTab === 'faq'">
      <div class="filters">
        <el-input v-model="faqFilters.keyword" placeholder="搜索问题或回答…" :prefix-icon="Search" clearable @clear="loadFaqs" @keyup.enter="loadFaqs" />
        <el-select v-model="faqFilters.category" @change="loadFaqs">
          <el-option label="全部分类" value="all" />
          <el-option v-for="c in faqCategories" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-select v-model="faqFilters.enabled" @change="loadFaqs">
          <el-option label="全部状态" value="all" />
          <el-option label="已启用" value="true" />
          <el-option label="已停用" value="false" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="openFaqEdit(null)">新增 FAQ</el-button>
      </div>

      <div class="list-box" v-loading="faqLoading">
        <el-table :data="faqs" stripe style="width: 100%" :header-cell-style="{ background: 'var(--color-bg-light)', color: 'var(--color-text-secondary)', fontSize: '13px' }">
          <el-table-column prop="sort_order" label="排序" width="70" />
          <el-table-column prop="question" label="问题" min-width="250" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="110" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" size="small" :icon="Edit" @click="openFaqEdit(row)">编辑</el-button>
              <el-button text :type="row.enabled ? 'warning' : 'success'" size="small" @click="toggleFaq(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
              <el-button text type="danger" size="small" :icon="Delete" @click="handleDeleteFaq(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!faqLoading && faqs.length === 0" class="empty">
          <el-icon :size="48" color="var(--color-text-placeholder)"><Document /></el-icon>
          <p>暂无 FAQ 数据</p>
          <span>点击上方「新增 FAQ」按钮添加常见问题。</span>
        </div>
      </div>
    </template>

    <!-- 操作指引 Tab -->
    <template v-if="activeTab === 'guide'">
      <div class="filters">
        <el-input v-model="guideFilters.keyword" placeholder="搜索标题或摘要…" :prefix-icon="Search" clearable @clear="loadGuides" @keyup.enter="loadGuides" />
        <el-select v-model="guideFilters.enabled" @change="loadGuides">
          <el-option label="全部状态" value="all" />
          <el-option label="已启用" value="true" />
          <el-option label="已停用" value="false" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="openGuideEdit(null)">新增指引</el-button>
      </div>

      <div class="list-box" v-loading="guideLoading">
        <el-table :data="guides" stripe style="width: 100%" :header-cell-style="{ background: 'var(--color-bg-light)', color: 'var(--color-text-secondary)', fontSize: '13px' }">
          <el-table-column prop="sort_order" label="排序" width="70" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="summary" label="摘要" min-width="200" show-overflow-tooltip />
          <el-table-column label="步骤数" width="80">
            <template #default="{ row }">{{ row.steps?.length || 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" size="small" :icon="Edit" @click="openGuideEdit(row)">编辑</el-button>
              <el-button text :type="row.enabled ? 'warning' : 'success'" size="small" @click="toggleGuide(row)">{{ row.enabled ? '停用' : '启用' }}</el-button>
              <el-button text type="danger" size="small" :icon="Delete" @click="handleDeleteGuide(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!guideLoading && guides.length === 0" class="empty">
          <el-icon :size="48" color="var(--color-text-placeholder)"><Notebook /></el-icon>
          <p>暂无操作指引</p>
          <span>点击上方「新增指引」按钮添加操作指引。</span>
        </div>
      </div>
    </template>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" :title="editType === 'faq' ? (editForm.id ? '编辑 FAQ' : '新增 FAQ') : (editForm.id ? '编辑操作指引' : '新增操作指引')" width="640px" :close-on-click-modal="false">
      <template v-if="editType === 'faq'">
        <el-form label-position="top">
          <el-form-item label="问题"><el-input v-model="editForm.question" placeholder="请输入问题" /></el-form-item>
          <el-form-item label="回答"><el-input v-model="editForm.answer" type="textarea" :rows="4" placeholder="请输入回答内容" /></el-form-item>
          <el-form-item label="分类">
            <el-select v-model="editForm.category" style="width:100%">
              <el-option v-for="c in faqCategories" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词"><el-input v-model="editForm.keywords" placeholder="逗号分隔，如：评价数据,权限" /></el-form-item>
          <el-form-item label="排序"><el-input-number v-model="editForm.sort_order" :min="1" :max="99" /></el-form-item>
        </el-form>
      </template>
      <template v-else>
        <el-form label-position="top">
          <el-form-item label="标题"><el-input v-model="editForm.title" placeholder="请输入指引标题" /></el-form-item>
          <el-form-item label="摘要"><el-input v-model="editForm.summary" placeholder="简要说明" /></el-form-item>
          <el-form-item label="操作步骤">
            <div class="steps-editor">
              <div v-for="(step, i) in editForm.steps" :key="i" class="step-row">
                <span class="step-num">{{ i + 1 }}</span>
                <el-input v-model="editForm.steps[i]" placeholder="步骤描述" />
                <el-button text type="danger" size="small" @click="removeStep(i)">删除</el-button>
              </div>
              <el-button text type="primary" @click="addStep">+ 添加步骤</el-button>
            </div>
          </el-form-item>
          <el-form-item label="排序"><el-input-number v-model="editForm.sort_order" :min="1" :max="99" /></el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="editType === 'faq' ? saveFaq() : saveGuide()">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.toolbar { display: flex; align-items: center; gap: var(--space-4); background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-3) var(--space-4); }
.toolbar :deep(.el-radio-group) { display: flex; background: var(--color-bg-light); border-radius: var(--radius-md); padding: 3px; }
.toolbar :deep(.el-radio-button__inner) { display: inline-flex; align-items: center; gap: var(--space-1); border: none !important; background: transparent !important; border-radius: var(--radius-sm) !important; padding: 6px var(--space-4); font-weight: var(--font-weight-medium); box-shadow: none !important; }
.toolbar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { background: var(--color-bg-card) !important; box-shadow: var(--shadow-sm) !important; color: var(--color-primary); }

.filters { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-3) var(--space-4); }
.filters .el-input { width: 260px; }
.filters .el-select { width: 130px; }

.list-box { background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-4); min-height: 300px; }
.empty { display: flex; flex-direction: column; align-items: center; padding: var(--space-12); gap: var(--space-2); }
.empty p { font-size: var(--font-base); color: var(--color-text-secondary); margin: 0; }
.empty span { font-size: var(--font-sm); color: var(--color-text-placeholder); }

.steps-editor { width: 100%; display: flex; flex-direction: column; gap: var(--space-2); }
.step-row { display: flex; align-items: center; gap: var(--space-2); }
.step-num { width: 24px; height: 24px; display: grid; place-items: center; border-radius: var(--radius-full); background: var(--color-primary-50); color: var(--color-primary); font-size: var(--font-xs); font-weight: var(--font-weight-semibold); flex-shrink: 0; }
</style>
