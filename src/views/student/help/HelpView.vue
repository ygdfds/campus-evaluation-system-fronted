<script setup>
import { ref, computed } from 'vue'
import { ChatLineSquare, Phone, Message, QuestionFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'StudentHelpView' })

const activeCategory = ref('evaluation')

const categories = [
  { key: 'evaluation', label: '评价相关', icon: QuestionFilled },
  { key: 'account', label: '账号相关', icon: ChatLineSquare },
  { key: 'complaint', label: '投诉建议', icon: Message },
  { key: 'system', label: '系统使用', icon: Phone },
]

// FAQ 数据
const faqData = {
  evaluation: [
    { q: '如何提交评价？', a: '在评价中心找到对应的评价任务，点击"去评价"按钮进入评价提交页，按题目要求填写评分和文字反馈后提交即可。' },
    { q: '评价提交后还能修改吗？', a: '如果评价窗口仍在有效期内且未被锁定，您可以在"可修改"状态下点击"修改评价"进行更改。超过修改期限后将无法修改。' },
    { q: '错过评价时间怎么办？', a: '评价窗口关闭后将无法补评。建议关注首页待办提醒和评价日历，及时处理即将截止的评价任务。' },
    { q: '评价是匿名的吗？', a: '是的，评价提交后系统会进行匿名处理，被评价方无法查看评价人信息。' },
  ],
  account: [
    { q: '忘记密码怎么办？', a: '请在登录页点击"忘记密码"，通过绑定的邮箱或手机号进行密码重置。如仍无法找回，请联系学校服务支持。' },
    { q: '如何修改个人信息？', a: '登录后点击右上角头像，选择"个人信息"即可修改昵称、头像等基本资料。学号等关键信息需联系管理员修改。' },
    { q: '为什么看不到某些评价任务？', a: '教学评价仅对选课学生可见，后勤服务评价面向全校开放。如确认应可见但未显示，请检查是否已登录正确账号。' },
  ],
  complaint: [
    { q: '如何提交投诉或建议？', a: '在导航栏进入"投诉建议"页面，点击"新建投诉"填写标题、分类和详细描述后提交。' },
    { q: '投诉处理后多久能收到反馈？', a: '一般投诉将在 3 个工作日内给出初步反馈，复杂问题可能需要 5-7 个工作日。您可以在投诉详情页查看处理进度。' },
    { q: '对处理结果不满意怎么办？', a: '您可以在投诉详情页追加留言说明不满原因，相关部门会进行二次处理。也可联系学校服务支持进行人工跟进。' },
  ],
  system: [
    { q: '系统支持哪些浏览器？', a: '推荐使用 Chrome、Edge、Firefox 等现代浏览器的最新版本。不支持 IE 浏览器。' },
    { q: '页面显示异常怎么办？', a: '请尝试刷新页面（Ctrl+F5 强制刷新）、清除浏览器缓存，或更换浏览器重试。如问题持续请联系服务支持。' },
    { q: '如何退出登录？', a: '点击右上角用户头像，在下拉菜单中选择"退出登录"即可。' },
  ],
}

// 操作流程
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

const currentFaqs = computed(() => faqData[activeCategory.value] || [])
const currentProcess = computed(() => processSteps[activeCategory.value] || null)

const contactInfo = [
  { label: '服务热线', value: '400-123-4567', desc: '工作日 8:30 - 17:30' },
  { label: '服务邮箱', value: 'support@campus.edu.cn', desc: '24 小时内回复' },
  { label: '线下服务', value: '行政楼 1 楼服务大厅', desc: '工作日 9:00 - 12:00, 14:00 - 17:00' },
]
</script>

<template>
  <div class="help-page">
    <div class="page-header">
      <h1 class="page-title">帮助中心</h1>
      <p class="page-subtitle">常见问题解答与使用指南，帮助您快速解决问题</p>
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
          <el-collapse accordion class="faq-collapse">
            <el-collapse-item
              v-for="(faq, idx) in currentFaqs"
              :key="idx"
              :title="faq.q"
              :name="idx"
            >
              <p class="faq-answer">{{ faq.a }}</p>
            </el-collapse-item>
          </el-collapse>
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
