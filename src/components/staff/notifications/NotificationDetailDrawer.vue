<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NOTIFICATION_TYPE_MAP,
  NOTIFICATION_BIZ_TYPE_MAP,
  NOTIFICATION_PRIORITY_MAP,
} from '@/api/staffNotifications'

const router = useRouter()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  detail: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'mark-read', 'closed'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function handleClose() {
  visible.value = false
  emit('closed')
}

function handleMarkRead() {
  if (props.detail) {
    emit('mark-read', props.detail)
  }
}

function handleGoLink() {
  if (props.detail?.link) {
    visible.value = false
    router.push(props.detail.link)
  }
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const typeTagMap = {
  todo: 'warning',
  business: '',
  system: 'info',
  audit: 'danger',
  security: 'danger',
}

const priorityTagMap = {
  normal: 'info',
  important: 'warning',
  urgent: 'danger',
}
</script>

<template>
  <el-drawer
    v-model="visible"
    title="通知详情"
    direction="rtl"
    size="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="!detail" class="detail-empty">
      <el-empty description="未找到通知详情" />
    </div>

    <div v-else class="detail-content">
      <!-- 标题 -->
      <div class="detail-title-block">
        <h3 class="detail-title">{{ detail.title || '未知通知' }}</h3>
        <el-tag
          v-if="detail.read_status"
          :type="detail.read_status === 'unread' ? 'danger' : 'info'"
          size="small"
          effect="plain"
        >
          {{ detail.read_status === 'unread' ? '未读' : '已读' }}
        </el-tag>
      </div>

      <!-- 基础信息 -->
      <section class="detail-section">
        <h4 class="section-title">基础信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">通知类型</span>
            <el-tag size="small" :type="typeTagMap[detail.type] || 'info'" effect="plain">
              {{ NOTIFICATION_TYPE_MAP[detail.type] || detail.type || '-' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">业务来源</span>
            <el-tag v-if="detail.business_type" size="small" effect="plain" type="info">
              {{ NOTIFICATION_BIZ_TYPE_MAP[detail.business_type] || detail.business_type }}
            </el-tag>
            <span v-else class="info-value">-</span>
          </div>
          <div class="info-item">
            <span class="info-label">优先级</span>
            <el-tag
              size="small"
              :type="priorityTagMap[detail.priority] || 'info'"
              effect="light"
            >
              {{ NOTIFICATION_PRIORITY_MAP[detail.priority] || detail.priority || '-' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatTime(detail.created_at) }}</span>
          </div>
          <div v-if="detail.read_at" class="info-item">
            <span class="info-label">阅读时间</span>
            <span class="info-value">{{ formatTime(detail.read_at) }}</span>
          </div>
        </div>
      </section>

      <!-- 通知内容 -->
      <section class="detail-section">
        <h4 class="section-title">通知内容</h4>
        <div class="content-block">
          {{ detail.content || '暂无内容' }}
        </div>
      </section>

      <!-- 关联业务 -->
      <section v-if="detail.business_id || detail.link" class="detail-section">
        <h4 class="section-title">关联业务</h4>
        <div class="info-grid">
          <div v-if="detail.business_id" class="info-item">
            <span class="info-label">业务 ID</span>
            <span class="info-value">#{{ detail.business_id }}</span>
          </div>
          <div v-if="detail.link" class="info-item">
            <span class="info-label">跳转链接</span>
            <span class="info-value link-value">{{ detail.link }}</span>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button v-if="detail?.read_status === 'unread'" type="success" plain @click="handleMarkRead">
          标记已读
        </el-button>
        <el-button v-if="detail?.link" type="primary" @click="handleGoLink">
          前往处理
        </el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.detail-empty {
  padding: 32px 16px;
}

.detail-content {
  padding: 0 4px;
}

.detail-title-block {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-title, #1a1a1a);
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-title, #1a1a1a);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

.info-value {
  font-size: 14px;
  color: var(--color-text-body, #333);
}

.link-value {
  color: var(--color-primary, #2d7a4e);
  word-break: break-all;
}

.content-block {
  font-size: 14px;
  color: var(--color-text-body, #333);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px 16px;
  background: var(--color-bg-page, #f5f7fa);
  border-radius: 8px;
}

.drawer-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
