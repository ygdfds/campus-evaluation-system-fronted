import request from '@/request'

/**
 * 学校管理端 - 数据概览 API
 * 基于 ER 图：evaluation_db + org_course_db 跨库关联
 */

// 表单类型中文映射
const formTypeMap = {
  teaching: '教学评价',
  service: '服务评价',
  instant: '即时评价',
}

/**
 * 获取数据概览核心指标
 */
export async function getDataOverviewMetricsApi(tenantId) {
  const [submissionsRes, formsRes, teachingOrgsRes, serviceOrgsRes] = await Promise.all([
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false, status: 'submitted' } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false, status: 'published' } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted && s.status === 'submitted')
  const forms = (formsRes.data || []).filter(f => !f.deleted && f.status === 'published')
  const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
  const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)

  // 计算平均分
  const scoredSubmissions = submissions.filter(s => s.overall_score != null)
  const avgScore = scoredSubmissions.length > 0
    ? (scoredSubmissions.reduce((sum, s) => sum + s.overall_score, 0) / scoredSubmissions.length).toFixed(1)
    : '0.0'

  // 本月提交数
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSubmissions = submissions.filter(s => {
    const d = new Date(s.submitted_at || s.created_at)
    return d >= monthStart
  }).length

  return {
    totalSubmissions: submissions.length,
    avgScore: Number(avgScore),
    activeForms: forms.length,
    teachingOrgCount: teachingOrgs.length,
    serviceOrgCount: serviceOrgs.length,
    monthSubmissions,
  }
}

/**
 * 获取各部门评价统计（教学评价按院系、服务评价按服务部门）
 */
export async function getDepartmentEvaluationStatsApi(tenantId) {
  const [submissionsRes, formsRes, serviceItemsRes, coursesRes, teachingOrgsRes, serviceOrgsRes] = await Promise.all([
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false, status: 'submitted' } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceItems', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/teachingOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/serviceOrgUnits', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted && s.status === 'submitted')
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const serviceItems = (serviceItemsRes.data || []).filter(i => !i.deleted)
  const courses = (coursesRes.data || []).filter(c => !c.deleted)
  const teachingOrgs = (teachingOrgsRes.data || []).filter(o => !o.deleted)
  const serviceOrgs = (serviceOrgsRes.data || []).filter(o => !o.deleted)

  // 建立映射
  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })
  const serviceItemMap = {}
  serviceItems.forEach(i => { serviceItemMap[i.id] = i })
  const courseMap = {}
  courses.forEach(c => { courseMap[c.id] = c })
  const teachingOrgMap = {}
  teachingOrgs.forEach(o => { teachingOrgMap[o.id] = o })
  const serviceOrgMap = {}
  serviceOrgs.forEach(o => { serviceOrgMap[o.id] = o })

  // 教学评价按院系聚合
  const teachingByOrg = {}
  // 服务评价按服务部门聚合
  const serviceByOrg = {}

  submissions.forEach(sub => {
    const form = formMap[sub.form_id]
    if (!form) return

    const score = sub.overall_score
    if (score == null) return

    if (form.type === 'teaching' && form.course_id) {
      const course = courseMap[form.course_id]
      if (course && course.teaching_org_id) {
        const org = teachingOrgMap[course.teaching_org_id]
        if (org) {
          if (!teachingByOrg[org.id]) {
            teachingByOrg[org.id] = { name: org.name, count: 0, totalScore: 0 }
          }
          teachingByOrg[org.id].count++
          teachingByOrg[org.id].totalScore += score
        }
      }
    } else if ((form.type === 'service' || form.type === 'instant') && form.service_item_id) {
      const item = serviceItemMap[form.service_item_id]
      if (item && item.service_org_id) {
        const org = serviceOrgMap[item.service_org_id]
        if (org) {
          if (!serviceByOrg[org.id]) {
            serviceByOrg[org.id] = { name: org.name, count: 0, totalScore: 0 }
          }
          serviceByOrg[org.id].count++
          serviceByOrg[org.id].totalScore += score
        }
      }
    }
  })

  const teachingStats = Object.values(teachingByOrg).map(item => ({
    name: item.name,
    count: item.count,
    avgScore: Number((item.totalScore / item.count).toFixed(1)),
  }))

  const serviceStats = Object.values(serviceByOrg).map(item => ({
    name: item.name,
    count: item.count,
    avgScore: Number((item.totalScore / item.count).toFixed(1)),
  }))

  return { teachingStats, serviceStats }
}

/**
 * 获取评分分布统计
 */
export async function getScoreDistributionApi(tenantId) {
  const submissionsRes = await request.get('/evaluationSubmissions', {
    params: { tenant_id: tenantId, deleted: false, status: 'submitted' },
  })

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted && s.status === 'submitted' && s.overall_score != null)

  const distribution = [0, 0, 0, 0, 0] // 1-5分
  submissions.forEach(s => {
    const score = Math.round(s.overall_score)
    if (score >= 1 && score <= 5) {
      distribution[score - 1]++
    }
  })

  return distribution.map((count, index) => ({
    score: index + 1,
    label: `${index + 1}分`,
    count,
  }))
}

/**
 * 获取评价提交趋势（按月）
 */
export async function getSubmissionTrendApi(tenantId) {
  const submissionsRes = await request.get('/evaluationSubmissions', {
    params: { tenant_id: tenantId, deleted: false, status: 'submitted' },
  })

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted && s.status === 'submitted')

  // 按月聚合
  const monthMap = {}
  submissions.forEach(s => {
    const d = new Date(s.submitted_at || s.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap[key]) {
      monthMap[key] = { month: key, count: 0, totalScore: 0, scoredCount: 0 }
    }
    monthMap[key].count++
    if (s.overall_score != null) {
      monthMap[key].totalScore += s.overall_score
      monthMap[key].scoredCount++
    }
  })

  const sortedMonths = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))

  return sortedMonths.map(item => ({
    month: item.month,
    count: item.count,
    avgScore: item.scoredCount > 0 ? Number((item.totalScore / item.scoredCount).toFixed(1)) : 0,
  }))
}

/**
 * 获取教职工评价排行（按被评价次数）
 */
export async function getStaffEvaluationRankingApi(tenantId) {
  const [submissionsRes, formsRes, coursesRes, courseTeachersRes, profilesRes] = await Promise.all([
    request.get('/evaluationSubmissions', { params: { tenant_id: tenantId, deleted: false, status: 'submitted' } }),
    request.get('/evaluationForms', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courses', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/courseTeachers', { params: { tenant_id: tenantId, deleted: false } }),
    request.get('/personProfiles', { params: { tenant_id: tenantId, deleted: false } }),
  ])

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted && s.status === 'submitted')
  const forms = (formsRes.data || []).filter(f => !f.deleted)
  const courses = (coursesRes.data || []).filter(c => !c.deleted)
  const courseTeachers = (courseTeachersRes.data || []).filter(ct => !ct.deleted)
  const profiles = (profilesRes.data || []).filter(p => !p.deleted && p.role_type === 'staff')

  // 建立映射
  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })
  const courseMap = {}
  courses.forEach(c => { courseMap[c.id] = c })
  const profileMap = {}
  profiles.forEach(p => { profileMap[p.user_id] = p })

  // 课程-教师映射
  const courseTeacherMap = {}
  courseTeachers.forEach(ct => {
    if (!courseTeacherMap[ct.course_id]) {
      courseTeacherMap[ct.course_id] = []
    }
    courseTeacherMap[ct.course_id].push(ct.teacher_id)
  })

  // 统计教师被评价次数
  const staffStats = {}
  submissions.forEach(sub => {
    const form = formMap[sub.form_id]
    if (!form) return

    if (form.type === 'teaching' && form.course_id) {
      const teachers = courseTeacherMap[form.course_id] || []
      teachers.forEach(teacherId => {
        if (!staffStats[teacherId]) {
          staffStats[teacherId] = { count: 0, totalScore: 0, scoredCount: 0 }
        }
        staffStats[teacherId].count++
        if (sub.overall_score != null) {
          staffStats[teacherId].totalScore += sub.overall_score
          staffStats[teacherId].scoredCount++
        }
      })
    }
  })

  // 转换为数组并排序
  const ranking = Object.entries(staffStats)
    .map(([userId, stats]) => {
      const profile = profileMap[Number(userId)]
      return {
        userId: Number(userId),
        name: profile?.real_name || '未知教师',
        count: stats.count,
        avgScore: stats.scoredCount > 0 ? Number((stats.totalScore / stats.scoredCount).toFixed(1)) : 0,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // 取前10

  return ranking
}

/**
 * 获取评价类型分布
 */
export async function getFormTypeDistributionApi(tenantId) {
  const submissionsRes = await request.get('/evaluationSubmissions', {
    params: { tenant_id: tenantId, deleted: false, status: 'submitted' },
  })
  const formsRes = await request.get('/evaluationForms', {
    params: { tenant_id: tenantId, deleted: false },
  })

  const submissions = (submissionsRes.data || []).filter(s => !s.deleted && s.status === 'submitted')
  const forms = (formsRes.data || []).filter(f => !f.deleted)

  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })

  const typeCount = { teaching: 0, service: 0, instant: 0 }
  submissions.forEach(sub => {
    const form = formMap[sub.form_id]
    if (form && form.type) {
      typeCount[form.type] = (typeCount[form.type] || 0) + 1
    }
  })

  return [
    { type: 'teaching', label: formTypeMap.teaching, count: typeCount.teaching },
    { type: 'service', label: formTypeMap.service, count: typeCount.service },
    { type: 'instant', label: formTypeMap.instant, count: typeCount.instant },
  ]
}

/**
 * 获取数据概览全部数据（聚合调用）
 */
export async function getDataOverviewAllApi(tenantId) {
  const [
    metrics,
    departmentStats,
    scoreDistribution,
    submissionTrend,
    staffRanking,
    formTypeDistribution,
  ] = await Promise.all([
    getDataOverviewMetricsApi(tenantId),
    getDepartmentEvaluationStatsApi(tenantId),
    getScoreDistributionApi(tenantId),
    getSubmissionTrendApi(tenantId),
    getStaffEvaluationRankingApi(tenantId),
    getFormTypeDistributionApi(tenantId),
  ])

  return {
    metrics,
    departmentStats,
    scoreDistribution,
    submissionTrend,
    staffRanking,
    formTypeDistribution,
  }
}
