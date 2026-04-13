import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const theme = ref('dark')
  const toasts = ref([])

  let toastId = 0

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(value) {
    sidebarCollapsed.value = value
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function addToast(toast) {
    const id = ++toastId
    toasts.value.push({
      id,
      type: toast.type || 'info',
      title: toast.title,
      message: toast.message,
      duration: toast.duration || 5000
    })

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }

    return id
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function showSuccess(message, title = 'Success') {
    return addToast({ type: 'success', title, message })
  }

  function showError(message, title = 'Error') {
    return addToast({ type: 'error', title, message })
  }

  function showWarning(message, title = 'Warning') {
    return addToast({ type: 'warning', title, message })
  }

  function showInfo(message, title = 'Info') {
    return addToast({ type: 'info', title, message })
  }

  return {
    sidebarCollapsed,
    theme,
    toasts,
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    toggleTheme,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})
