import api from './index'

export const paymentTransactionsApi = {
  getByStudent(studentId) {
    return api.get(`/payment-transactions/student/${studentId}`)
  },

  create(payload) {
    return api.post('/payment-transactions', payload)
  }
}
