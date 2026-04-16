export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong') {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail
  }

  if (Array.isArray(data?.errors) && data.errors.length) {
    const firstError = data.errors[0]
    if (typeof firstError === 'string' && firstError.trim()) {
      return firstError
    }
    if (typeof firstError?.message === 'string' && firstError.message.trim()) {
      return firstError.message
    }
  }

  if (typeof error?.message === 'string' && error.message.trim() && error.message !== 'Network Error') {
    return error.message
  }

  return fallbackMessage
}
