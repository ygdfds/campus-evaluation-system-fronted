import request from '@/request'

/**
 * 获取投诉列表
 */
export function getComplaintsApi(params) {
  return request.get('/complaints', { params })
}

/**
 * 提交投诉
 * @param {object} data - 投诉数据
 */
export function submitComplaintApi(data) {
  return request.post('/complaints', data)
}
