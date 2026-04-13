import { ref } from 'vue'

const isOpen = ref(false)
const title = ref('')
const message = ref('')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')
const variant = ref('danger')
let resolvePromise = null

export function useConfirm() {
  function confirm(options = {}) {
    title.value = options.title || 'Confirm'
    message.value = options.message || 'Are you sure?'
    confirmText.value = options.confirmText || 'Confirm'
    cancelText.value = options.cancelText || 'Cancel'
    variant.value = options.variant || 'danger'
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  function handleCancel() {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    confirm,
    handleConfirm,
    handleCancel
  }
}
