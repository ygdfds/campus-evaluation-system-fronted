import request from '@/request'

/**
 * 获取评测表单列表
 */
export function getEvaluationFormsApi() {
  return request.get('/evaluation-forms')
}

/**
 * 获取评测提交列表
 */
export function getEvaluationsApi(params) {
  return request.get('/evaluations', { params })
}

/**
 * 提交评测
 * @param {object} data - 评测数据
 */
export function submitEvaluationApi(data) {
  return request.post('/evaluations', data)
}
