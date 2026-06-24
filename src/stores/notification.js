import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStaffNotificationSummaryApi } from '@/api/staffNotifications'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const summary = ref({})
  const loaded = ref(false)

  async function fetchUnreadCount(userContext) {
    if (!userContext?.tenantId || !userContext?.userId) return
    try {
      const res = await getStaffNotificationSummaryApi(userContext)
      summary.value = res
      unreadCount.value = res.unread || 0
      loaded.value = true
    } catch (e) {
      console.error('获取未读数失败:', e)
    }
  }

  function setUnreadCount(count) {
    unreadCount.value = Math.max(0, count)
  }

  function reset() {
    unreadCount.value = 0
    summary.value = {}
    loaded.value = false
  }

  return {
    unreadCount,
    summary,
    loaded,
    fetchUnreadCount,
    setUnreadCount,
    reset,
  }
})
