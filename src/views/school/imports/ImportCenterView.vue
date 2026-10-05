<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search, View, Download, Upload, CircleClose, Document } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  getSchoolImportBatchesApi,
  getSchoolImportErrorsApi,
  cancelSchoolImportApi,
  uploadSchoolImportApi,
  getSchoolImportSummaryApi,
  downloadSchoolImportTemplateApi,
} from '@/api/schoolImports'

defineOptions({ name: 'SchoolImportCenterView' })

const userStore = useUserStore()

const loading = ref(false)
const batches = ref([])
const summary = ref({ total: 0, pending: 0, success: 0, failed: 0 })

const filters = ref({ keyword: '', import_type: 'all', status: 'all' })
const page = ref(1)
const pageSize = ref(10)

const paginatedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return batches.value.slice(start, start + pageSize.value)
})

// 详情抽屉
const drawerVisible = ref(false)
const currentBatch = ref(null)
const errorList = ref([])
const errorLoading = ref(false)

// 上传弹窗
const uploadVisible = ref(false)
const uploadForm = ref({ import_type: 'student', file: null, file_name: '' })

const importTypes = [
  { value: 'student', label: '学生' },
  { value: 'staff', label: '教职工' },
]

const statusTagType = (code) => {
  const map = { processing: 'info', success: 'success', partial_failed: 'warning', failed: 'danger', cancelled: 'info' }
  return map[code] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const tid = userStore.tenantId
    const [list, sum] = await Promise.all([
      getSchoolImportBatchesApi(tid, filters.value),
      getSchoolImportSummaryApi(tid),
    ])
    batches.value = list
    summary.value = sum
  } catch (e) {
    console.error('加载导入列表失败', e)
    ElMessage.error('加载导入列表失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = { keyword: '', import_type: 'all', status: 'all' }
  loadData()
}

async function openDetail(batch) {
  currentBatch.value = batch
  drawerVisible.value = true
  errorList.value = []
  if (batch.error_count > 0) {
    errorLoading.value = true
    try {
      errorList.value = await getSchoolImportErrorsApi(batch.id)
    } catch {
      ElMessage.error('加载错误记录失败')
    } finally {
      errorLoading.value = false
    }
  }
}

async function handleCancel(batch) {
  try {
    await ElMessageBox.confirm('确认取消该导入批次？', '取消导入', { type: 'warning' })
    await cancelSchoolImportApi(userStore.tenantId, userStore.schoolId, batch.id, userStore.userInfo?.id)
    ElMessage.success('已取消')
    loadData()
  } catch (e) { if (e !== 'cancel' && e?.toString() !== 'cancel') ElMessage.error('操作失败') }
}

function openUpload() {
  uploadForm.value = { import_type: 'student', file: null, file_name: '' }
  uploadVisible.value = true
}

async function submitUpload() {
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择 CSV 文件')
    return
  }
  try {
    await uploadSchoolImportApi(userStore.tenantId, userStore.schoolId, uploadForm.value.import_type, uploadForm.value.file)
    ElMessage.success('导入处理完成，请查看批次结果')
    uploadVisible.value = false
    loadData()
  } catch { ElMessage.error('上传失败') }
}

function handleDownloadTemplate(type) {
  downloadSchoolImportTemplateApi(type)
}

function handleImportFileChange(uploadFile) {
  const file = uploadFile.raw
  if (!file?.name?.toLowerCase().endsWith('.csv')) {
    ElMessage.warning('请上传 CSV 文件')
    uploadForm.value.file = null
    uploadForm.value.file_name = ''
    return
  }
  uploadForm.value.file = file
  uploadForm.value.file_name = file.name
}

function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => loadData())
</script>

<template>
  <div class="page">
    <PageHeader title="数据导入中心" description="批量导入学生、教职工、课程等基础数据">
      <template #actions>
        <el-button :icon="Refresh" @click="loadData" :loading="loading">刷新</el-button>
        <el-button type="primary" :icon="Upload" @click="openUpload">上传导入</el-button>
      </template>
    </PageHeader>

    <div class="summary-bar">
      <div class="s"><em>{{ summary.total }}</em>全部批次</div>
      <div class="s s-w"><em>{{ summary.pending }}</em>处理中</div>
      <div class="s s-ok"><em>{{ summary.success }}</em>成功</div>
      <div class="s s-err"><em>{{ summary.failed }}</em>失败/异常</div>
    </div>

    <div class="filters">
      <el-input v-model="filters.keyword" placeholder="搜索文件名、上传人…" :prefix-icon="Search" clearable @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="filters.import_type" @change="loadData">
        <el-option label="全部类型" value="all" />
        <el-option v-for="t in importTypes" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-select v-model="filters.status" @change="loadData">
        <el-option label="全部状态" value="all" />
        <el-option label="处理中" value="processing" />
        <el-option label="成功" value="success" />
        <el-option label="部分失败" value="partial_failed" />
        <el-option label="失败" value="failed" />
      </el-select>
      <el-button text type="primary" @click="resetFilters">重置</el-button>
    </div>

    <div class="list-box" v-loading="loading">
      <el-table :data="paginatedList" stripe style="width: 100%" :header-cell-style="{ background: 'var(--color-bg-light)', color: 'var(--color-text-secondary)', fontSize: '13px' }">
        <el-table-column prop="file_name" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column prop="import_type" label="类型" width="90" />
        <el-table-column prop="uploader_name" label="上传人" width="90" />
        <el-table-column label="总数" width="70" align="center">
          <template #default="{ row }">{{ row.total_count }}</template>
        </el-table-column>
        <el-table-column label="成功" width="70" align="center">
          <template #default="{ row }"><span style="color: var(--color-success)">{{ row.success_count }}</span></template>
        </el-table-column>
        <el-table-column label="失败" width="70" align="center">
          <template #default="{ row }"><span :style="{ color: row.error_count > 0 ? 'var(--color-danger)' : '' }">{{ row.error_count }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status_code)" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status_code === 'processing'" text type="danger" size="small" :icon="CircleClose" @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar" v-if="batches.length > 0">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="batches.length" layout="prev, pager, next, total" />
      </div>

      <div v-if="!loading && batches.length === 0" class="empty">
        <el-icon :size="48" color="var(--color-text-placeholder)"><Document /></el-icon>
        <p>暂无导入记录</p>
        <span>点击「上传导入」开始批量导入基础数据。</span>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="导入批次详情" size="640px">
      <template v-if="currentBatch">
        <div class="ds">
          <h3 class="ds-title">批次信息</h3>
          <div class="dg">
            <div class="di"><span class="dl">文件名</span><span class="dv">{{ currentBatch.file_name }}</span></div>
            <div class="di"><span class="dl">导入类型</span><span class="dv">{{ currentBatch.import_type }}</span></div>
            <div class="di"><span class="dl">上传人</span><span class="dv">{{ currentBatch.uploader_name }}</span></div>
            <div class="di"><span class="dl">上传时间</span><span class="dv">{{ formatTime(currentBatch.created_at) }}</span></div>
            <div class="di"><span class="dl">状态</span><span class="dv"><el-tag size="small" :type="statusTagType(currentBatch.status_code)">{{ currentBatch.status }}</el-tag></span></div>
            <div class="di"><span class="dl">开始时间</span><span class="dv">{{ formatTime(currentBatch.started_at) }}</span></div>
          </div>
          <div class="stats-row">
            <div class="stat-item"><span class="stat-num">{{ currentBatch.total_count }}</span><span class="stat-label">总数</span></div>
            <div class="stat-item"><span class="stat-num stat-ok">{{ currentBatch.success_count }}</span><span class="stat-label">成功</span></div>
            <div class="stat-item"><span class="stat-num" :class="{ 'stat-err': currentBatch.error_count > 0 }">{{ currentBatch.error_count }}</span><span class="stat-label">失败</span></div>
          </div>
        </div>
        <div v-if="currentBatch.error_count > 0" class="ds">
          <h3 class="ds-title">错误记录</h3>
          <el-table :data="errorList" stripe v-loading="errorLoading" style="width: 100%" size="small">
            <el-table-column prop="row_number" label="行号" width="70" />
            <el-table-column prop="field_name" label="字段" width="100" />
            <el-table-column prop="error_reason" label="错误原因" min-width="200" show-overflow-tooltip />
            <el-table-column prop="original_value" label="原始值" width="120" show-overflow-tooltip />
          </el-table>
        </div>
      </template>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 上传弹窗 -->
    <el-dialog v-model="uploadVisible" title="上传数据导入" width="500px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="导入类型">
          <el-select v-model="uploadForm.import_type" style="width:100%">
            <el-option v-for="t in importTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="CSV 文件">
          <el-upload :auto-upload="false" :show-file-list="false" accept=".csv" :on-change="handleImportFileChange">
            <el-button :icon="Upload">选择文件</el-button>
          </el-upload>
          <span class="file-name">{{ uploadForm.file_name || '未选择文件' }}</span>
        </el-form-item>
        <div class="template-hint">
          <el-button text type="primary" size="small" :icon="Download" @click="handleDownloadTemplate(uploadForm.import_type)">下载导入模板</el-button>
          <span>请先下载 CSV 模板，按要求填写后上传。</span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload">确认上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.summary-bar { display: flex; align-items: center; gap: var(--space-6); background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-3) var(--space-5); }
.summary-bar .s { display: inline-flex; align-items: baseline; gap: 4px; font-size: var(--font-sm); color: var(--color-text-muted); }
.summary-bar .s em { font-style: normal; font-size: var(--font-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-heading); }
.s-w em { color: var(--color-warning) !important; }
.s-ok em { color: var(--color-success) !important; }
.s-err em { color: var(--color-danger) !important; }

.filters { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-3) var(--space-4); }
.filters .el-input { width: 260px; }
.filters .el-select { width: 130px; }

.list-box { background: var(--color-bg-card); border: 1px solid var(--color-border-lighter); border-radius: var(--radius-card); padding: var(--space-4); min-height: 300px; }
.pagination-bar { display: flex; justify-content: flex-end; padding: var(--space-4) 0 0; }
.empty { display: flex; flex-direction: column; align-items: center; padding: var(--space-12); gap: var(--space-2); }
.empty p { font-size: var(--font-base); color: var(--color-text-secondary); margin: 0; }
.empty span { font-size: var(--font-sm); color: var(--color-text-placeholder); }

.ds { margin-bottom: var(--space-5); }
.ds-title { font-size: var(--font-base); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-border-lighter); }
.dg { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.di { display: flex; flex-direction: column; gap: var(--space-1); }
.dl { font-size: var(--font-xs); color: var(--color-text-placeholder); }
.dv { font-size: var(--font-sm); color: var(--color-text-body); }

.stats-row { display: flex; gap: var(--space-6); margin-top: var(--space-4); padding: var(--space-3) var(--space-4); background: var(--color-bg-light); border-radius: var(--radius-sm); }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.stat-num { font-size: var(--font-xl); font-weight: var(--font-weight-bold); color: var(--color-text-heading); }
.stat-ok { color: var(--color-success); }
.stat-err { color: var(--color-danger); }
.stat-label { font-size: var(--font-xs); color: var(--color-text-placeholder); }

.template-hint { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3); background: var(--color-bg-light); border-radius: var(--radius-sm); }
.template-hint span { font-size: var(--font-xs); color: var(--color-text-placeholder); }
</style>
