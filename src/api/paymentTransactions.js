import api from './index'

export const paymentTransactionsApi = {
  getAll(params = {}) {
    return api.get('/payment-transactions', { params })
  },

  getByStudent(studentId) {
    return api.get(`/payment-transactions/student/${studentId}`)
  },

  create(payload) {
    return api.post('/payment-transactions', payload)
  }
}
