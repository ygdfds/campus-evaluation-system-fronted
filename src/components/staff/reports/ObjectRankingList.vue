<script setup>
import { computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'ObjectRankingList' })

const props = defineProps({
  ranking: { type: Array, default: () => [] },
  sortBy: { type: String, default: 'low_first' },
})

const emit = defineEmits(['sort-change', 'view-detail'])

const sortOptions = [
  { value: 'low_first', label: '平均分从低到高' },
  { value: 'high_first', label: '平均分从高到低' },
  { value: 'most_submissions', label: '提交数最多' },
  { value: 'warnings', label: '低分预警优先' },
]

const typeMap = { teaching: '教学评价', service: '服务评价', instant: '即时评价', other: '其他' }

const displayList = computed(() => props.ranking.slice(0, 10))
</script>

<template>
  <div class="ranking-card">
    <div class="ranking-header">
      <h4 class="card-title">评价对象排行</h4>
      <el-select :model-value="sortBy" size="small" @change="v => emit('sort-change', v)">
        <el-option v-for="opt in sortOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </el-select>
    </div>
    <div v-if="displayList.length === 0" class="empty-hint">暂无排行数据</div>
    <div v-else class="ranking-list">
      <div
        v-for="(item, index) in displayList"
        :key="item.key"
        class="ranking-row"
        @click="emit('view-detail', { targetType: item.targetType, targetId: item.targetId })"
      >
        <span class="rank-num" :class="{ 'rank-top': index < 3 }">{{ index + 1 }}</span>
        <div class="rank-info">
          <span class="rank-name">{{ item.name }}</span>
          <span class="rank-org">{{ item.orgName }}</span>
        </div>
        <el-tag size="small" effect="plain">{{ typeMap[item.evalType] || item.evalType }}</el-tag>
        <div class="rank-scores">
          <span class="rank-avg" :class="{ 'is-low': item.avgScore < 3 }">{{ item.avgScore }}</span>
          <span class="rank-count">{{ item.submissionCount }} 份</span>
        </div>
        <span v-if="item.lowCount > 0" class="rank-warning">⚠ {{ item.lowCount }} 低分</span>
        <el-icon class="rank-arrow" :size="14"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: nowrap;
}

.card-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.empty-hint {
  text-align: center;
  padding: var(--space-6) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.ranking-list { display: flex; flex-direction: column; }

.ranking-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: var(--border-lighter);
  cursor: pointer;
  transition: background 0.15s;
  border-radius: var(--radius-md);
}

.ranking-row:last-child { border-bottom: none; }
.ranking-row:hover { background: var(--color-bg-primary-hover); }

.rank-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.rank-num.rank-top {
  background: var(--color-accent-user-700);
  color: var(--color-text-white);
}

.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.rank-name {
  font-size: var(--font-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-org {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.rank-scores {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  min-width: 50px;
  text-align: right;
}

.rank-avg {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.rank-avg.is-low { color: var(--color-danger); }

.rank-count {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.rank-warning {
  font-size: var(--font-xs);
  color: var(--color-danger);
  flex-shrink: 0;
  white-space: nowrap;
}

.rank-arrow {
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}
</style>
