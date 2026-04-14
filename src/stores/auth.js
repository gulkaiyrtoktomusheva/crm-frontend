import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isManager = computed(() => user.value?.role === 'MANAGER')
  const isTeacher = computed(() => user.value?.role === 'TEACHER')
  const permissions = computed(() => {
    const rawPermissions = user.value?.permissions || user.value?.authorities || []
    return Array.isArray(rawPermissions) ? rawPermissions : []
  })

  function extractPermissions(response) {
    const sources = [
      response?.permissions,
      response?.authorities,
      response?.user?.permissions,
      response?.user?.authorities,
      response?.role?.permissions
    ]

    const firstList = sources.find((value) => Array.isArray(value))
    return firstList || []
  }

  function hasPermission(permission) {
    if (!permission) {
      return true
    }

    if (!isAuthenticated.value) {
      return false
    }

    if (!permissions.value.length) {
      return true
    }

    return permissions.value.includes(permission)
  }

  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials)
      token.value = response.token
      user.value = {
        id: response.userId ?? response.user?.id,
        email: response.email ?? response.user?.email,
        fullName: response.fullName ?? response.user?.fullName,
        role: response.role?.name ?? response.role ?? response.user?.role?.name ?? response.user?.role,
        permissions: extractPermissions(response)
      }
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(user.value))
      router.push('/')
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(userData)
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isManager,
    isTeacher,
    permissions,
    hasPermission,
    login,
    register,
    logout
  }
})
