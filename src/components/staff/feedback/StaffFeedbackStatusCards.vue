<script setup>
import { Clock, Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'

defineOptions({ name: 'StaffFeedbackStatusCards' })

defineProps({
  stats: { type: Object, default: () => ({ pending: 0, processing: 0, resolved: 0, rejected: 0 }) },
  activeStatus: { type: String, default: 'all' },
})

defineEmits(['status-change'])

const statusItems = [
  { key: 'pending', label: '待处理', icon: Clock, color: 'warning', desc: '等待受理的反馈' },
  { key: 'processing', label: '处理中', icon: Loading, color: 'primary', desc: '正在跟进处理' },
  { key: 'resolved', label: '已办结', icon: CircleCheck, color: 'success', desc: '已完成处理' },
  { key: 'rejected', label: '已驳回', icon: CircleClose, color: 'danger', desc: '不符合条件已驳回' },
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
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.status-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
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
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-warning .status-icon { background: var(--color-warning-light); color: var(--color-warning); }
.status-primary .status-icon { background: var(--color-primary-50); color: var(--color-accent-user-700); }
.status-success .status-icon { background: var(--color-success-light); color: var(--color-success); }
.status-danger .status-icon { background: var(--color-danger-light); color: var(--color-danger); }

.status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-value {
  font-size: 24px;
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
