<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAnnouncementsApi } from '@/api/announcement'
import { getFileResourcesApi } from '@/api/evaluation'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import AnnouncementCard from '@/components/student/AnnouncementCard.vue'

defineOptions({ name: 'StudentAnnouncementListView' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const announcements = ref([])
const filterTag = ref('all')
const sortOrder = ref('desc')
const searchText = ref('')
const currentPage = ref(1)
const pageSize = 6

const tagOptions = [
  { label: '全部', value: 'all' },
  { label: '评价安排', value: '评价安排' },
  { label: '教学评价', value: '教学评价' },
  { label: '服务评价', value: '服务评价' },
  { label: '评价规则', value: '评价规则' },
  { label: '系统公告', value: '系统公告' },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

const filteredList = computed(() => {
  let list = [...announcements.value]
  if (filterTag.value !== 'all') {
    list = list.filter(a => a.tag === filterTag.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(a =>
      a.title.toLowerCase().includes(kw) ||
      a.content.toLowerCase().includes(kw) ||
      (a.summary || '').toLowerCase().includes(kw),
    )
  }
  list.sort((a, b) => sortOrder.value === 'asc'
    ? a.publish_time.localeCompare(b.publish_time)
    : b.publish_time.localeCompare(a.publish_time))
  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

function handleCardClick(item) {
  router.push({ name: 'StudentAnnouncementDetail', params: { id: item.id } })
}

async function loadData() {
  loading.value = true
  const tenantId = userStore.tenantId
  const roleType = userStore.userRole || 'student'
  if (!tenantId) {
    loading.value = false
    return
  }

  try {
    const [list, files] = await Promise.all([
      getAnnouncementsApi(tenantId, roleType),
      getFileResourcesApi(tenantId),
    ])
    const fileMap = Object.fromEntries(files.map(f => [f.id, f]))

    announcements.value = list.map(n => ({
      id: n.id,
      title: n.title,
      content: n.summary || n.content,
      tag: n.tag,
      publish_time: formatDate(n.publish_time),
      cover: n.cover_file_id && fileMap[n.cover_file_id] ? fileMap[n.cover_file_id].url : '',
    }))
  } catch (err) {
    console.error('加载公告列表失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <PageHeader title="校园公告" description="查看评价工作公告、规则说明和系统通知" />

    <div class="filter-bar">
      <div class="filter-left">
        <el-radio-group v-model="filterTag" size="small">
          <el-radio-button v-for="opt in tagOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
        <el-select v-model="sortOrder" size="small" class="sort-select">
          <el-option label="最新发布" value="desc" />
          <el-option label="最早发布" value="asc" />
        </el-select>
      </div>
      <el-input
        v-model="searchText"
        placeholder="搜索公告标题或内容"
        :prefix-icon="Search"
        clearable
        class="search-input"
      />
    </div>

    <div class="announcement-list-shell">
      <div v-if="loading" class="loading-skeleton">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="filteredList.length" class="announce-list">
        <AnnouncementCard
          v-for="item in pagedList"
          :key="item.id"
          :item="item"
          @click="handleCardClick"
        />
      </div>

      <el-card v-else shadow="never" class="empty-card">
        <EmptyPlaceholder text="暂无公告" description="当前没有符合条件的正式校园公告" />
      </el-card>

      <div v-if="filteredList.length" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredList.length"
          layout="prev, pager, next"
          small
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.sort-select {
  width: 128px;
}

.search-input {
  width: 260px;
}

.loading-skeleton,
.empty-card {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.announce-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: var(--space-3);
}

@media (max-width: 768px) {
  .filter-bar,
  .filter-left {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input,
  .sort-select {
    width: 100%;
  }
}


.announcement-list-shell {
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.announcement-list-shell .loading-skeleton,
.announcement-list-shell .empty-card {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.announcement-list-shell .pagination-wrap {
  justify-content: flex-end;
  padding-top: var(--space-3);
  margin-top: var(--space-3);
  border-top: 1px solid var(--color-border-lighter);
}
/* SaaS announcement list pass */
.page-container {
  max-width: 1040px;
  margin-inline: auto;
  gap: var(--space-4);
}
.filter-bar,
.loading-skeleton,
.empty-card {
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-lighter);
  box-shadow: var(--shadow-card);
}
.filter-bar { padding: var(--space-3) var(--space-4); }
.announce-list { gap: var(--space-3); }
.pagination-wrap {
  justify-content: flex-end;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-lighter);
}
</style>
