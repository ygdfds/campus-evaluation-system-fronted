import request from '@/request'
import { unwrap } from '@/request'

// ==================== 映射表 ====================

const importTypeMap = {
  student: '学生',
  staff: '教职工',
  course: '课程',
  class: '班级',
  enrollment: '选课',
  service_item: '服务项目',
}

const importStatusMap = {
  pending: '待确认',
  importing: '导入中',
  success: '成功',
  partial_failed: '部分失败',
  failed: '失败',
}

// ==================== 公开 API ====================

/**
 * 获取导入批次列表
 */
export async function getSchoolImportBatchesApi(tenantId, filters = {}) {
  const [batchesRes] = await Promise.all([
    request.get('/importBatches', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  let batches = (batchesRes.data || []).filter(b => !b.deleted)

  // 类型筛选
  if (filters.import_type && filters.import_type !== 'all') {
    batches = batches.filter(b => b.import_type === filters.import_type)
  }
  // 状态筛选
  if (filters.status && filters.status !== 'all') {
    batches = batches.filter(b => b.status === filters.status)
  }
  // 搜索
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    batches = batches.filter(b =>
      (b.file_name || '').toLowerCase().includes(kw) ||
      (b.uploader_name || '').toLowerCase().includes(kw)
    )
  }

  // 排序
  batches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return batches.map(b => ({
    id: b.id,
    import_type: importTypeMap[b.import_type] || b.import_type,
    import_type_code: b.import_type,
    file_name: b.file_name || '',
    total_count: b.total_count || 0,
    success_count: b.success_count || 0,
    error_count: b.error_count || 0,
    status: importStatusMap[b.status] || b.status,
    status_code: b.status,
    uploader_name: b.uploader_name || '未知',
    uploader_id: b.uploader_id,
    started_at: b.started_at,
    finished_at: b.finished_at,
    created_at: b.created_at,
    updated_at: b.updated_at,
  }))
}

/**
 * 获取导入错误详情
 */
export async function getSchoolImportErrorsApi(batchId) {
  const [errorsRes] = await Promise.all([
    request.get('/importRecordErrors', { params: { batch_id: batchId } }),
  ])

  return (errorsRes.data || []).map(e => ({
    id: e.id,
    batch_id: e.batch_id,
    row_number: e.row_number,
    field_name: e.field_name || '',
    error_reason: e.error_reason || '',
    original_value: e.original_value || '',
    created_at: e.created_at,
  }))
}

/**
 * 确认导入
 */
export async function confirmSchoolImportApi(tenantId, schoolId, batchId, currentUserId) {
  const now = new Date().toISOString()
  await request.patch(`/importBatches/${batchId}`, {
    status: 'importing',
    started_at: now,
    updated_at: now,
  }).then(unwrap)

  // 模拟导入完成
  await new Promise(resolve => setTimeout(resolve, 500))
  await request.patch(`/importBatches/${batchId}`, {
    status: 'success',
    finished_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).then(unwrap)

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'system',
    action: 'import',
    target_type: 'import_batch',
    target_id: batchId,
    content: `确认执行数据导入批次 #${batchId}`,
    created_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 取消导入
 */
export async function cancelSchoolImportApi(tenantId, schoolId, batchId, currentUserId) {
  const now = new Date().toISOString()
  await request.patch(`/importBatches/${batchId}`, {
    status: 'cancelled',
    updated_at: now,
    deleted: true,
  }).then(unwrap)

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'system',
    action: 'delete',
    target_type: 'import_batch',
    target_id: batchId,
    content: `取消数据导入批次 #${batchId}`,
    created_at: now,
    deleted: false,
  })

  return { success: true }
}

/**
 * 模拟上传文件（前端模拟）
 */
export async function uploadSchoolImportApi(tenantId, schoolId, importType, fileName, currentUserId) {
  const now = new Date().toISOString()
  const newBatch = await request.post('/importBatches', {
    tenant_id: tenantId,
    school_id: schoolId,
    import_type: importType,
    file_name: fileName,
    total_count: 0,
    success_count: 0,
    error_count: 0,
    status: 'pending',
    uploader_id: currentUserId,
    uploader_name: '',
    started_at: null,
    finished_at: null,
    created_at: now,
    updated_at: now,
    deleted: false,
  }).then(unwrap)

  await request.post('/operationLogs', {
    tenant_id: tenantId,
    school_id: schoolId,
    user_id: currentUserId,
    module: 'system',
    action: 'create',
    target_type: 'import_batch',
    target_id: newBatch?.id || 0,
    content: `上传数据导入文件：${fileName}`,
    created_at: now,
    deleted: false,
  })

  return newBatch
}

/**
 * 获取导入统计
 */
export async function getSchoolImportSummaryApi(tenantId) {
  const [batchesRes] = await Promise.all([
    request.get('/importBatches', { params: { tenant_id: tenantId, deleted: false } }),
  ])
  const batches = (batchesRes.data || []).filter(b => !b.deleted)
  return {
    total: batches.length,
    pending: batches.filter(b => b.status === 'pending').length,
    success: batches.filter(b => b.status === 'success').length,
    failed: batches.filter(b => b.status === 'failed' || b.status === 'partial_failed').length,
  }
}
