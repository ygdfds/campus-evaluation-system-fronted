<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  OfficeBuilding, Calendar, CircleCheck,
  Location, Connection, Document,
} from '@element-plus/icons-vue'
import { getSchoolProfileApi } from '@/api/school'

defineOptions({ name: 'SchoolInfoView' })

const userStore = useUserStore()
const loading = ref(true)
const schoolInfo = ref(null)

// 状态映射
const statusMap = {
  active: { label: '正常运营', type: 'success' },
  suspended: { label: '已暂停', type: 'warning' },
  expired: { label: '已过期', type: 'danger' },
}

function getStatusInfo(status) {
  return statusMap[status] || { label: status || '未知', type: 'info' }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadData() {
  loading.value = true
  try {
    const tenantId = userStore.tenantId
    if (!tenantId) return
    schoolInfo.value = await getSchoolProfileApi(tenantId)
  } catch (err) {
    console.error('获取学校信息失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div v-loading="loading" class="page-container">
    <div class="page-header">
      <span class="page-kicker">Evaluation console</span>
      <h2>学校信息</h2>
      <p class="page-desc">本校基本信息与租户配置概览</p>
    </div>

    <template v-if="schoolInfo">
      <!-- 顶部横幅区 -->
      <section class="banner-section">
        <div class="banner-cover">
          <div class="banner-placeholder">
            <el-icon :size="48" color="#fff"><OfficeBuilding /></el-icon>
          </div>
        </div>
        <div class="banner-info">
          <div class="school-logo">
            <div class="logo-placeholder">
              <el-icon :size="32" color="#fff"><OfficeBuilding /></el-icon>
            </div>
          </div>
          <div class="school-title-group">
            <h1 class="school-name">{{ schoolInfo.schoolName }}</h1>
            <el-tag :type="getStatusInfo(schoolInfo.status).type" effect="dark" size="small">
              {{ getStatusInfo(schoolInfo.status).label }}
            </el-tag>
          </div>
        </div>
      </section>

      <!-- 信息卡片区 -->
      <div class="info-grid">
        <!-- 基本信息 -->
        <div class="info-card">
          <div class="info-card-header">
            <el-icon class="info-card-icon" color="var(--color-primary)"><Document /></el-icon>
            <h3 class="info-card-title">基本信息</h3>
          </div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-label">学校名称</span>
              <span class="info-value">{{ schoolInfo.schoolName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <el-icon :size="14"><Location /></el-icon>
                学校地址
              </span>
              <span class="info-value">{{ schoolInfo.address || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <el-icon :size="14"><Connection /></el-icon>
                官方网站
              </span>
              <span class="info-value">
                <a v-if="schoolInfo.website" :href="schoolInfo.website" target="_blank" class="website-link">
                  {{ schoolInfo.website }}
                </a>
                <span v-else>-</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 学校简介 -->
        <div class="info-card">
          <div class="info-card-header">
            <el-icon class="info-card-icon" color="var(--color-success)"><Document /></el-icon>
            <h3 class="info-card-title">学校简介</h3>
          </div>
          <div class="info-card-body">
            <p class="intro-text">{{ schoolInfo.intro || '暂无简介' }}</p>
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="info-card">
          <div class="info-card-header">
            <el-icon class="info-card-icon" color="var(--color-warning)"><Calendar /></el-icon>
            <h3 class="info-card-title">系统信息</h3>
          </div>
          <div class="info-card-body">
            <div class="info-row">
              <span class="info-label">租户状态</span>
              <el-tag :type="getStatusInfo(schoolInfo.status).type" size="small">
                {{ getStatusInfo(schoolInfo.status).label }}
              </el-tag>
            </div>
            <div class="info-row">
              <span class="info-label">
                <el-icon :size="14"><CircleCheck /></el-icon>
                入驻时间
              </span>
              <span class="info-value">{{ formatDate(schoolInfo.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="未找到学校信息" :image-size="100" />
  </div>
</template>

<style scoped>
.page-container {
  padding: var(--space-6) var(--space-4);
  max-width: var(--page-max-width);
  margin-inline: auto;
}

.page-header {
  margin-bottom: var(--space-4);
}

.page-header h2 {
  font-size: 24px;
  font-weight: var(--font-weight-display);
  font-family: var(--font-family-display);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-1);
  letter-spacing: var(--letter-spacing-tight);
}

.page-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 顶部横幅 */
.banner-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-lighter);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: var(--space-4);
}

.banner-cover {
  height: var(--banner-cover-height);
  background: linear-gradient(135deg, var(--banner-gradient-start) 0%, var(--banner-gradient-end) 100%);
  position: relative;
}

.banner-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: var(--banner-placeholder-opacity);
}

.banner-info {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  padding: 0 var(--space-6);
  margin-top: var(--banner-logo-offset-y);
  position: relative;
  z-index: 1;
}

.school-logo {
  flex-shrink: 0;
}

.logo-placeholder {
  width: var(--banner-logo-size);
  height: var(--banner-logo-size);
  border-radius: var(--radius-card);
  background: linear-gradient(135deg, var(--banner-gradient-start) 0%, var(--banner-gradient-end) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--banner-logo-border-width) solid var(--color-bg-card);
  box-shadow: var(--shadow-card);
}

.school-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
}

.school-name {
  font-family: var(--font-family-display);
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

/* 信息卡片网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.info-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-lighter);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border-lighter);
}

.info-card-icon {
  font-size: var(--font-xl);
}

.info-card-title {
  font-family: var(--font-family-display);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin: 0;
}

.info-card-body {
  padding: var(--space-4);
}

.info-row {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-1);
  border-bottom: 1px solid var(--color-border-lighter);
  gap: var(--space-2);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-row:first-child {
  padding-top: 0;
}

.info-label {
  width: var(--info-label-width);
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.info-value {
  font-size: var(--font-sm);
  color: var(--color-text-heading);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.website-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.website-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.intro-text {
  font-size: var(--font-sm);
  color: var(--color-text-body);
  line-height: var(--line-height-loose);
  margin: 0;
  white-space: pre-wrap;
}

/* 响应式 */
@media (max-width: 1366px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: var(--space-4) var(--space-3);
  }

  .banner-cover {
    height: calc(var(--banner-cover-height) * 0.75);
  }

  .banner-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    padding: 0 var(--space-4);
  }

  .school-title-group {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    padding-bottom: var(--space-3);
  }

  .logo-placeholder {
    width: calc(var(--banner-logo-size) * 0.75);
    height: calc(var(--banner-logo-size) * 0.75);
  }

  .info-label {
    width: auto;
    min-width: var(--space-16);
  }
}
</style>
