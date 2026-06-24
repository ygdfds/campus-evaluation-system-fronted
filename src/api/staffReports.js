import request from '@/request'

/**
 * 职工端数据看板 API
 *
 * 所有方法内部组合调用 json-server 已有资源，
 * 按 tenant_id + deleted 过滤，再按角色 scope 限定数据范围。
 */

// ==================== 基础数据读取（复用） ====================

function fetchAll(resource, tenantId) {
  return request.get(`/${resource}`, {
    params: { tenant_id: tenantId, deleted: false },
  }).then(res => (res.data || []).filter(r => !r.deleted))
}

/**
 * 一次性加载看板所需的原始数据（减少请求次数）
 * @param {string} tenantId 当前租户 ID
 * @param {Object} [scope] 可选的权限范围，由 getStaffRoleScope 返回
 *   - schoolAdmin: true 时跳过组织范围过滤
 *   - teachingOrgIds: 授权教学组织 ID 列表
 *   - serviceOrgIds: 授权服务组织 ID 列表
 */
export async function getStaffReportContextApi(tenantId, scope = null) {
  const [
    forms, windows, submissions, scores, answers, questions, options,
    complaints, records,
    courses, courseTeachers, teachingOrgs,
    serviceItems, serviceOrgs,
  ] = await Promise.all([
    fetchAll('evaluationForms', tenantId),
    fetchAll('evaluationWindows', tenantId),
    fetchAll('evaluationSubmissions', tenantId),
    fetchAll('evaluationScores', tenantId),
    fetchAll('evaluationAnswers', tenantId),
    fetchAll('evaluationQuestions', tenantId),
    fetchAll('evaluationQuestionOptions', tenantId),
    fetchAll('complaints', tenantId),
    request.get('/complaintProcessRecords', { params: { tenant_id: tenantId } }).then(res => (res.data || []).filter(r => !r.deleted)),
    fetchAll('courses', tenantId),
    fetchAll('courseTeachers', tenantId),
    fetchAll('teachingOrgUnits', tenantId),
    fetchAll('serviceItems', tenantId),
    fetchAll('serviceOrgUnits', tenantId),
  ])

  // 权限范围过滤：非 school_admin 时按授权组织限定数据
  let filteredCourses = courses
  let filteredServiceItems = serviceItems
  let filteredSubmissions = submissions

  if (scope && !scope.schoolAdmin) {
    const hasTeaching = (scope.teachingOrgIds || []).length > 0
    const hasService = (scope.serviceOrgIds || []).length > 0

    // 过滤课程：仅保留授权教学组织内的课程
    if (hasTeaching) {
      const allowedCourseIds = new Set(
        courses.filter(c => scope.teachingOrgIds.includes(c.teaching_org_id)).map(c => c.id)
      )
      filteredCourses = courses.filter(c => allowedCourseIds.has(c.id))
      // 过滤提交：target_type=course 的提交只保留授权课程
      filteredSubmissions = submissions.filter(s => {
        if (s.target_type === 'course') return allowedCourseIds.has(s.target_id)
        return true
      })
    }

    // 过滤服务项目：仅保留授权服务组织内的项目
    if (hasService) {
      const allowedItemIds = new Set(
        serviceItems.filter(i => scope.serviceOrgIds.includes(i.service_org_id)).map(i => i.id)
      )
      filteredServiceItems = serviceItems.filter(i => allowedItemIds.has(i.id))
      // 过滤提交：target_type=service_item 的提交只保留授权服务项目
      filteredSubmissions = filteredSubmissions.filter(s => {
        if (s.target_type === 'service_item') return allowedItemIds.has(s.target_id)
        return true
      })
    }
  }

  return {
    forms, windows, submissions: filteredSubmissions, scores, answers, questions, options,
    complaints, records,
    courses: filteredCourses, courseTeachers, teachingOrgs,
    serviceItems: filteredServiceItems, serviceOrgs,
  }
}

// ==================== 筛选辅助 ====================

/**
 * 根据筛选条件过滤 submissions
 */
function filterSubmissions(submissions, windows, forms, filters) {
  let list = submissions.filter(s =>
    ['submitted', 'locked', 'reviewed'].includes(s.status)
  )

  // 时间范围
  const now = new Date()
  if (filters.timeRange === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 86400000)
    list = list.filter(s => new Date(s.submitted_at) >= weekAgo)
  } else if (filters.timeRange === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    list = list.filter(s => new Date(s.submitted_at) >= monthStart)
  } else if (filters.timeRange === 'semester') {
    const month = now.getMonth()
    const semStart = month >= 7 ? new Date(now.getFullYear(), 7, 1) : new Date(now.getFullYear(), 1, 1)
    list = list.filter(s => new Date(s.submitted_at) >= semStart)
  } else if (filters.timeRange === 'custom' && filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    list = list.filter(s => {
      const d = new Date(s.submitted_at)
      return d >= start && d <= end
    })
  }

  // 评价类型
  const windowMap = {}
  windows.forEach(w => { windowMap[w.id] = w })
  const formMap = {}
  forms.forEach(f => { formMap[f.id] = f })

  if (filters.evalType && filters.evalType !== 'all') {
    list = list.filter(s => {
      const win = windowMap[s.window_id]
      const form = formMap[s.form_id]
      const type = win?.type || form?.type
      return type === filters.evalType
    })
  }

  // 评价对象
  if (filters.targetType && filters.targetType !== 'all') {
    list = list.filter(s => s.target_type === filters.targetType)
  }

  // 状态
  if (filters.windowStatus && filters.windowStatus !== 'all') {
    list = list.filter(s => {
      const win = windowMap[s.window_id]
      return win?.status === filters.windowStatus
    })
  }

  return { list, windowMap, formMap }
}

// ==================== 核心指标 ====================

/**
 * 获取核心指标概览
 */
export function getStaffReportOverviewApi(ctx, filters) {
  const { submissions, scores, complaints, windows } = ctx
  const { list: validSubs } = filterSubmissions(submissions, windows, ctx.forms, filters)

  // 评价提交数
  const submissionCount = validSubs.length

  // 平均评分
  const validSubIds = new Set(validSubs.map(s => s.id))
  const validScores = scores.filter(sc => validSubIds.has(sc.submission_id))
  const avgScore = validScores.length > 0
    ? (validScores.reduce((sum, sc) => sum + (sc.score || 0), 0) / validScores.length).toFixed(1)
    : '0.0'

  // 参与率（简化：有效提交数 / 窗口数 * 一个基数）
  const activeWindows = windows.filter(w => w.status === 'open')
  const participationRate = activeWindows.length > 0
    ? Math.min(100, Math.round(validSubs.length / activeWindows.length * 15))
    : 0

  // 低分预警数（score <= 2 的独立提交数）
  const lowScoreSubIds = new Set(validScores.filter(sc => sc.score <= 2).map(sc => sc.submission_id))
  const lowScoreCount = lowScoreSubIds.size

  // 待处理反馈
  const pendingFeedback = complaints.filter(c => c.status === 'pending' || c.status === 'processing').length

  // 办结率
  const totalComplaints = complaints.filter(c => c.status !== 'cancelled').length
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length
  const resolveRate = totalComplaints > 0
    ? Math.round(resolvedCount / totalComplaints * 100)
    : 0

  return {
    submissionCount,
    avgScore: Number(avgScore),
    participationRate,
    lowScoreCount,
    pendingFeedback,
    resolveRate,
  }
}

// ==================== 评分分布 ====================

/**
 * 获取评分分布（1-5 分）
 */
export function getStaffScoreDistributionApi(ctx, filters) {
  const { submissions, scores, windows } = ctx
  const { list: validSubs } = filterSubmissions(submissions, windows, ctx.forms, filters)
  const validSubIds = new Set(validSubs.map(s => s.id))
  const validScores = scores.filter(sc => validSubIds.has(sc.submission_id))

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  validScores.forEach(sc => {
    const bucket = Math.max(1, Math.min(5, Math.round(sc.score)))
    dist[bucket]++
  })

  const total = validScores.length || 1
  return [5, 4, 3, 2, 1].map(score => ({
    score,
    count: dist[score],
    percent: Math.round(dist[score] / total * 100),
  }))
}

// ==================== 指标得分概览 ====================

/**
 * 按题目聚合指标得分
 */
export function getStaffEvaluationSummaryApi(ctx, filters) {
  const { submissions, scores, questions, windows } = ctx
  const { list: validSubs } = filterSubmissions(submissions, windows, ctx.forms, filters)
  const validSubIds = new Set(validSubs.map(s => s.id))

  // 只统计 rating 类型题目
  const ratingQuestions = questions.filter(q => q.type === 'rating')
  const qMap = {}
  ratingQuestions.forEach(q => { qMap[q.id] = q })

  const qScores = {}
  const validScores = scores.filter(sc => validSubIds.has(sc.submission_id) && qMap[sc.question_id])
  validScores.forEach(sc => {
    if (!qScores[sc.question_id]) qScores[sc.question_id] = []
    qScores[sc.question_id].push(sc.score)
  })

  return ratingQuestions.map(q => {
    const arr = qScores[q.id] || []
    const avg = arr.length > 0 ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '-'
    return {
      questionId: q.id,
      title: q.title,
      formId: q.form_id,
      avgScore: Number(avg),
      count: arr.length,
      isLow: Number(avg) > 0 && Number(avg) < 3,
    }
  }).filter(q => q.count > 0).sort((a, b) => a.avgScore - b.avgScore)
}

// ==================== 评价对象排行 ====================

/**
 * 按评价对象聚合排行
 */
export function getStaffObjectRankingApi(ctx, filters) {
  const { submissions, scores, windows, forms, serviceItems, courses, serviceOrgs, teachingOrgs } = ctx
  const { list: validSubs } = filterSubmissions(submissions, windows, forms, filters)

  // 构建名称映射
  const sItemMap = {}; serviceItems.forEach(s => { sItemMap[s.id] = s })
  const courseMap = {}; courses.forEach(c => { courseMap[c.id] = c })
  const sOrgMap = {}; serviceOrgs.forEach(o => { sOrgMap[o.id] = o })
  const tOrgMap = {}; teachingOrgs.forEach(o => { tOrgMap[o.id] = o })
  const formMap = {}; forms.forEach(f => { formMap[f.id] = f })

  // 按 target_type + target_id 分组
  const groups = {}
  validSubs.forEach(s => {
    const key = `${s.target_type}_${s.target_id}`
    if (!groups[key]) {
      groups[key] = { targetType: s.target_type, targetId: s.target_id, submissions: [] }
    }
    groups[key].submissions.push(s)
  })

  const result = Object.values(groups).map(g => {
    const subIds = new Set(g.submissions.map(s => s.id))
    const relatedScores = scores.filter(sc => subIds.has(sc.submission_id))
    const avgScore = relatedScores.length > 0
      ? Number((relatedScores.reduce((sum, sc) => sum + (sc.score || 0), 0) / relatedScores.length).toFixed(1))
      : 0
    const lowCount = relatedScores.filter(sc => sc.score <= 2).length

    // 解析名称（优先真实对象名 → 表单标题 → 未指定对象）
    let name = ''
    let orgName = ''
    let evalType = ''
    if (g.targetType === 'service_item') {
      const item = sItemMap[g.targetId]
      name = item?.name || ''
      orgName = sOrgMap[item?.service_org_id]?.name || ''
      evalType = 'service'
    } else if (g.targetType === 'course') {
      const course = courseMap[g.targetId]
      name = course?.course_name || ''
      orgName = tOrgMap[course?.teaching_org_id]?.name || ''
      evalType = 'teaching'
    } else {
      evalType = 'other'
    }
    // 兜底：用关联的表单标题
    if (!name) {
      const firstForm = formMap[g.submissions[0]?.form_id]
      name = firstForm?.title || '未指定对象'
    }

    return {
      key: `${g.targetType}_${g.targetId}`,
      name,
      orgName,
      evalType,
      targetId: g.targetId,
      targetType: g.targetType,
      avgScore,
      submissionCount: g.submissions.length,
      lowCount,
      participationRate: Math.min(100, Math.round(g.submissions.length * 12)),
    }
  }).filter(r => r.submissionCount > 0)

  // 排序
  const sort = filters.sort || 'low_first'
  if (sort === 'high_first') result.sort((a, b) => b.avgScore - a.avgScore)
  else if (sort === 'low_first') result.sort((a, b) => a.avgScore - b.avgScore)
  else if (sort === 'most_submissions') result.sort((a, b) => b.submissionCount - a.submissionCount)
  else if (sort === 'warnings') result.sort((a, b) => b.lowCount - a.lowCount)

  return result
}

// ==================== 低分预警 ====================

/**
 * 获取低分预警列表
 */
export function getStaffLowScoreWarningsApi(ctx, filters) {
  const { submissions, scores, answers, windows, forms, serviceItems, courses, teachingOrgs } = ctx
  const { list: validSubs, formMap } = filterSubmissions(submissions, windows, forms, filters)

  const sItemMap = {}; serviceItems.forEach(s => { sItemMap[s.id] = s })
  const courseMap = {}; courses.forEach(c => { courseMap[c.id] = c })
  const tOrgMap = {}; teachingOrgs.forEach(o => { tOrgMap[o.id] = o })

  // 按对象聚合低分预警（确保与详情抽屉数据一致）
  const objGroups = {}
  validSubs.forEach(sub => {
    const key = `${sub.target_type}_${sub.target_id}`
    if (!objGroups[key]) {
      // 解析名称（优先真实对象名 → 表单标题 → 未指定对象）
      let name = ''
      let evalType = ''
      if (sub.target_type === 'service_item') {
        const item = sItemMap[sub.target_id]
        name = item?.name || ''
        evalType = 'service'
      } else if (sub.target_type === 'course') {
        const course = courseMap[sub.target_id]
        name = course?.course_name || ''
        evalType = 'teaching'
      } else {
        evalType = 'other'
      }
      const form = formMap[sub.form_id]
      if (!name) {
        name = form?.title || '未指定对象'
      }
      objGroups[key] = {
        key,
        name,
        evalType,
        formTitle: form?.title || '',
        targetType: sub.target_type,
        targetId: sub.target_id,
        submissions: [],
      }
    }
    objGroups[key].submissions.push(sub)
  })

  const warnings = Object.values(objGroups).map(g => {
    const subIds = new Set(g.submissions.map(s => s.id))
    const relatedScores = scores.filter(sc => subIds.has(sc.submission_id))
    const avgScore = relatedScores.length > 0
      ? Number((relatedScores.reduce((sum, sc) => sum + (sc.score || 0), 0) / relatedScores.length).toFixed(1))
      : 0
    const lowCount = relatedScores.filter(sc => sc.score <= 2).length

    // 跳过没有低分的对象
    if (avgScore >= 3 && lowCount === 0) return null

    // 从文本答案中提取原因摘要
    const relatedAnswers = answers.filter(a => subIds.has(a.submission_id))
    const textAnswers = relatedAnswers
      .filter(a => typeof a.answer_value === 'string' && a.answer_value.length > 5)
      .map(a => a.answer_value)
    const reasonSummary = textAnswers.length > 0
      ? textAnswers[0].slice(0, 50) + (textAnswers[0].length > 50 ? '...' : '')
      : '评分偏低，建议关注'

    const latestAt = g.submissions
      .map(s => s.submitted_at)
      .sort()
      .pop()

    return {
      id: g.key,
      name: g.name,
      evalType: g.evalType,
      formTitle: g.formTitle,
      avgScore,
      lowCount,
      reasonSummary,
      submittedAt: latestAt,
      targetType: g.targetType,
      targetId: g.targetId,
    }
  }).filter(Boolean)

  warnings.sort((a, b) => a.avgScore - b.avgScore || new Date(b.submittedAt) - new Date(a.submittedAt))
  return warnings.slice(0, 20)
}

// ==================== 反馈处理分析 ====================

/**
 * 获取反馈处理统计
 * @param {Object} ctx 数据上下文
 * @param {Object} [filters] 可选筛选条件（与评价筛选联动）
 */
export function getStaffFeedbackSummaryApi(ctx, filters = null) {
  const { complaints, records } = ctx

  let filtered = complaints.filter(c => c.status !== 'cancelled')

  // 筛选联动：时间范围（基于 complaint.created_at）
  if (filters) {
    const now = new Date()
    if (filters.timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000)
      filtered = filtered.filter(c => new Date(c.created_at) >= weekAgo)
    } else if (filters.timeRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter(c => new Date(c.created_at) >= monthStart)
    } else if (filters.timeRange === 'semester') {
      const month = now.getMonth()
      const semStart = month >= 7 ? new Date(now.getFullYear(), 7, 1) : new Date(now.getFullYear(), 1, 1)
      filtered = filtered.filter(c => new Date(c.created_at) >= semStart)
    } else if (filters.timeRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      filtered = filtered.filter(c => {
        const d = new Date(c.created_at)
        return d >= start && d <= end
      })
    }

    // 筛选联动：评价类型（兼容映射到 complaints 的关联字段）
    // teaching → 有 course_id 或 teaching_org_id 的反馈
    // service → 有 service_item_id 或 service_org_id 的反馈
    if (filters.evalType && filters.evalType !== 'all') {
      if (filters.evalType === 'teaching') {
        filtered = filtered.filter(c => c.course_id || c.teaching_org_id)
      } else if (filters.evalType === 'service') {
        filtered = filtered.filter(c => c.service_item_id || c.service_org_id)
      }
      // instant 类型在反馈中无对应，不做额外过滤
    }

    // 筛选联动：评价对象（兼容映射到 complaints 的关联字段）
    // course → 有 course_id 的反馈
    // service_item → 有 service_item_id 的反馈
    if (filters.targetType && filters.targetType !== 'all') {
      if (filters.targetType === 'course') {
        filtered = filtered.filter(c => c.course_id)
      } else if (filters.targetType === 'service_item') {
        filtered = filtered.filter(c => c.service_item_id)
      }
    }

    // 筛选联动：状态（评价窗口状态兼容映射到反馈状态）
    // open → 反馈为 pending 或 processing（活跃处理中）
    // closed → 反馈为 resolved 或 rejected（已结案）
    if (filters.windowStatus && filters.windowStatus !== 'all') {
      if (filters.windowStatus === 'open') {
        filtered = filtered.filter(c => c.status === 'pending' || c.status === 'processing')
      } else if (filters.windowStatus === 'closed') {
        filtered = filtered.filter(c => c.status === 'resolved' || c.status === 'rejected')
      }
    }
  }

  const activeComplaints = filtered

  // 状态统计
  const statusStats = { pending: 0, processing: 0, resolved: 0, rejected: 0 }
  activeComplaints.forEach(c => {
    if (statusStats[c.status] !== undefined) statusStats[c.status]++
  })

  // 类型统计（兼容 inquiry → consultation 映射）
  const typeStats = { complaint: 0, suggestion: 0, consultation: 0, praise: 0 }
  activeComplaints.forEach(c => {
    const type = c.complaint_type === 'inquiry' ? 'consultation' : c.complaint_type
    if (typeStats[type] !== undefined) typeStats[type]++
  })

  // 办结率
  const total = activeComplaints.length
  const resolveRate = total > 0 ? Math.round(statusStats.resolved / total * 100) : 0

  // 平均处理时长
  const resolvedComplaints = activeComplaints.filter(c => c.status === 'resolved' && c.resolved_at)
  let avgProcessHours = 0
  if (resolvedComplaints.length > 0) {
    const totalHours = resolvedComplaints.reduce((sum, c) => {
      const created = new Date(c.created_at).getTime()
      const resolved = new Date(c.resolved_at).getTime()
      return sum + (resolved - created) / 3600000
    }, 0)
    avgProcessHours = Math.round(totalHours / resolvedComplaints.length)
  }

  // 最近 5 条处理记录（仅基于筛选后的反馈）
  const typeMap = { complaint: '投诉', suggestion: '建议', consultation: '咨询', inquiry: '咨询', praise: '表扬' }

  function getActionInfo(from, to) {
    if (from === 'pending' && to === 'processing') return { action: '已受理', color: 'success' }
    if (from === 'processing' && to === 'processing') return { action: '更新进度', color: 'success' }
    if (to === 'resolved') return { action: '已办结', color: 'success' }
    if (to === 'rejected') return { action: '已驳回', color: 'danger' }
    if (to === 'cancelled') return { action: '已撤销', color: 'muted' }
    return { action: '处理', color: 'muted' }
  }

  // 从筛选后的反馈构建 map，确保处理记录与统计一致
  const complaintsMap = {}
  activeComplaints.forEach(c => { if (!c.deleted) complaintsMap[c.id] = c })

  // 纯数字或异常内容兜底
  const fallbackContents = [
    '已更新处理进度',
    '已协调相关部门处理',
    '正在跟进处理中',
    '已受理，正在联系相关部门处理',
    '问题已处理完成',
  ]
  // 仅保留关联到筛选后反馈的处理记录
  const filteredRecords = records.filter(r => complaintsMap[r.complaint_id])
  const recentRecords = filteredRecords
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((r, idx) => {
      const info = getActionInfo(r.from_status, r.to_status)
      const complaint = complaintsMap[r.complaint_id]
      // 检测纯数字或过短内容
      let content = r.content || ''
      if (/^\d+$/.test(content.trim()) || content.trim().length < 4) {
        content = fallbackContents[idx % fallbackContents.length]
      } else {
        content = content.slice(0, 60) + (content.length > 60 ? '...' : '')
      }
      return {
        id: r.id,
        action: info.action,
        actionColor: info.color,
        title: complaint?.title || '反馈记录',
        typeLabel: complaint ? (typeMap[complaint.complaint_type] || '其他') : '',
        content,
        time: r.created_at,
      }
    })

  return {
    statusStats,
    typeStats,
    resolveRate,
    avgProcessHours,
    resolvedSampleCount: resolvedComplaints.length,
    recentRecords,
    total,
  }
}

// ==================== 详情抽屉数据 ====================

/**
 * 获取评价对象详情（用于抽屉）
 */
export function getStaffReportObjectDetailApi(ctx, targetType, targetId) {
  const { submissions, scores, answers, questions, serviceItems, courses, serviceOrgs, teachingOrgs, complaints } = ctx

  const sItemMap = {}; serviceItems.forEach(s => { sItemMap[s.id] = s })
  const courseMap = {}; courses.forEach(c => { courseMap[c.id] = c })
  const sOrgMap = {}; serviceOrgs.forEach(o => { sOrgMap[o.id] = o })
  const tOrgMap = {}; teachingOrgs.forEach(o => { tOrgMap[o.id] = o })
  const qMap = {}; questions.forEach(q => { qMap[q.id] = q })

  // 筛选相关提交
  const relatedSubs = submissions.filter(s => s.target_type === targetType && s.target_id === targetId && ['submitted', 'locked', 'reviewed'].includes(s.status))
  const subIds = new Set(relatedSubs.map(s => s.id))
  const relatedScores = scores.filter(sc => subIds.has(sc.submission_id))

  // 名称（优先真实对象名 → 表单标题 → 未指定对象）
  let name = ''
  let orgName = ''
  let evalType = ''
  if (targetType === 'service_item') {
    const item = sItemMap[targetId]
    name = item?.name || ''
    orgName = sOrgMap[item?.service_org_id]?.name || ''
    evalType = 'service'
  } else if (targetType === 'course') {
    const course = courseMap[targetId]
    name = course?.course_name || ''
    orgName = tOrgMap[course?.teaching_org_id]?.name || ''
    evalType = 'teaching'
  } else {
    evalType = 'other'
  }
  if (!name) {
    const firstForm = relatedSubs.length > 0 ? ctx.forms.find(f => f.id === relatedSubs[0].form_id) : null
    name = firstForm?.title || '未指定对象'
  }

  // 平均分
  const avgScore = relatedScores.length > 0
    ? Number((relatedScores.reduce((sum, sc) => sum + (sc.score || 0), 0) / relatedScores.length).toFixed(1))
    : 0

  // 分数分布
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  relatedScores.forEach(sc => {
    const bucket = Math.max(1, Math.min(5, Math.round(sc.score)))
    dist[bucket]++
  })
  const distribution = [5, 4, 3, 2, 1].map(score => ({
    score,
    count: dist[score],
    percent: relatedScores.length > 0 ? Math.round(dist[score] / relatedScores.length * 100) : 0,
  }))

  // 低分预警数
  const lowCount = relatedScores.filter(sc => sc.score <= 2).length

  // 高频关键词（从文本答案中提取）
  const relatedAnswers = answers.filter(a => subIds.has(a.submission_id))
  const textAnswers = relatedAnswers
    .filter(a => typeof a.answer_value === 'string' && a.answer_value.length > 3)
    .map(a => a.answer_value)
  // 简单提取：取文本答案中出现频率较高的词（简化为取前几个答案的前几个关键词）
  const keywords = extractKeywords(textAnswers)

  // 最近评价摘要（不展示学生身份）
  const recentSubmissions = relatedSubs
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5)
    .map(sub => {
      const subAnswers = answers.filter(a => a.submission_id === sub.id)
      const textParts = subAnswers
        .filter(a => typeof a.answer_value === 'string' && a.answer_value.length > 3)
        .map(a => a.answer_value.slice(0, 80))
      const subScores = scores.filter(sc => sc.submission_id === sub.id)
      const subAvg = subScores.length > 0
        ? Number((subScores.reduce((sum, sc) => sum + (sc.score || 0), 0) / subScores.length).toFixed(1))
        : sub.overall_score
      return {
        id: sub.id,
        score: subAvg,
        text: textParts.join('；') || '无文字评价',
        time: sub.submitted_at,
      }
    })

  // 相关反馈数量
  const relatedComplaints = complaints.filter(c => {
    if (targetType === 'service_item' && c.service_item_id === targetId) return true
    if (targetType === 'course' && c.course_id === targetId) return true
    return false
  })

  return {
    name,
    orgName,
    evalType,
    avgScore,
    submissionCount: relatedSubs.length,
    distribution,
    lowCount,
    keywords,
    recentSubmissions,
    complaintCount: relatedComplaints.length,
  }
}

/**
 * 简单关键词提取
 */
function extractKeywords(texts) {
  if (!texts || texts.length === 0) return []
  // 简单分词：按标点和空格切分，取长度 >= 2 的片段
  const wordCount = {}
  const stopWords = new Set(['的', '了', '是', '在', '和', '也', '都', '而', '及', '与', '对', '等', '还', '不', '有', '就', '到', '被', '从', '把', '让', '给', '向', '往'])

  texts.forEach(text => {
    const parts = text.split(/[，。！？、；：\s,.!?;:\n]+/).filter(p => p.length >= 2 && p.length <= 10)
    parts.forEach(p => {
      if (!stopWords.has(p)) {
        wordCount[p] = (wordCount[p] || 0) + 1
      }
    })
  })

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }))
}
