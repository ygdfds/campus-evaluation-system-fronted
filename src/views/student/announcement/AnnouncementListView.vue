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
const pageSize = 8

const tagOptions = [
  { label: '全部', value: 'all' },
  { label: '评价开放', value: '评价开放中' },
  { label: '服务评价', value: '服务评价' },
  { label: '截止提醒', value: '截止提醒' },
  { label: '维护通知', value: '维护通知' },
  { label: '服务提醒', value: '服务提醒' },
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
    list = list.filter(a => a.title.toLowerCase().includes(kw))
  }
  if (sortOrder.value === 'asc') {
    list.sort((a, b) => a.publish_time.localeCompare(b.publish_time))
  } else {
    list.sort((a, b) => b.publish_time.localeCompare(a.publish_time))
  }
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
  if (!tenantId) { loading.value = false; return }

  try {
    const [list, files] = await Promise.all([
      getAnnouncementsApi(tenantId, roleType),
      getFileResourcesApi(tenantId),
    ])
    const fileMap = {}
    files.forEach(f => { fileMap[f.id] = f })

    announcements.value = list.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      tag: n.tag,
      notice_type: n.notice_type,
      publish_time: formatDate(n.publish_time),
      cover: n.cover_file_id && fileMap[n.cover_file_id] ? fileMap[n.cover_file_id].url : '',
    }))
  } catch (err) {
    console.error('加载公告列表失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div class="page-container">
    <PageHeader title="校园公告" description="查看学校评价通知、服务提醒和系统公告" />

    <!-- 筛选工具条 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-radio-group v-model="filterTag" size="small">
          <el-radio-button v-for="opt in tagOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio-button>
        </el-radio-group>
        <el-select v-model="sortOrder" size="small" class="sort-select">
          <el-option label="最新发布" value="desc" />
          <el-option label="最早发布" value="asc" />
        </el-select>
      </div>
      <el-input
        v-model="searchText"
        placeholder="搜索公告标题"
        :prefix-icon="Search"
        clearable
        class="search-input"
        size="default"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 公告列表 -->
    <div v-else-if="filteredList.length" class="announce-list">
      <AnnouncementCard
        v-for="item in pagedList"
        :key="item.id"
        :item="item"
        @click="handleCardClick"
      />
    </div>

    <!-- 空状态 -->
    <el-card v-else shadow="never" class="empty-card">
      <EmptyPlaceholder text="暂无公告" description="当前没有符合条件的公告通知" />
    </el-card>

    <!-- 分页 -->
    <div v-if="filteredList.length > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredList.length"
        layout="prev, pager, next"
        small
      />
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
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sort-select {
  width: 130px;
}

.search-input {
  width: 240px;
}

.loading-skeleton {
  padding: var(--space-6);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.announce-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.empty-card {
  border-radius: var(--radius-lg);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: var(--space-3);
}
</style>
