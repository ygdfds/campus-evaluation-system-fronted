<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clock, OfficeBuilding } from '@element-plus/icons-vue'
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

function canView(item, tenantId, roleType) {
  if (!item || item.deleted || item.status !== 'published') return false
  if (item.tenant_id !== tenantId) return false
  if (!item.target_roles) return true
  return item.target_roles.split(',').map(r => r.trim()).includes(roleType)
}

function handleRelatedClick(item) {
  router.push({ name: 'StudentAnnouncementDetail', params: { id: item.id } })
}

async function loadDetail() {
  loading.value = true
  detail.value = null
  relatedList.value = []

  const id = Number(route.params.id)
  const tenantId = userStore.tenantId
  const roleType = userStore.userRole || 'student'
  if (!id || !tenantId) {
    loading.value = false
    return
  }

  try {
    const [announcement, files] = await Promise.all([
      getAnnouncementDetailApi(id),
      getFileResourcesApi(tenantId),
    ])

    if (!canView(announcement, tenantId, roleType)) {
      loading.value = false
      return
    }

    const fileMap = Object.fromEntries(files.map(f => [f.id, f]))
    detail.value = {
      ...announcement,
      cover: announcement.cover_file_id && fileMap[announcement.cover_file_id]
        ? fileMap[announcement.cover_file_id].url
        : '',
      formattedDate: formatDate(announcement.publish_time),
      publisherName: userStore.schoolName || '学校公告',
    }

    const related = await getRelatedAnnouncementsApi(tenantId, announcement.tag, id, 3)
    relatedList.value = related
      .filter(item => canView(item, tenantId, roleType))
      .map(n => ({
        id: n.id,
        title: n.title,
        content: n.summary || n.content,
        tag: n.tag,
        publish_time: formatDate(n.publish_time),
        cover: n.cover_file_id && fileMap[n.cover_file_id] ? fileMap[n.cover_file_id].url : '',
      }))
  } catch (err) {
    console.error('加载公告详情失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
watch(() => route.params.id, loadDetail)
</script>

<template>
  <div class="announcement-detail-page">
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="detail">
      <div class="back-bar">
        <el-button text @click="router.push({ name: 'StudentAnnouncementList' })">
          <el-icon><ArrowLeft /></el-icon>
          返回公告列表
        </el-button>
      </div>

      <article class="detail-card">
        <div v-if="detail.cover" class="detail-cover">
          <img :src="detail.cover" :alt="detail.title" />
        </div>

        <div class="detail-body">
          <div class="detail-meta">
            <el-tag size="small" effect="plain">{{ detail.tag }}</el-tag>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ detail.formattedDate }}
            </span>
            <span class="meta-item">
              <el-icon><OfficeBuilding /></el-icon>
              {{ detail.publisherName }}
            </span>
          </div>

          <h1 class="detail-title">{{ detail.title }}</h1>
          <p v-if="detail.summary" class="detail-summary">{{ detail.summary }}</p>
          <div class="detail-content">{{ detail.content }}</div>
        </div>
      </article>

      <section v-if="relatedList.length" class="related-section">
        <div class="section-heading">
          <h2>相关公告</h2>
          <span>同分类的其他学校公告</span>
        </div>
        <div class="related-list">
          <AnnouncementCard
            v-for="item in relatedList"
            :key="item.id"
            :item="item"
            @click="handleRelatedClick"
          />
        </div>
      </section>
    </template>

    <div v-else class="error-state">
      <el-empty description="公告不存在或暂无权限查看">
        <el-button type="primary" @click="router.push({ name: 'StudentAnnouncementList' })">
          返回公告列表
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.announcement-detail-page {
  width: min(100%, 980px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.loading-skeleton,
.detail-card,
.related-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.loading-skeleton {
  padding: var(--space-6);
}

.back-bar {
  display: flex;
  align-items: center;
}

.detail-card {
  overflow: hidden;
}

.detail-cover {
  height: 280px;
  background: var(--color-bg-subtle);
}

.detail-cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.detail-body {
  padding: var(--space-8);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.detail-title {
  margin: 0;
  color: var(--color-text-heading);
  font-size: 30px;
  line-height: 1.28;
  font-weight: var(--font-weight-bold);
}

.detail-summary {
  margin: var(--space-4) 0 0;
  padding: var(--space-4);
  color: var(--color-text-body);
  line-height: var(--line-height-relaxed);
  background: var(--color-bg-subtle);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.detail-content {
  margin-top: var(--space-6);
  color: var(--color-text-regular);
  font-size: var(--font-base);
  line-height: 1.9;
  white-space: pre-wrap;
}

.related-section {
  padding: var(--space-5);
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.section-heading h2 {
  margin: 0;
  color: var(--color-text-heading);
  font-size: var(--font-lg);
}

.section-heading span {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.error-state {
  padding: var(--space-10) 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
}

@media (max-width: 768px) {
  .detail-cover {
    height: 180px;
  }

  .detail-body {
    padding: var(--space-5);
  }

  .detail-title {
    font-size: 24px;
  }
}
</style>
