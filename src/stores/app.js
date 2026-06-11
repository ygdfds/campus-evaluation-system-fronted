import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false)

  // 消息角标计数
  const unreadCount = ref(0)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(val) {
    sidebarCollapsed.value = val
  }

  function setUnreadCount(count) {
    unreadCount.value = count
  }

  return {
    sidebarCollapsed,
    unreadCount,
    toggleSidebar,
    setSidebarCollapsed,
    setUnreadCount,
  }
})
