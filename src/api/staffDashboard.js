import request from '@/request'
import { dataOf } from '@/api/backend'

export async function getStaffTodoStatsApi() {
  return dataOf(await request.get('/stats/staff/dashboard/todos')) || {
    pendingForms: 0,
    pendingFeedback: 0,
    activeWindows: 0,
    pendingAppeals: 0,
  }
}

export async function getStaffActiveWindowsApi() {
  return dataOf(await request.get('/stats/staff/dashboard/active-windows')) || []
}

export async function getStaffPendingFeedbackApi() {
  return dataOf(await request.get('/stats/staff/dashboard/pending-feedback')) || []
}

export async function getStaffPendingAppealsApi() {
  return dataOf(await request.get('/stats/staff/dashboard/pending-appeals')) || []
}

export async function getStaffEvalSummaryApi() {
  return dataOf(await request.get('/stats/staff/dashboard/evaluation-summary')) || {
    monthCount: 0,
    avgScore: 0,
    participationRate: 0,
    lowScoreCount: 0,
  }
}
