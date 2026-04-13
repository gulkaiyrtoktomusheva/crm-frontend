import api from './index'

export const paymentsApi = {
  getAll(params = {}) {
    return api.get('/payments', { params })
  },

  getById(id) {
    return api.get(`/payments/${id}`)
  },

  getByStudent(studentId) {
    return api.get(`/payments/student/${studentId}`)
  },

  create(data) {
    return api.post('/payments', data)
  },

  update(id, data) {
    return api.put(`/payments/${id}`, data)
  },

  updateStatus(id, status) {
    return api.patch(`/payments/${id}/status`, null, { params: { status } })
  },

  delete(id) {
    return api.delete(`/payments/${id}`)
  },

  getOverdue() {
    return api.get('/payments/overdue')
  }
}
