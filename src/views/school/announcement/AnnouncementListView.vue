<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, Search, View, Edit, Promotion, SwitchButton, Delete,
} from '@element-plus/icons-vue'
import CoverImage from '@/components/common/CoverImage.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  announcementRoleOptions,
  announcementStatusMap,
  announcementStatusTagMap,
  announcementTagOptions,
  createSchoolAnnouncementApi,
  deleteSchoolAnnouncementApi,
  getSchoolAnnouncementCoverOptionsApi,
  getSchoolAnnouncementDetailApi,
  getSchoolAnnouncementListApi,
  getSchoolAnnouncementStatsApi,
  offlineSchoolAnnouncementApi,
  publishSchoolAnnouncementApi,
  updateSchoolAnnouncementApi,
} from '@/api/schoolAnnouncements'

defineOptions({ name: 'SchoolAnnouncementListView' })

const userStore = useUserStore()

const context = computed(() => ({
  tenantId: userStore.tenantId,
  schoolId: userStore.schoolId || userStore.tenantId,
  userId: userStore.userInfo?.id || userStore.userInfo?.user_id,
}))

const loading = ref(false)
const list = ref([])
const total = ref(0)
const stats = ref({ total: 0, draft: 0, published: 0, offline: 0 })
const coverOptions = ref([])
const filters = ref({
  keyword: '',
  tag: 'all',
  status: 'all',
  page: 1,
  pageSize: 10,
})

const editorVisible = ref(false)
const editorMode = ref('create')
const editorLoading = ref(false)
const editorFormRef = ref(null)
const editorForm = ref(createEmptyForm())

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

const rules = {
  title: [
    { required: true, message: '请填写公告标题', trigger: 'blur' },
    { min: 4, max: 60, message: '标题长度为 4-60 字', trigger: 'blur' },
  ],
  tag: [{ required: true, message: '请选择公告分类', trigger: 'change' }],
  content: [
    { required: true, message: '请填写公告正文', trigger: 'blur' },
    { min: 20, max: 3000, message: '正文长度为 20-3000 字', trigger: 'blur' },
  ],
  target_roles: [{ type: 'array', required: true, min: 1, message: '请选择可见对象', trigger: 'change' }],
}

const statCards = computed(() => [
  { key: 'total', label: '全部公告', value: stats.value.total, tone: 'default' },
  { key: 'draft', label: '草稿', value: stats.value.draft, tone: 'info' },
  { key: 'published', label: '已发布', value: stats.value.published, tone: 'success' },
  { key: 'offline', label: '已下线', value: stats.value.offline, tone: 'warning' },
])

function createEmptyForm() {
  return {
    id: null,
    title: '',
    summary: '',
    content: '',
    tag: '教学事务',
    cover_file_id: null,
    target_roles: ['student'],
    status: 'draft',
  }
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = num => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function loadData() {
  loading.value = true
  try {
    const [listRes, statsRes] = await Promise.all([
      getSchoolAnnouncementListApi(context.value, filters.value),
      getSchoolAnnouncementStatsApi(context.value, filters.value),
    ])
    list.value = listRes.list
    total.value = listRes.total
    stats.value = statsRes
  } catch (error) {
    console.error(error)
    ElMessage.error('加载公告列表失败')
  } finally {
    loading.value = false
  }
}

async function loadCoverOptions() {
  try {
    coverOptions.value = await getSchoolAnnouncementCoverOptionsApi(context.value)
  } catch {
    coverOptions.value = []
  }
}

function handleSearch() {
  filters.value.page = 1
  loadData()
}

function handleReset() {
  filters.value = { keyword: '', tag: 'all', status: 'all', page: 1, pageSize: 10 }
  loadData()
}

function openCreate() {
  editorMode.value = 'create'
  editorForm.value = createEmptyForm()
  editorVisible.value = true
}

function openEdit(row) {
  editorMode.value = 'edit'
  editorForm.value = {
    id: row.id,
    title: row.title,
    summary: row.summary || '',
    content: row.content || '',
    tag: row.tag,
    cover_file_id: row.cover_file_id || null,
    target_roles: row.target_role_list?.length ? row.target_role_list : ['student'],
    status: row.status,
  }
  editorVisible.value = true
}

async function submitEditor(nextStatus = null) {
  try {
    await editorFormRef.value?.validate()
  } catch {
    return
  }
  editorLoading.value = true
  try {
    const payload = { ...editorForm.value, status: nextStatus || editorForm.value.status || 'draft' }
    if (editorMode.value === 'create') {
      await createSchoolAnnouncementApi(context.value, payload)
      ElMessage.success(payload.status === 'published' ? '公告已发布' : '草稿已保存')
    } else {
      await updateSchoolAnnouncementApi(context.value, payload.id, payload)
      if (nextStatus === 'published') {
        await publishSchoolAnnouncementApi(context.value, payload.id)
        ElMessage.success('公告已发布')
      } else {
        ElMessage.success('公告已保存')
      }
    }
    editorVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存公告失败')
  } finally {
    editorLoading.value = false
  }
}

async function openDetail(row) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getSchoolAnnouncementDetailApi(context.value, row.id)
  } catch {
    ElMessage.error('加载公告详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function handlePublish(row) {
  try {
    await ElMessageBox.confirm(`发布后，符合可见对象的用户可在学生端公告页看到《${row.title}》。`, '确认发布公告？', {
      confirmButtonText: '发布',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await publishSchoolAnnouncementApi(context.value, row.id)
    ElMessage.success('公告已发布')
    await loadData()
  } catch { /* cancelled */ }
}

async function handleOffline(row) {
  try {
    await ElMessageBox.confirm(`下线后，用户端将不再展示《${row.title}》。`, '确认下线公告？', {
      confirmButtonText: '下线',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await offlineSchoolAnnouncementApi(context.value, row.id)
    ElMessage.success('公告已下线')
    await loadData()
  } catch { /* cancelled */ }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`删除后公告不会再显示，历史操作日志仍会保留。确认删除《${row.title}》？`, '确认删除公告？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteSchoolAnnouncementApi(context.value, row.id)
    ElMessage.success('公告已删除')
    await loadData()
  } catch (error) {
    if (error?.message) ElMessage.error(error.message)
  }
}

onMounted(async () => {
  await Promise.all([loadData(), loadCoverOptions()])
})
</script>

<template>
  <div class="page">
    <PageHeader title="公告管理" description="发布和维护学校正式公告，学生端公告页与首页轮播仅展示已发布公告。">
      <template #actions>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建公告</el-button>
      </template>
    </PageHeader>

    <div class="toolbar">
      <div class="toolbar-stats">
        <span v-for="(card, i) in statCards" :key="card.key" class="stat">
          <em :class="`c-${card.tone}`">{{ card.value }}</em>{{ card.label }}<span v-if="i < statCards.length - 1" class="divider" />
        </span>
      </div>
      <div class="toolbar-filters">
        <el-input v-model="filters.keyword" placeholder="搜索标题、摘要或正文" clearable :prefix-icon="Search" @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-select v-model="filters.tag" @change="handleSearch">
          <el-option label="全部分类" value="all" />
          <el-option v-for="tag in announcementTagOptions" :key="tag" :label="tag" :value="tag" />
        </el-select>
        <el-select v-model="filters.status" @change="handleSearch">
          <el-option label="全部状态" value="all" />
          <el-option v-for="(label, key) in announcementStatusMap" :key="key" :label="label" :value="key" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="table-wrap">
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="公告内容" min-width="360">
          <template #default="{ row }">
            <div class="cell">
              <CoverImage :src="row._cover_url" :alt="row.title" width="112px" height="72px" radius="8px" class="cell-cover" />
              <div class="cell-body">
                <div class="cell-title">{{ row.title }}</div>
                <div class="cell-desc">{{ row.summary || row.content }}</div>
                <div class="cell-tags">
                  <el-tag size="small" effect="plain">{{ row.tag }}</el-tag>
                  <span>{{ row.target_role_text }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="announcementStatusTagMap[row.status]" effect="plain">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170">
          <template #default="{ row }">{{ formatDate(row.publish_time) }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <div class="actions">
              <el-button size="small" :icon="View" @click="openDetail(row)">查看</el-button>
              <el-button v-if="row.status !== 'published'" size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status !== 'published'" size="small" type="success" :icon="Promotion" @click="handlePublish(row)">发布</el-button>
              <el-button v-if="row.status === 'published'" size="small" type="warning" :icon="SwitchButton" @click="handleOffline(row)">下线</el-button>
              <el-button v-if="row.status !== 'published'" size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="filters.page" layout="prev, pager, next" :page-size="filters.pageSize" :total="total" @current-change="loadData" />
      </div>
    </div>

    <el-drawer v-model="editorVisible" :title="editorMode === 'create' ? '新建公告' : '编辑公告'" size="560px">
      <el-form ref="editorFormRef" :model="editorForm" :rules="rules" label-position="top">
        <el-form-item label="公告标题" prop="title"><el-input v-model="editorForm.title" maxlength="60" show-word-limit /></el-form-item>
        <el-form-item label="公告摘要" prop="summary"><el-input v-model="editorForm.summary" type="textarea" :rows="3" maxlength="160" show-word-limit /></el-form-item>
        <el-form-item label="公告分类" prop="tag"><el-select v-model="editorForm.tag" style="width:100%"><el-option v-for="tag in announcementTagOptions" :key="tag" :label="tag" :value="tag" /></el-select></el-form-item>
        <el-form-item label="可见对象" prop="target_roles"><el-checkbox-group v-model="editorForm.target_roles"><el-checkbox v-for="role in announcementRoleOptions" :key="role.value" :label="role.value">{{ role.label }}</el-checkbox></el-checkbox-group></el-form-item>
        <el-form-item label="封面图片"><el-select v-model="editorForm.cover_file_id" style="width:100%" clearable placeholder="选择已有封面资源"><el-option v-for="file in coverOptions" :key="file.id" :label="file.label" :value="file.id"><span>{{ file.label }}</span><span class="opt-url">{{ file.url }}</span></el-option></el-select></el-form-item>
        <el-form-item label="公告正文" prop="content"><el-input v-model="editorForm.content" type="textarea" :rows="10" maxlength="3000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <div class="drawer-ft">
          <el-button @click="editorVisible = false">取消</el-button>
          <el-button :loading="editorLoading" @click="submitEditor(editorMode === 'create' ? 'draft' : null)">{{ editorMode === 'create' ? '保存草稿' : '保存修改' }}</el-button>
          <el-button type="primary" :loading="editorLoading" @click="submitEditor('published')">保存并发布</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="detailVisible" title="公告详情" size="620px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <CoverImage :src="detail._cover_url" :alt="detail.title" width="100%" height="260px" radius="12px" class="detail-cover" />
          <div class="detail-tags">
            <el-tag :type="announcementStatusTagMap[detail.status]" effect="plain">{{ detail.status_text }}</el-tag>
            <el-tag effect="plain">{{ detail.tag }}</el-tag>
            <span>{{ formatDate(detail.publish_time || detail.created_at) }}</span>
          </div>
          <h2>{{ detail.title }}</h2>
          <p class="detail-summary">{{ detail.summary }}</p>
          <article class="detail-content">{{ detail.content }}</article>
          <div class="detail-foot">
            <span>可见对象：{{ detail.target_role_text }}</span>
            <span>公告 ID：{{ detail.id }}</span>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 工具栏：统计 + 筛选 合并为一行 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-card);
}

.toolbar-stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.stat {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.stat em {
  font-style: normal;
  font-size: var(--font-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
}

.stat .divider {
  display: inline-block;
  width: 1px;
  height: 14px;
  background: var(--color-border-lighter);
  margin-left: var(--space-4);
}

.c-default em { color: var(--color-primary); }
.c-info em { color: var(--color-info); }
.c-success em { color: var(--color-success); }
.c-warning em { color: var(--color-warning); }

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.toolbar-filters .el-input { width: 220px; }
.toolbar-filters .el-select { width: 130px; }

/* 表格区 */
.table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-3);
}

.cell {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.cell-cover {
  flex-shrink: 0;
  border-radius: var(--radius-md);
}

.cell-body { min-width: 0; }

.cell-title {
  font-family: var(--font-family-display);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-heading);
  margin-bottom: 4px;
}

.cell-desc {
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 520px;
}

.cell-tags {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-4) var(--space-1) var(--space-1);
}

/* 抽屉 */
.drawer-ft {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.opt-url {
  float: right;
  max-width: 260px;
  margin-left: var(--space-4);
  color: var(--color-text-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-body { min-height: 360px; }

.detail-cover {
  width: 100%;
  height: 260px;
  border-radius: var(--radius-card);
  margin-bottom: var(--space-4);
}

.detail-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
}

.detail-body h2 {
  margin: var(--space-3) 0 var(--space-2);
  font-family: var(--font-family-display);
  color: var(--color-text-heading);
  line-height: 1.35;
}

.detail-summary {
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.detail-content {
  white-space: pre-wrap;
  color: var(--color-text-body);
  line-height: 1.9;
  font-size: var(--font-base);
}

.detail-foot {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

@media (max-width: 1100px) {
  .toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-filters { width: 100%; }
  .toolbar-filters .el-input { width: 100%; }
}
</style>
