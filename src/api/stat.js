import request from '@/request'

/**
 * 获取租户统计快照
 */
export function getTenantStatSnapshotsApi(tenantId) {
  return request.get('/tenantStatSnapshots', { params: { tenant_id: tenantId } })
    .then(res => res.data || [])
}

/**
 * 获取服务统计快照
 */
export function getServiceStatSnapshotsApi(tenantId) {
  return request.get('/serviceStatSnapshots', { params: { tenant_id: tenantId } })
    .then(res => res.data || [])
}
