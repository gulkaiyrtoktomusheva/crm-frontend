import { useAppStore } from '@/stores/app'

export function useToast() {
  const appStore = useAppStore()

  return {
    success: (message, title) => appStore.showSuccess(message, title),
    error: (message, title) => appStore.showError(message, title),
    warning: (message, title) => appStore.showWarning(message, title),
    info: (message, title) => appStore.showInfo(message, title),
    remove: (id) => appStore.removeToast(id)
  }
}
