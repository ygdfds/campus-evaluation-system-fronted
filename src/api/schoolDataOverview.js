import request from '@/request'
import { dataOf } from '@/api/backend'

async function loadContext() {
  return dataOf(await request.get('/stats/staff/reports/context')) || {}
}

function submittedItems(ctx) {
  return (ctx.submissions || []).filter((item) =>
    ['submitted', 'locked', 'reviewed'].includes(item.status) && item.deleted !== true && item.deleted !== 1)
}

export async function getDataOverviewMetricsApi() {
  const ctx = await loadContext()
  const submissions = submittedItems(ctx)
  const forms = (ctx.forms || []).filter((item) => item.status === 'published')
  const scored = submissions.filter((item) => item.overall_score != null)
  const orgs = (ctx.teachingOrgs || []).length
  const serviceOrgs = (ctx.serviceOrgs || []).length
  return {
    totalSubmissions: submissions.length,
    avgScore: scored.length ? Number((scored.reduce((sum, item) => sum + Number(item.overall_score), 0) / scored.length).toFixed(1)) : 0,
    activeForms: forms.length,
    teachingOrgCount: orgs,
    serviceOrgCount: serviceOrgs,
    monthSubmissions: submissions.filter((item) => new Date(item.submitted_at || item.created_at).getMonth() === new Date().getMonth()).length,
  }
}

export async function getDepartmentEvaluationStatsApi() {
  const ctx = await loadContext()
  const submissions = submittedItems(ctx)
  const forms = ctx.forms || []
  const courses = ctx.courses || []
  const serviceItems = ctx.serviceItems || []
  const teachingOrgs = ctx.teachingOrgs || []
  const serviceOrgs = ctx.serviceOrgs || []
  const formMap = Object.fromEntries(forms.map((item) => [item.id, item]))
  const courseMap = Object.fromEntries(courses.map((item) => [item.id, item]))
  const itemMap = Object.fromEntries(serviceItems.map((item) => [item.id, item]))
  const teachingMap = Object.fromEntries(teachingOrgs.map((item) => [item.id, item]))
  const serviceMap = Object.fromEntries(serviceOrgs.map((item) => [item.id, item]))
  const groups = { teaching: {}, service: {} }

  submissions.forEach((submission) => {
    const form = formMap[submission.form_id]
    const score = Number(submission.overall_score)
    if (!form || !Number.isFinite(score)) return
    if (form.type === 'course_evaluation' && form.course_id) {
      const course = courseMap[form.course_id]
      const org = teachingMap[course?.teaching_org_id]
      if (!org) return
      groups.teaching[org.id] ||= { name: org.name, count: 0, total: 0 }
      groups.teaching[org.id].count += 1
      groups.teaching[org.id].total += score
    } else if (form.type === 'service_evaluation' && form.service_item_id) {
      const item = itemMap[form.service_item_id]
      const org = serviceMap[item?.service_org_id]
      if (!org) return
      groups.service[org.id] ||= { name: org.name, count: 0, total: 0 }
      groups.service[org.id].count += 1
      groups.service[org.id].total += score
    }
  })

  const toStats = (items) => Object.values(items).map((item) => ({
    name: item.name,
    count: item.count,
    avgScore: Number((item.total / item.count).toFixed(1)),
  }))
  return { teachingStats: toStats(groups.teaching), serviceStats: toStats(groups.service) }
}

export async function getScoreDistributionApi() {
  const submissions = submittedItems(await loadContext())
  const distribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    label: `${score}分`,
    count: submissions.filter((item) => Math.round(Number(item.overall_score)) === score).length,
  }))
  return distribution
}

export async function getSubmissionTrendApi() {
  const submissions = submittedItems(await loadContext())
  const monthMap = {}
  submissions.forEach((item) => {
    const date = new Date(item.submitted_at || item.created_at)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthMap[month] ||= { month, count: 0, total: 0, scored: 0 }
    monthMap[month].count += 1
    if (item.overall_score != null) {
      monthMap[month].total += Number(item.overall_score)
      monthMap[month].scored += 1
    }
  })
  return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map((item) => ({
    month: item.month,
    count: item.count,
    avgScore: item.scored ? Number((item.total / item.scored).toFixed(1)) : 0,
  }))
}

export async function getStaffEvaluationRankingApi() {
  const ctx = await loadContext()
  const submissions = submittedItems(ctx)
  const forms = Object.fromEntries((ctx.forms || []).map((item) => [item.id, item]))
  const teachers = {}
  ;(ctx.courseTeachers || []).forEach((item) => {
    if (!teachers[item.course_id]) teachers[item.course_id] = []
    teachers[item.course_id].push(item.teacher_id)
  })
  const ranking = {}
  submissions.forEach((submission) => {
    const form = forms[submission.form_id]
    if (form?.type !== 'course_evaluation') return
    ;(teachers[form.course_id] || []).forEach((teacherId) => {
      ranking[teacherId] ||= { userId: Number(teacherId), count: 0, total: 0, scored: 0 }
      ranking[teacherId].count += 1
      if (submission.overall_score != null) {
        ranking[teacherId].total += Number(submission.overall_score)
        ranking[teacherId].scored += 1
      }
    })
  })
  return Object.values(ranking).map((item) => ({
    userId: item.userId,
    name: `教职工 ${item.userId}`,
    count: item.count,
    avgScore: item.scored ? Number((item.total / item.scored).toFixed(1)) : 0,
  })).sort((a, b) => b.count - a.count).slice(0, 10)
}

export async function getFormTypeDistributionApi() {
  const ctx = await loadContext()
  const forms = Object.fromEntries((ctx.forms || []).map((item) => [item.id, item]))
  const counts = { course_evaluation: 0, service_evaluation: 0 }
  submittedItems(ctx).forEach((item) => {
    if (forms[item.form_id]?.type in counts) counts[forms[item.form_id].type] += 1
  })
  return [
    { type: 'teaching', label: '教学评价', count: counts.course_evaluation },
    { type: 'service', label: '服务评价', count: counts.service_evaluation },
    { type: 'instant', label: '即时评价', count: 0 },
  ]
}

export async function getDataOverviewAllApi() {
  const [metrics, departmentStats, scoreDistribution, submissionTrend, staffRanking, formTypeDistribution] = await Promise.all([
    getDataOverviewMetricsApi(),
    getDepartmentEvaluationStatsApi(),
    getScoreDistributionApi(),
    getSubmissionTrendApi(),
    getStaffEvaluationRankingApi(),
    getFormTypeDistributionApi(),
  ])
  return { metrics, departmentStats, scoreDistribution, submissionTrend, staffRanking, formTypeDistribution }
}
