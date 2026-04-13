import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { leadsApi } from '@/api/leads'
import { useAppStore } from './app'

export const useLeadsStore = defineStore('leads', () => {
  const leads = ref([])
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const appStore = useAppStore()

  const leadsByStatus = computed(() => {
    const grouped = {
      NEW: [],
      CONTACTED: [],
      THINKING: [],
      PAID: [],
      REJECTED: []
    }
    leads.value.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead)
      }
    })
    return grouped
  })

  async function fetchLeads(params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await leadsApi.getAll({ ...params, size: 100 })
      leads.value = response.content || response
      return response
    } catch (err) {
      error.value = err.message
      appStore.showError('Failed to load leads')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      stats.value = await leadsApi.getStats()
      return stats.value
    } catch (err) {
      appStore.showError('Failed to load lead stats')
      throw err
    }
  }

  async function createLead(data) {
    loading.value = true
    try {
      const newLead = await leadsApi.create(data)
      leads.value.unshift(newLead)
      appStore.showSuccess('Lead created successfully')
      return newLead
    } catch (err) {
      appStore.showError('Failed to create lead')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLead(id, data) {
    loading.value = true
    try {
      const updatedLead = await leadsApi.update(id, data)
      const index = leads.value.findIndex(l => l.id === id)
      if (index > -1) {
        leads.value[index] = updatedLead
      }
      appStore.showSuccess('Lead updated successfully')
      return updatedLead
    } catch (err) {
      appStore.showError('Failed to update lead')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLeadStatus(id, status) {
    try {
      const updatedLead = await leadsApi.updateStatus(id, status)
      const index = leads.value.findIndex(l => l.id === id)
      if (index > -1) {
        leads.value[index] = updatedLead
      }
      return updatedLead
    } catch (err) {
      appStore.showError('Failed to update lead status')
      throw err
    }
  }

  async function deleteLead(id) {
    loading.value = true
    try {
      await leadsApi.delete(id)
      leads.value = leads.value.filter(l => l.id !== id)
      appStore.showSuccess('Lead deleted successfully')
    } catch (err) {
      appStore.showError('Failed to delete lead')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    leads,
    stats,
    loading,
    error,
    leadsByStatus,
    fetchLeads,
    fetchStats,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead
  }
})
