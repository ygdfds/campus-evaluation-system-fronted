import request from '@/request'

function unwrap(res) {
  return res?.data ?? res
}

export function getAiStatusApi() {
  return request.get('/ai/status', { timeout: 30000 }).then(unwrap)
}

export function askAiApi(payload) {
  return request.post('/ai/ask', payload, { timeout: 180000 }).then(unwrap)
}
