<script setup>
import { Edit, Clock, CircleCheck, CircleClose, Lock } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffFormStatusCards' })

defineProps({
  stats: { type: Object, default: () => ({ draft: 0, pending_review: 0, published: 0, rejected: 0, closed: 0 }) },
  activeStatus: { type: String, default: 'all' },
})

defineEmits(['status-change'])

const statusItems = [
  { key: 'draft', label: '草稿', icon: Edit, color: 'info', desc: '尚未提交审核' },
  { key: 'pending_review', label: '待审核', icon: Clock, color: 'warning', desc: '等待管理员审核' },
  { key: 'published', label: '已发布', icon: CircleCheck, color: 'success', desc: '正在开放评价' },
  { key: 'rejected', label: '已驳回', icon: CircleClose, color: 'danger', desc: '审核未通过需修改' },
  { key: 'closed', label: '已关闭', icon: Lock, color: '', desc: '评价窗口已关闭' },
]
</script>

<template>
  <div class="status-cards">
    <div
      v-for="item in statusItems"
      :key="item.key"
      class="status-card"
      :class="[`status-${item.color}`, { active: activeStatus === item.key }]"
      @click="$emit('status-change', activeStatus === item.key ? 'all' : item.key)"
    >
      <div class="status-icon">
        <el-icon :size="22"><component :is="item.icon" /></el-icon>
      </div>
      <div class="status-info">
        <span class="status-value">{{ stats[item.key] || 0 }}</span>
        <span class="status-label">{{ item.label }}</span>
        <span class="status-desc">{{ item.desc }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
}

.status-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.status-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.status-card.active {
  border-color: var(--color-accent-user-700);
  background: var(--color-primary-50);
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-warning .status-icon { background: var(--color-warning-light); color: var(--color-warning); }
.status-success .status-icon { background: var(--color-success-light); color: var(--color-success); }
.status-danger .status-icon { background: var(--color-danger-light); color: var(--color-danger); }
.status-info .status-icon { background: var(--color-info-light); color: var(--color-info); }
.status-card:not([class*="status-warning"]):not([class*="status-success"]):not([class*="status-danger"]):not([class*="status-info"]) .status-icon {
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-value {
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.status-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.status-desc {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}
</style>
