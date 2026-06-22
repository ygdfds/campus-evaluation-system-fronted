<script setup>
import { computed } from 'vue'

defineOptions({ name: 'ScoreDistributionCard' })

const props = defineProps({
  distribution: { type: Array, default: () => [] },
  indicatorScores: { type: Array, default: () => [] },
})

// 评分分布为空：数组为空或所有分桶 count 均为 0
const isDistEmpty = computed(() => {
  return !props.distribution?.length || props.distribution.every(item => Number(item.count || 0) === 0)
})

function getBarColor(score) {
  if (score >= 4) return 'bar-success'
  if (score >= 3) return 'bar-warning'
  return 'bar-danger'
}
</script>

<template>
  <div class="score-analysis">
    <!-- 左侧：评分分布 -->
    <div class="analysis-card">
      <h4 class="card-title">评分分布</h4>
      <div v-if="isDistEmpty" class="empty-hint">暂无评分数据</div>
      <div v-else class="dist-list">
        <div v-for="item in distribution" :key="item.score" class="dist-row">
          <span class="dist-label">{{ item.score }} 分</span>
          <div class="dist-bar-wrap">
            <div class="dist-bar" :class="getBarColor(item.score)" :style="{ width: item.percent + '%' }" />
          </div>
          <span class="dist-count">{{ item.count }}</span>
          <span class="dist-percent">{{ item.percent }}%</span>
        </div>
      </div>
    </div>

    <!-- 右侧：指标得分概览 -->
    <div class="analysis-card">
      <h4 class="card-title">指标得分概览</h4>
      <div v-if="indicatorScores.length === 0" class="empty-compact">
        <span class="empty-title">暂无评分指标数据</span>
        <span class="empty-sub">当前筛选范围内暂无可统计的评分题</span>
      </div>
      <div v-else class="indicator-list">
        <div v-for="item in indicatorScores" :key="item.questionId" class="indicator-row">
          <div class="indicator-info">
            <span class="indicator-name" :title="item.title">{{ item.title }}</span>
            <span class="indicator-score" :class="{ 'is-low': item.isLow }">{{ item.avgScore }}</span>
            <span class="indicator-count">{{ item.count }} 份</span>
          </div>
          <div class="indicator-bar-wrap">
            <div
              class="indicator-bar"
              :class="item.isLow ? 'bar-danger' : item.avgScore >= 4 ? 'bar-success' : 'bar-warning'"
              :style="{ width: (item.avgScore / 5 * 100) + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-analysis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.analysis-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-4);
}

.empty-hint {
  text-align: center;
  padding: var(--space-4) 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.empty-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--space-5) 0;
  flex: 1;
}

.empty-title {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.empty-sub {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

/* 评分分布 */
.dist-list { display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }

.dist-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dist-label {
  width: 40px;
  font-size: var(--font-sm);
  color: var(--color-text-body);
  flex-shrink: 0;
  text-align: right;
}

.dist-bar-wrap {
  flex: 1;
  height: 20px;
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.dist-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.3s;
  min-width: 2px;
}

.bar-success { background: var(--color-success); }
.bar-warning { background: var(--color-warning); }
.bar-danger { background: var(--color-danger); }

.dist-count {
  width: 30px;
  font-size: var(--font-sm);
  color: var(--color-text-heading);
  font-weight: var(--font-weight-medium);
  text-align: right;
}

.dist-percent {
  width: 40px;
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  text-align: right;
}

/* 指标得分 */
.indicator-list { display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }

.indicator-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.indicator-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.indicator-name {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.indicator-score {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  flex-shrink: 0;
}

.indicator-score.is-low { color: var(--color-danger); }

.indicator-count {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.indicator-bar-wrap {
  height: 8px;
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.indicator-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.3s;
  min-width: 2px;
}

@media (max-width: 900px) {
  .score-analysis { grid-template-columns: 1fr; }
}
</style>
