import api from './index'

export const paymentAgreementsApi = {
  getById(id) {
    return api.get(`/payment-agreements/${id}`)
  },

  getByStudent(studentId) {
    return api.get(`/payment-agreements/student/${studentId}`)
  },

  create(payload) {
    return api.post('/payment-agreements', payload)
  },

  update(id, payload) {
    return api.put(`/payment-agreements/${id}`, payload)
  },

  refreshStatus(id) {
    return api.post(`/payment-agreements/${id}/refresh-status`)
  }
}
