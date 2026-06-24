<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAnnouncementDetailApi, getRelatedAnnouncementsApi } from '@/api/announcement'
import { getFileResourcesApi } from '@/api/evaluation'
import AnnouncementCard from '@/components/student/AnnouncementCard.vue'

defineOptions({ name: 'StudentAnnouncementDetailView' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const detail = ref(null)
const relatedList = ref([])

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

function handleRelatedClick(item) {
  router.push({ name: 'StudentAnnouncementDetail', params: { id: item.id } })
}

async function loadDetail() {
  loading.value = true
  const id = Number(route.params.id)
  const tenantId = userStore.tenantId
  const roleType = userStore.userRole || 'student'
  if (!id || !tenantId) { loading.value = false; return }

  try {
    const [notification, files] = await Promise.all([
      getAnnouncementDetailApi(id),
      getFileResourcesApi(tenantId),
    ])

    if (!notification || notification.deleted) {
      detail.value = null
      loading.value = false
      return
    }

    // 权限校验：tenant_id 和 target_roles
    if (notification.tenant_id !== tenantId) {
      detail.value = null
      loading.value = false
      return
    }
    if (notification.target_roles) {
      const roles = notification.target_roles.split(',').map(r => r.trim())
      if (!roles.includes(roleType)) {
        detail.value = null
        loading.value = false
        return
      }
    }

    const fileMap = {}
    files.forEach(f => { fileMap[f.id] = f })

    detail.value = {
      ...notification,
      cover: notification.cover_file_id && fileMap[notification.cover_file_id]
        ? fileMap[notification.cover_file_id].url : '',
      formattedDate: formatDate(notification.publish_time),
    }

    // 加载相关公告
    if (notification.notice_type) {
      const related = await getRelatedAnnouncementsApi(tenantId, notification.notice_type, id, 3)
      relatedList.value = related.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tag: n.tag,
        publish_time: formatDate(n.publish_time),
        cover: n.cover_file_id && fileMap[n.cover_file_id] ? fileMap[n.cover_file_id].url : '',
      }))
    }
  } catch (err) {
    console.error('加载公告详情失败:', err)
    detail.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadDetail() })
</script>

<template>
  <div class="page-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="detail">
      <!-- 返回入口 -->
      <div class="back-bar">
        <el-button text @click="router.push({ name: 'StudentAnnouncementList' })">
          <el-icon><ArrowLeft /></el-icon> 返回公告列表
        </el-button>
      </div>

      <!-- 详情卡片 -->
      <div class="detail-card">
        <div v-if="detail.cover" class="detail-cover">
          <img :src="detail.cover" :alt="detail.title" />
        </div>
        <div class="detail-body">
          <div class="detail-meta">
            <el-tag size="small" effect="plain">{{ detail.tag }}</el-tag>
            <span class="detail-time">
              <el-icon :size="12"><Clock /></el-icon>
              {{ detail.formattedDate }}
            </span>
          </div>
          <h1 class="detail-title">{{ detail.title }}</h1>
          <div class="detail-content">{{ detail.content }}</div>
        </div>
      </div>

      <!-- 相关公告 -->
      <div v-if="relatedList.length" class="related-section">
        <h3 class="related-title">相关公告</h3>
        <div class="related-list">
          <AnnouncementCard
            v-for="item in relatedList"
            :key="item.id"
            :item="item"
            @click="handleRelatedClick"
          />
        </div>
      </div>
    </template>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <el-empty description="公告不存在或无权查看">
        <el-button type="primary" @click="router.push({ name: 'StudentAnnouncementList' })">返回公告列表</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.loading-skeleton {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.back-bar {
  display: flex;
  align-items: center;
}

.detail-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.detail-cover img {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
}

.detail-body {
  padding: var(--space-6) var(--space-8);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.detail-time {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
}

.detail-title {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0 0 var(--space-5);
  line-height: var(--line-height-tight);
}

.detail-content {
  font-size: var(--font-base);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed);
  white-space: pre-wrap;
}

.related-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.related-title {
  font-size: var(--font-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-heading);
  margin: 0;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.error-state {
  padding: var(--space-10) 0;
}
</style>
