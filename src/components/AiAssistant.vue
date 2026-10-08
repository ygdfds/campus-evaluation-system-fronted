<script setup>
import { computed, nextTick, ref } from 'vue'
import {
  ChatDotRound,
  Close,
  Loading,
  Promotion,
  Refresh,
  WarningFilled,
} from '@element-plus/icons-vue'
import { askAiApi, getAiStatusApi } from '@/api/ai'

defineOptions({ name: 'AiAssistant' })

const visible = ref(false)
const question = ref('')
const loading = ref(false)
const statusLoading = ref(false)
const status = ref(null)
const messages = ref([
  {
    role: 'assistant',
    content: '你好，我可以根据当前学校的公告、帮助文档和操作指引回答问题。',
    sources: [],
  },
])

const statusText = computed(() => {
  if (statusLoading.value) return '正在检查本地模型'
  if (!status.value) return '本地 Ollama'
  return status.value.available ? 'Ollama 已连接' : 'Ollama 未连接'
})

const statusType = computed(() => {
  if (!status.value) return 'info'
  return status.value.available ? 'success' : 'warning'
})

async function openAssistant() {
  visible.value = true
  if (!status.value && !statusLoading.value) {
    statusLoading.value = true
    try {
      status.value = await getAiStatusApi()
    } catch (error) {
      status.value = { available: false, message: '无法读取 Ollama 状态' }
    } finally {
      statusLoading.value = false
    }
  }
}

async function refreshStatus() {
  statusLoading.value = true
  try {
    status.value = await getAiStatusApi()
  } catch (error) {
    status.value = { available: false, message: '无法读取 Ollama 状态' }
  } finally {
    statusLoading.value = false
  }
}

async function sendQuestion() {
  const text = question.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text, sources: [] })
  question.value = ''
  loading.value = true
  await nextTick()

  try {
    const history = messages.value
      .slice(-7, -1)
      .map(item => `${item.role === 'user' ? '用户' : '助手'}：${item.content}`)
    const result = await askAiApi({ question: text, conversation: history })
    messages.value.push({
      role: 'assistant',
      content: result?.answer || '当前没有返回有效回答。',
      sources: result?.sources || [],
    })
    status.value = {
      ...(status.value || {}),
      available: true,
      message: 'Ollama 已连接',
    }
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: error.response?.data?.message || error.message || 'AI 服务暂时不可用，请稍后再试。',
      sources: [],
      error: true,
    })
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  const container = document.querySelector('.ai-assistant-messages')
  if (container) container.scrollTop = container.scrollHeight
}

function clearConversation() {
  messages.value = [
    {
      role: 'assistant',
      content: '你好，我可以根据当前学校的公告、帮助文档和操作指引回答问题。',
      sources: [],
    },
  ]
}
</script>

<template>
  <button class="ai-launcher" type="button" title="打开 AI 智能问答" @click="openAssistant">
    <el-icon :size="20"><ChatDotRound /></el-icon>
    <span>AI 问答</span>
  </button>

  <el-drawer
    v-model="visible"
    title="AI 智能问答"
    size="min(440px, 100vw)"
    :with-header="false"
    :append-to-body="true"
  >
    <div class="ai-panel">
      <header class="ai-header">
        <div>
          <h2>AI 智能问答</h2>
          <div class="ai-status">
            <span class="status-dot" :class="`status-dot--${statusType}`" />
            <span>{{ statusText }}</span>
          </div>
        </div>
        <div class="ai-header-actions">
          <el-button text title="刷新模型状态" :loading="statusLoading" @click="refreshStatus">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button text title="关闭" @click="visible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </header>

      <div v-if="status && !status.available" class="ai-warning">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ status.message || '请先启动本机 Ollama 服务。' }}</span>
      </div>

      <div class="ai-assistant-messages">
        <div
          v-for="(message, index) in messages"
          :key="`${message.role}-${index}`"
          class="ai-message"
          :class="`ai-message--${message.role}`"
        >
          <div class="ai-message-bubble" :class="{ 'is-error': message.error }">
            {{ message.content }}
          </div>
          <div v-if="message.sources?.length" class="ai-sources">
            <span class="sources-label">参考内容</span>
            <a
              v-for="source in message.sources"
              :key="`${source.type}-${source.title}`"
              :href="source.link || undefined"
              :target="source.link?.startsWith('http') ? '_blank' : undefined"
              class="ai-source"
            >
              {{ source.title }}
            </a>
          </div>
        </div>
        <div v-if="loading" class="ai-message ai-message--assistant">
          <div class="ai-message-bubble ai-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在检索知识库并生成回答
          </div>
        </div>
      </div>

      <footer class="ai-footer">
        <el-input
          v-model="question"
          type="textarea"
          :rows="3"
          resize="none"
          maxlength="1000"
          show-word-limit
          placeholder="请输入关于系统使用、公告或评价流程的问题"
          @keydown.enter.exact.prevent="sendQuestion"
        />
        <div class="ai-footer-actions">
          <el-button text @click="clearConversation">清空对话</el-button>
          <el-button type="primary" :loading="loading" :icon="Promotion" @click="sendQuestion">
            发送
          </el-button>
        </div>
      </footer>
    </div>
  </el-drawer>
</template>

<style scoped>
.ai-launcher {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--color-primary-200, #c7d2fe);
  border-radius: 21px;
  background: var(--color-primary-600, #4f46e5);
  color: #fff;
  box-shadow: 0 8px 24px rgba(37, 52, 110, 0.2);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.ai-launcher:hover {
  background: var(--color-primary-700, #4338ca);
}

.ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ai-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.ai-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
  color: #6b7280;
  font-size: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9ca3af;
}

.status-dot--success {
  background: #16a34a;
}

.status-dot--warning {
  background: #d97706;
}

.ai-header-actions {
  display: flex;
  gap: 2px;
}

.ai-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px solid #f3d19c;
  background: #fff8eb;
  color: #8a5a00;
  font-size: 12px;
  line-height: 1.5;
}

.ai-assistant-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 0;
}

.ai-message {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.ai-message--user {
  align-items: flex-end;
}

.ai-message-bubble {
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.ai-message--user .ai-message-bubble {
  background: #eef2ff;
  color: #3730a3;
}

.ai-message-bubble.is-error {
  background: #fef2f2;
  color: #b91c1c;
}

.ai-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ai-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 88%;
  margin-top: 6px;
  font-size: 11px;
}

.sources-label {
  color: #9ca3af;
}

.ai-source {
  color: #4f46e5;
  text-decoration: none;
}

.ai-source:hover {
  text-decoration: underline;
}

.ai-footer {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.ai-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

@media (max-width: 600px) {
  .ai-launcher {
    right: 14px;
    bottom: 14px;
  }
}
</style>
