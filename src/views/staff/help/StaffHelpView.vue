<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Document, ChatDotRound, DataAnalysis, Bell, User,
  Promotion, ArrowRight, Clock, Check
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getStaffHelpHomeApi, closeHelpTicketApi } from '@/api/staffHelp'
import HelpTicketDrawer from '@/components/staff/help/HelpTicketDrawer.vue'
import HelpTicketDetailDrawer from '@/components/staff/help/HelpTicketDetailDrawer.vue'

defineOptions({ name: 'StaffHelpView' })

const router = useRouter()
const userStore = useUserStore()

// 状态
const loading = ref(true)
const searchKeyword = ref('')
const guides = ref([])
const faqs = ref([])
const myTickets = ref([])
const ticketDrawerVisible = ref(false)
const detailDrawerVisible = ref(false)
const selectedTicket = ref(null)
const activeFaqCategory = ref('')
const faqActiveNames = ref([])

// 快捷入口
const quickEntries = [
  { title: '评价管理', desc: '创建和管理评价表单', icon: Document, path: '/staff/evaluation/forms' },
  { title: '反馈处理', desc: '查看和处理学生反馈', icon: ChatDotRound, path: '/staff/feedback' },
  { title: '申诉处理', desc: '受理评价申诉请求', icon: Promotion, path: '/staff/appeals' },
  { title: '数据看板', desc: '查看评价数据统计', icon: DataAnalysis, path: '/staff/reports' },
  { title: '消息通知', desc: '查看系统消息提醒', icon: Bell, path: '/staff/notifications' },
  { title: '个人信息', desc: '管理个人资料与设置', icon: User, path: '/staff/profile' },
]

// FAQ 分类
const faqCategories = [
  { label: '全部', value: '' },
  { label: '权限与数据', value: 'permission' },
  { label: '评价管理', value: 'evaluation' },
  { label: '反馈处理', value: 'feedback' },
  { label: '申诉处理', value: 'appeal' },
  { label: '数据看板', value: 'report' },
  { label: '消息通知', value: 'notification' },
  { label: '账号安全', value: 'account' },
  { label: '系统问题', value: 'system' },
]

// 工单状态映射
const ticketStatusMap = {
  pending: { label: '待处理', type: 'warning' },
  processing: { label: '处理中', type: '' },
  replied: { label: '已回复', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
}

// 工单分类映射
const ticketCategoryMap = {
  permission: '权限与数据',
  evaluation: '评价管理',
  feedback: '反馈处理',
  appeal: '申诉处理',
  notification: '消息通知',
  account: '账号安全',
  system: '系统问题',
}

// 操作指引模块名中文映射
const moduleLabelMap = {
  evaluation_form: '评价管理',
  feedback: '反馈处理',
  appeal: '申诉处理',
  report: '数据看板',
  notification: '消息通知',
  account: '账号安全',
}

// 过滤后的 FAQ
const filteredFaqs = computed(() => {
  if (!activeFaqCategory.value) return faqs.value
  return faqs.value.filter(f => f.category === activeFaqCategory.value)
})

// 获取用户上下文
function getUserContext() {
  const info = userStore.userInfo || {}
  return {
    tenantId: userStore.tenantId || info.tenant_id,
    userId: info.id || info.user_id || info.account_id,
    schoolId: info.school_id || 1,
  }
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const ctx = getUserContext()
    const result = await getStaffHelpHomeApi({ keyword: searchKeyword.value }, ctx)
    guides.value = result.guides
    faqs.value = result.faqs
    myTickets.value = result.myTickets
  } catch (err) {
    console.error('加载帮助中心数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 搜索
let searchTimer = null
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    faqActiveNames.value = []
    loadData()
  }, 300)
}

// 跳转
function goTo(path) {
  router.push(path)
}

// 打开提交工单抽屉
function openTicketDrawer() {
  ticketDrawerVisible.value = true
}

// 工单提交成功
function onTicketSubmitted() {
  loadData()
}

// 查看工单详情
function viewTicketDetail(ticket) {
  selectedTicket.value = ticket
  detailDrawerVisible.value = true
}

// 关闭工单
async function handleCloseTicket(ticket) {
  try {
    await ElMessageBox.confirm(
      `确定要关闭工单「${ticket.title}」吗？关闭后将无法重新打开。`,
      '关闭工单',
      { confirmButtonText: '确定关闭', cancelButtonText: '取消', type: 'warning' }
    )
    const ctx = getUserContext()
    await closeHelpTicketApi(ticket.id, ctx)
    ElMessage.success('工单已关闭')
    loadData()
    // 如果详情抽屉打开着，也刷新
    if (selectedTicket.value?.id === ticket.id) {
      selectedTicket.value = { ...selectedTicket.value, status: 'closed' }
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '关闭失败')
    }
  }
}

// FAQ 分类切换时重置展开状态
function onFaqCategoryChange() {
  faqActiveNames.value = []
}

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="help-page">
    <div class="help-container">
      <!-- 顶部标题区 -->
      <div class="help-header">
        <div class="help-header-left">
          <h1 class="help-title">帮助中心</h1>
          <p class="help-subtitle">查找操作指引、常见问题或提交帮助请求</p>
        </div>
        <div class="help-header-right">
          <el-button type="primary" @click="openTicketDrawer">
            <el-icon :size="14"><Plus /></el-icon>
            提交问题
          </el-button>
        </div>
      </div>

      <!-- 搜索区 -->
      <div class="help-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索功能、问题或操作关键词"
          size="large"
          clearable
          @input="handleSearch"
          @clear="loadData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 快捷入口区 -->
      <section class="help-section">
        <h2 class="section-title">常用入口</h2>
        <div class="quick-entries">
          <div
            v-for="entry in quickEntries"
            :key="entry.path"
            class="quick-entry-card"
            @click="goTo(entry.path)"
          >
            <div class="quick-entry-icon">
              <el-icon :size="24"><component :is="entry.icon" /></el-icon>
            </div>
            <div class="quick-entry-info">
              <span class="quick-entry-title">{{ entry.title }}</span>
              <span class="quick-entry-desc">{{ entry.desc }}</span>
            </div>
            <el-icon class="quick-entry-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </section>

      <!-- 操作指引区 -->
      <section class="help-section">
        <h2 class="section-title">操作指引</h2>
        <div v-loading="loading" class="guide-list">
          <div v-if="guides.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无操作指引" :image-size="80" />
          </div>
          <div v-for="guide in guides" :key="guide.id" class="guide-card">
            <div class="guide-header">
              <h3 class="guide-title">{{ guide.title }}</h3>
              <el-tag size="small" type="info">{{ moduleLabelMap[guide.module] || guide.module }}</el-tag>
            </div>
            <p class="guide-summary">{{ guide.summary }}</p>
            <div class="guide-steps">
              <div v-for="(step, idx) in guide.steps" :key="idx" class="step-item">
                <span class="step-number">{{ idx + 1 }}</span>
                <span class="step-text">{{ step }}</span>
              </div>
            </div>
            <div class="guide-footer">
              <el-button text type="primary" size="small" @click="goTo(guide.related_link)">
                前往相关页面 <el-icon :size="12"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 常见问题区 -->
      <section class="help-section">
        <h2 class="section-title">常见问题</h2>
        <div class="faq-filter">
          <el-radio-group v-model="activeFaqCategory" size="small" @change="onFaqCategoryChange">
            <el-radio-button v-for="cat in faqCategories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div v-loading="loading" class="faq-list">
          <div v-if="filteredFaqs.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无相关问题" :image-size="80" />
          </div>
          <el-collapse v-model="faqActiveNames" accordion class="faq-collapse">
            <el-collapse-item v-for="faq in filteredFaqs" :key="faq.id" :name="faq.id">
              <template #title>
                <div class="faq-question">
                  <el-icon class="faq-icon"><ChatDotRound /></el-icon>
                  <span>{{ faq.question }}</span>
                </div>
              </template>
              <div class="faq-answer">{{ faq.answer }}</div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </section>

      <!-- 我的工单区 -->
      <section class="help-section">
        <div class="section-title-row">
          <h2 class="section-title">我的帮助工单</h2>
          <el-button text type="primary" size="small" @click="openTicketDrawer">
            <el-icon :size="14"><Plus /></el-icon>
            提交问题
          </el-button>
        </div>
        <div v-loading="loading" class="my-tickets">
          <div v-if="myTickets.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无帮助工单" :image-size="80" />
          </div>
          <div v-for="ticket in myTickets" :key="ticket.id" class="ticket-item" @click="viewTicketDetail(ticket)">
            <div class="ticket-main">
              <div class="ticket-header">
                <span class="ticket-no">{{ ticket.ticket_no }}</span>
                <el-tag :type="ticketStatusMap[ticket.status]?.type" size="small">
                  {{ ticketStatusMap[ticket.status]?.label }}
                </el-tag>
              </div>
              <h4 class="ticket-title">{{ ticket.title }}</h4>
              <div class="ticket-meta">
                <span class="ticket-category">{{ ticketCategoryMap[ticket.category] }}</span>
                <span class="ticket-time">
                  <el-icon :size="12"><Clock /></el-icon>
                  {{ formatTime(ticket.created_at) }}
                </span>
              </div>
              <div v-if="ticket.reply_content" class="ticket-reply-preview">
                <el-icon :size="12"><Check /></el-icon>
                <span>{{ ticket.reply_content }}</span>
              </div>
            </div>
            <div class="ticket-actions">
              <el-button text type="primary" size="small" @click.stop="viewTicketDetail(ticket)">
                查看详情
              </el-button>
              <el-button
                v-if="ticket.status === 'replied'"
                text
                type="info"
                size="small"
                @click.stop="handleCloseTicket(ticket)"
              >
                关闭工单
              </el-button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 提交工单抽屉 -->
    <HelpTicketDrawer
      v-model="ticketDrawerVisible"
      @submitted="onTicketSubmitted"
    />

    <!-- 工单详情抽屉 -->
    <HelpTicketDetailDrawer
      v-model="detailDrawerVisible"
      :ticket="selectedTicket"
      @close-ticket="handleCloseTicket"
    />
  </div>
</template>

<style scoped>
.help-page {
  min-height: calc(100vh - 64px);
  background: var(--color-bg-page, #f5f7f0);
  padding: var(--space-8, 32px) 0;
}

.help-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6, 24px);
}

/* 顶部标题区 */
.help-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6, 24px);
}

.help-title {
  font-size: var(--font-2xl, 24px);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0 0 var(--space-1, 4px) 0;
}

.help-subtitle {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-muted, #6b7c6b);
  margin: 0;
}

/* 搜索区 */
.help-search {
  margin-bottom: var(--space-8, 32px);
}

.help-search :deep(.el-input__wrapper) {
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06));
  padding: var(--space-3, 12px) var(--space-4, 16px);
}

/* 区块 */
.help-section {
  margin-bottom: var(--space-8, 32px);
}

.section-title {
  font-size: var(--font-lg, 18px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0 0 var(--space-4, 16px) 0;
}

/* 快捷入口 */
.quick-entries {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4, 16px);
}

.quick-entry-card {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-4, 16px) var(--space-5, 20px);
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06));
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-entry-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.1));
}

.quick-entry-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light-9, #f0f9eb);
  border-radius: var(--radius-md, 8px);
  color: var(--color-primary, #2d7a4f);
}

.quick-entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-entry-title {
  font-size: var(--font-base, 15px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-heading, #1a2e1a);
}

.quick-entry-desc {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted, #6b7c6b);
}

.quick-entry-arrow {
  color: var(--color-text-placeholder, #a3b0a3);
}

/* 操作指引 */
.guide-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4, 16px);
}

.guide-list > .empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.guide-card {
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06));
  padding: var(--space-5, 20px);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2, 8px);
}

.guide-title {
  font-size: var(--font-base, 15px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0;
}

.guide-summary {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-secondary, #4a5c4a);
  margin: 0 0 var(--space-3, 12px) 0;
  line-height: var(--line-height-relaxed, 1.6);
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  margin-bottom: var(--space-3, 12px);
}

.step-item {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.step-number {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light-9, #f0f9eb);
  color: var(--color-primary, #2d7a4f);
  border-radius: 50%;
  font-size: 11px;
  font-weight: var(--font-weight-medium, 500);
  flex-shrink: 0;
}

.step-text {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-secondary, #4a5c4a);
}

.guide-footer {
  border-top: 1px solid var(--color-border-light, #e8ede8);
  padding-top: var(--space-3, 12px);
}

/* FAQ */
.faq-filter {
  margin-bottom: var(--space-4, 16px);
}

.faq-list {
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06));
  padding: var(--space-4, 16px) var(--space-5, 20px);
}

.faq-collapse {
  border: none;
}

.faq-collapse :deep(.el-collapse-item__header) {
  border-bottom: 1px solid var(--color-border-light, #e8ede8);
  height: auto;
  padding: var(--space-3, 12px) 0;
}

.faq-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 1px solid var(--color-border-light, #e8ede8);
}

.faq-collapse :deep(.el-collapse-item__content) {
  padding: var(--space-3, 12px) 0;
}

.faq-question {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  font-size: var(--font-base, 15px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-heading, #1a2e1a);
}

.faq-icon {
  color: var(--color-primary, #2d7a4f);
}

.faq-answer {
  font-size: var(--font-sm, 14px);
  color: var(--color-text-secondary, #4a5c4a);
  line-height: var(--line-height-relaxed, 1.6);
}

/* 工单标题行 */
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4, 16px);
}

.section-title-row .section-title {
  margin: 0;
}

/* 我的工单 */
.my-tickets {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-card, #fff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06));
  padding: var(--space-4, 16px) var(--space-5, 20px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ticket-item:hover {
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.1));
}

.ticket-main {
  flex: 1;
}

.ticket-header {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  margin-bottom: var(--space-1, 4px);
}

.ticket-no {
  font-size: var(--font-xs, 12px);
  color: var(--color-text-muted, #6b7c6b);
  font-family: monospace;
}

.ticket-title {
  font-size: var(--font-base, 15px);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-heading, #1a2e1a);
  margin: 0 0 var(--space-2, 8px) 0;
}

.ticket-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
  font-size: var(--font-sm, 14px);
  color: var(--color-text-muted, #6b7c6b);
}

.ticket-category {
  padding: 2px 8px;
  background: var(--color-bg-page, #f5f7f0);
  border-radius: var(--radius-sm, 4px);
}

.ticket-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ticket-reply-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: var(--space-2, 8px);
  font-size: var(--font-sm, 14px);
  color: var(--color-success, #52c41a);
  overflow: hidden;
}

.ticket-reply-preview span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  flex: 1;
  min-width: 0;
}

.ticket-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
  flex-shrink: 0;
}

.empty-state {
  padding: var(--space-4, 16px) 0;
  min-height: auto;
}

.empty-state :deep(.el-empty) {
  padding: var(--space-4, 16px) 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .quick-entries {
    grid-template-columns: repeat(2, 1fr);
  }
  .guide-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .quick-entries {
    grid-template-columns: 1fr;
  }
  .help-header {
    flex-direction: column;
    gap: var(--space-4, 16px);
  }
  .contact-card {
    flex-direction: column;
    gap: var(--space-4, 16px);
    text-align: center;
  }
  .ticket-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3, 12px);
  }
  .ticket-actions {
    flex-direction: row;
  }
}

/* 主按钮绿色覆盖 */
:deep(.el-button--primary) {
  --el-button-bg-color: var(--color-primary, #2d6a2e);
  --el-button-border-color: var(--color-primary, #2d6a2e);
  --el-button-hover-bg-color: var(--color-primary-hover, #3d8a3e);
  --el-button-hover-border-color: var(--color-primary-hover, #3d8a3e);
}

:deep(.el-radio-button__inner) {
  --el-color-primary: var(--color-primary, #2d6a2e);
}
</style>
