<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChatLineSquare, Phone, Message, QuestionFilled, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getStudentHelpHomeApi } from '@/api/studentHelp'

defineOptions({ name: 'StudentHelpView' })

const userStore = useUserStore()

const activeCategory = ref('all')
const searchKeyword = ref('')
const loading = ref(false)

// 分类列表（含"全部"）
const categories = [
  { key: 'all', label: '全部', icon: QuestionFilled },
  { key: 'evaluation', label: '评价相关', icon: QuestionFilled },
  { key: 'account', label: '账号相关', icon: ChatLineSquare },
  { key: 'complaint', label: '投诉建议', icon: Message },
  { key: 'system', label: '系统使用', icon: Phone },
]

// FAQ 分类映射
const faqCategoryMap = {
  evaluation: '评价相关',
  appeal: '申诉追溯',
  feedback: '反馈工单',
  report: '数据报表',
  notification: '消息通知',
  account: '账号设置',
  permission: '权限管理',
  system: '系统功能',
  complaint: '投诉建议',
  user: '用户管理',
  org: '组织架构',
  data: '数据统计',
  form_audit: '表单审核',
}

// 动态数据
const allFaqs = ref([])
const allGuides = ref([])

// 操作流程（保留静态，作为使用指南）
const processSteps = {
  evaluation: [
    { step: 1, title: '查看评价任务', desc: '在评价中心浏览待办评价，了解评价对象和时间范围' },
    { step: 2, title: '进入评价页面', desc: '点击"去评价"按钮进入评价表单' },
    { step: 3, title: '填写评分与反馈', desc: '按题目要求打分并填写文字评价' },
    { step: 4, title: '提交评价', desc: '确认无误后点击提交，评价将匿名处理' },
  ],
  complaint: [
    { step: 1, title: '新建投诉', desc: '进入投诉建议页面，点击新建按钮' },
    { step: 2, title: '填写详情', desc: '选择分类、填写标题和描述' },
    { step: 3, title: '等待处理', desc: '提交后相关部门将在 3 个工作日内响应' },
    { step: 4, title: '查看反馈', desc: '在详情页查看处理结果，可追加留言' },
  ],
}

const contactInfo = [
  { label: '服务热线', value: '400-123-4567', desc: '工作日 8:30 - 17:30' },
  { label: '服务邮箱', value: 'support@campus.edu.cn', desc: '24 小时内回复' },
  { label: '线下服务', value: '行政楼 1 楼服务大厅', desc: '工作日 9:00 - 12:00, 14:00 - 17:00' },
]

// 根据分类和搜索过滤 FAQ
const currentFaqs = computed(() => {
  let faqs = allFaqs.value
  if (activeCategory.value !== 'all') {
    faqs = faqs.filter(f => f.category === activeCategory.value)
  }
  return faqs
})

const currentProcess = computed(() => processSteps[activeCategory.value] || null)

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const currentUser = {
      tenantId: userStore.tenantId,
      userId: userStore.userId,
    }
    const params = { keyword: searchKeyword.value }
    const { guides, faqs } = await getStudentHelpHomeApi(params, currentUser)
    allFaqs.value = faqs
    allGuides.value = guides
  } catch (e) {
    console.error('加载帮助中心数据失败', e)
  } finally {
    loading.value = false
  }
}

// 搜索防抖
let searchTimer = null
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadData()
  }, 300)
}

// 切换分类时重新加载
watch(activeCategory, () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="help-page">
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1 class="page-title">帮助中心</h1>
          <p class="page-subtitle">常见问题解答与使用指南，帮助您快速解决问题</p>
        </div>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索问题或关键词"
          clearable
          :prefix-icon="Search"
          style="width: 260px"
          @input="handleSearch"
          @clear="loadData"
        />
      </div>
    </div>

    <div class="help-layout">
      <!-- 左侧分类导航 -->
      <aside class="help-sidebar">
        <nav class="category-list">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="category-item"
            :class="{ 'is-active': activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            <el-icon :size="16"><component :is="cat.icon" /></el-icon>
            <span>{{ cat.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧内容区 -->
      <div class="help-content">
        <!-- FAQ 折叠面板 -->
        <div class="content-card">
          <h3 class="card-title">常见问题</h3>
          <div v-if="loading" class="faq-loading">
            <el-skeleton :rows="3" animated />
          </div>
          <el-collapse v-else-if="currentFaqs.length" accordion class="faq-collapse">
            <el-collapse-item
              v-for="faq in currentFaqs"
              :key="faq.id"
              :title="faq.question"
              :name="faq.id"
            >
              <p class="faq-answer">{{ faq.answer }}</p>
              <span v-if="faq.category" class="faq-category-tag">{{ faqCategoryMap[faq.category] || faq.category }}</span>
            </el-collapse-item>
          </el-collapse>
          <div v-else class="faq-empty">
            <el-empty description="暂无常见问题" :image-size="80" />
          </div>
        </div>

        <!-- 操作流程卡片 -->
        <div v-if="currentProcess" class="content-card">
          <h3 class="card-title">操作流程</h3>
          <div class="process-steps">
            <div v-for="item in currentProcess" :key="item.step" class="process-step">
              <div class="step-number">{{ item.step }}</div>
              <div class="step-body">
                <div class="step-title">{{ item.title }}</div>
                <div class="step-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 联系方式卡片 -->
        <div class="content-card">
          <h3 class="card-title">联系学校服务支持</h3>
          <div class="contact-list">
            <div v-for="item in contactInfo" :key="item.label" class="contact-item">
              <div class="contact-label">{{ item.label }}</div>
              <div class="contact-value">{{ item.value }}</div>
              <div class="contact-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* ===== 页面标题区 ===== */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.page-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-heading);
  margin: 0;
  line-height: var(--line-height-tight);
}

.page-subtitle {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
  margin-top: var(--space-1);
}

/* ===== 两栏布局 ===== */
.help-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-6);
  align-items: start;
}

/* ===== 左侧分类 ===== */
.help-sidebar {
  position: sticky;
  top: calc(var(--nav-height) + var(--space-6));
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-3);
}

.category-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-body);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.category-item:hover {
  background: var(--color-bg-hover);
}

.category-item.is-active {
  background: var(--color-primary-50);
  color: var(--color-accent-user-700);
  font-weight: 600;
}

/* ===== 右侧内容 ===== */
.help-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.content-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5) var(--space-6);
}

.card-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-4);
}

/* FAQ */
.faq-collapse {
  border: none;
}

.faq-collapse :deep(.el-collapse-item__header) {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  height: 48px;
  border-bottom-color: var(--color-border-light);
}

.faq-collapse :deep(.el-collapse-item__wrap) {
  border-bottom-color: var(--color-border-light);
}

.faq-collapse :deep(.el-collapse-item__content) {
  padding-bottom: var(--space-4);
}

.faq-answer {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed, 1.7);
  margin: 0;
}

.faq-category-tag {
  display: inline-block;
  margin-top: var(--space-2);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-page-alt);
  color: var(--color-text-muted);
  font-size: var(--font-2xs);
}

.faq-loading,
.faq-empty {
  padding: var(--space-4) 0;
}

/* 操作流程 */
.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-page-alt);
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full, 999px);
  background: var(--color-accent-user-700);
  color: var(--color-text-white);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.step-title {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}

.step-desc {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed, 1.6);
}

/* 联系方式 */
.contact-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.contact-item {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.contact-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.contact-value {
  font-size: var(--font-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}

.contact-desc {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .help-layout {
    grid-template-columns: 1fr;
  }
  .help-sidebar {
    position: static;
  }
  .category-list {
    flex-direction: row;
    overflow-x: auto;
  }
  .category-item {
    white-space: nowrap;
    width: auto;
  }
  .process-steps {
    grid-template-columns: 1fr;
  }
}
</style>
