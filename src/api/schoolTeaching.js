import request from '@/request'

function pageData(response) {
  const data = response?.data || response || {}
  return {
    records: data.records || [],
    total: data.total || 0,
    page: data.page || data.pageNum || 1,
    pageSize: data.pageSize || 20,
  }
}

export async function getCourseListApi(params = {}) {
  return pageData(await request.get('/school/courses', { params }))
}

export function createCourseApi(data) {
  return request.post('/school/courses', data)
}

export function updateCourseApi(id, data) {
  return request.put(`/school/courses/${id}`, data)
}

export function deleteCourseApi(id) {
  return request.delete(`/school/courses/${id}`)
}

export async function getClassListApi(params = {}) {
  return pageData(await request.get('/school/classes', { params }))
}

export function createClassApi(data) {
  return request.post('/school/classes', data)
}

export function updateClassApi(id, data) {
  return request.put(`/school/classes/${id}`, data)
}

export function deleteClassApi(id) {
  return request.delete(`/school/classes/${id}`)
}

export async function getEnrollmentListApi(params = {}) {
  return pageData(await request.get('/school/enrollments', { params }))
}

export function createEnrollmentApi(data) {
  return request.post('/school/enrollments', data)
}

export function updateEnrollmentApi(id, data) {
  return request.put(`/school/enrollments/${id}`, data)
}

export function deleteEnrollmentApi(id) {
  return request.delete(`/school/enrollments/${id}`)
}

export async function getTeachingOrgOptionsApi() {
  const response = await request.get('/school/teaching-orgs', { params: { pageNum: 1, pageSize: 200 } })
  return pageData(response).records
}

export async function getCourseOptionsApi() {
  return (await request.get('/school/courses/options')).data || []
}

export async function getClassOptionsApi() {
  return (await request.get('/school/classes/options')).data || []
}
