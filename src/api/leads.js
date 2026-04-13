import api from './index'

export const leadsApi = {
  getAll(params = {}) {
    return api.get('/leads', { params })
  },

  getById(id) {
    return api.get(`/leads/${id}`)
  },

  create(data) {
    return api.post('/leads', data)
  },

  update(id, data) {
    return api.put(`/leads/${id}`, data)
  },

  updateStatus(id, status) {
    return api.patch(`/leads/${id}/status`, null, { params: { status } })
  },

  delete(id) {
    return api.delete(`/leads/${id}`)
  },

  getStats() {
    return api.get('/leads/stats')
  }
}
