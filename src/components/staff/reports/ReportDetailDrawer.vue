<script setup>
defineOptions({ name: 'ReportDetailDrawer' })

defineProps({
  visible: { type: Boolean, default: false },
  detail: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible'])

const typeMap = { teaching: '教学评价', service: '服务评价', instant: '即时评价', other: '其他' }

function getDrawerTitle(detail) {
  if (!detail.name) return '对象统计详情'
  return detail.name + ' - 统计详情'
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="getDrawerTitle(detail)"
    size="480px"
    direction="rtl"
    :close-on-click-modal="true"
    @close="handleClose"
    @update:model-value="v => emit('update:visible', v)"
  >
    <div v-loading="loading" class="detail-content">
      <template v-if="detail.name">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4 class="detail-name">{{ detail.name }}</h4>
          <div class="detail-meta">
            <el-tag size="small" effect="plain">{{ typeMap[detail.evalType] || detail.evalType }}</el-tag>
            <span v-if="detail.orgName" class="detail-org">{{ detail.orgName }}</span>
          </div>
        </div>

        <!-- 核心指标 -->
        <div class="detail-section">
          <div class="detail-stats">
            <div class="stat-item">
              <span class="stat-value" :class="{ 'is-low': detail.avgScore < 3 }">{{ detail.avgScore }}</span>
              <span class="stat-label">平均分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ detail.submissionCount }}</span>
              <span class="stat-label">提交数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" :class="{ 'is-warn': detail.lowCount > 0 }">{{ detail.lowCount }}</span>
              <span class="stat-label">低分预警</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ detail.complaintCount }}</span>
              <span class="stat-label">相关反馈</span>
            </div>
          </div>
        </div>

        <!-- 分数分布 -->
        <div class="detail-section">
          <h5 class="section-label">分数分布</h5>
          <div class="dist-list">
            <div v-for="item in detail.distribution" :key="item.score" class="dist-row">
              <span class="dist-label">{{ item.score }}分</span>
              <div class="dist-bar-wrap">
                <div
                  class="dist-bar"
                  :class="item.score >= 4 ? 'bar-success' : item.score >= 3 ? 'bar-warning' : 'bar-danger'"
                  :style="{ width: item.percent + '%' }"
                />
              </div>
              <span class="dist-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- 高频关键词 -->
        <div class="detail-section">
          <h5 class="section-label">高频关键词</h5>
          <div v-if="detail.keywords?.length" class="keyword-list">
            <el-tag v-for="kw in detail.keywords" :key="kw.word" size="small" effect="plain" class="keyword-tag">
              {{ kw.word }} ({{ kw.count }})
            </el-tag>
          </div>
          <span v-else class="no-data">暂无关键词</span>
        </div>

        <!-- 最近评价摘要 -->
        <div class="detail-section">
          <h5 class="section-label">最近评价摘要</h5>
          <div v-if="detail.recentSubmissions?.length" class="recent-list">
            <div v-for="sub in detail.recentSubmissions" :key="sub.id" class="recent-row">
              <div class="recent-main">
                <span class="recent-score" :class="{ 'is-low': sub.score < 3 }">{{ sub.score }}</span>
                <span class="recent-text">{{ sub.text }}</span>
              </div>
              <span class="recent-time">
                {{ new Date(sub.time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) }}
              </span>
            </div>
          </div>
          <span v-else class="no-data">暂无评价</span>
        </div>

        <!-- 匿名提示 -->
        <div class="detail-notice">
          <el-alert type="info" :closable="false" show-icon>
            以上数据均已脱敏处理，不展示评价者真实身份信息
          </el-alert>
        </div>
      </template>
      <div v-else-if="!loading" class="empty-state">
        <span>暂无详情数据</span>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-content {
  padding: 0 var(--space-2);
}

.detail-section {
  margin-bottom: var(--space-5);
}

.detail-name {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-2);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.detail-org {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

/* 核心指标 */
.detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-3);
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
}

.stat-value.is-low { color: var(--color-danger); }
.stat-value.is-warn { color: var(--color-warning); }

.stat-label {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

/* 分数分布 */
.section-label {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-3);
}

.dist-list { display: flex; flex-direction: column; gap: var(--space-2); }

.dist-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dist-label {
  width: 30px;
  font-size: var(--font-sm);
  color: var(--color-text-body);
  text-align: right;
}

.dist-bar-wrap {
  flex: 1;
  height: 16px;
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
  width: 24px;
  font-size: var(--font-sm);
  color: var(--color-text-heading);
  text-align: right;
}

/* 关键词 */
.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.keyword-tag {
  cursor: default;
}

.no-data {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

/* 最近评价 */
.recent-list { display: flex; flex-direction: column; gap: var(--space-2); }

.recent-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-page-alt);
  border-radius: var(--radius-md);
}

.recent-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.recent-score {
  font-size: var(--font-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.recent-score.is-low { color: var(--color-danger); }

.recent-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed);
  word-break: break-all;
}

.recent-time {
  font-size: var(--font-xs);
  color: var(--color-text-muted-light);
  flex-shrink: 0;
}

/* 匿名提示 */
.detail-notice {
  margin-top: var(--space-5);
}

.empty-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-text-muted);
}
</style>
