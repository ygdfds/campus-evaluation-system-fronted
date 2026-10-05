import request from '@/request'

const importTypeMap = { student: '学生', staff: '教职工' }
const importStatusMap = {
  processing: '导入中',
  success: '成功',
  partial_failed: '部分失败',
  failed: '失败',
  cancelled: '已取消',
}

function normalizeBatch(b) {
  return {
    id: b.id,
    import_type: importTypeMap[b.importType] || b.importType,
    import_type_code: b.importType,
    file_name: b.fileName || '',
    total_count: b.totalCount || 0,
    success_count: b.successCount || 0,
    error_count: b.errorCount || 0,
    status: importStatusMap[b.status] || b.status,
    status_code: b.status,
    uploader_name: b.uploaderName || '未知',
    uploader_id: b.uploaderId,
    started_at: b.startedAt,
    finished_at: b.finishedAt,
    created_at: b.createdAt,
  }
}

export async function getSchoolImportBatchesApi(tenantId, filters = {}) {
  const res = await request.get('/school/imports/batches', {
    params: {
      importType: filters.import_type === 'all' ? undefined : filters.import_type,
      status: filters.status === 'all' ? undefined : filters.status,
      keyword: filters.keyword || undefined,
      pageNum: 1,
      pageSize: 200,
    },
  })
  return (res.data?.records || []).map(normalizeBatch)
}

export async function getSchoolImportErrorsApi(batchId) {
  const res = await request.get(`/school/imports/batches/${batchId}/errors`)
  return (res.data || []).map(e => ({
    id: e.id,
    batch_id: e.batchId,
    row_number: e.rowNumber,
    field_name: e.fieldName || '',
    error_reason: e.errorReason || '',
    original_value: e.originalValue || '',
    created_at: e.createdAt,
  }))
}

export async function uploadSchoolImportApi(tenantId, schoolId, importType, file) {
  const formData = new FormData()
  formData.append('importType', importType)
  formData.append('file', file)
  const res = await request.post('/school/imports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return normalizeBatch(res.data)
}

export async function cancelSchoolImportApi(tenantId, schoolId, batchId) {
  await request.delete(`/school/imports/batches/${batchId}`)
  return { success: true }
}

export async function getSchoolImportSummaryApi(tenantId) {
  const batches = await getSchoolImportBatchesApi(tenantId)
  return {
    total: batches.length,
    pending: batches.filter(b => b.status_code === 'processing').length,
    success: batches.filter(b => b.status_code === 'success').length,
    failed: batches.filter(b => b.status_code === 'failed' || b.status_code === 'partial_failed').length,
  }
}

export async function downloadSchoolImportTemplateApi(type) {
  const res = await request.get(`/school/imports/templates/${type}`, { responseType: 'blob' })
  const blob = res instanceof Blob ? res : new Blob([res], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}-template.csv`
  link.click()
  URL.revokeObjectURL(url)
}
