import api from './index'

export const studentsApi = {
  getAll(params = {}) {
    return api.get('/students', { params })
  },

  getById(id) {
    return api.get(`/students/${id}`)
  },

  getFinance(id) {
    return api.get(`/students/${id}/finance`)
  },

  create(data) {
    return api.post('/students/create', data)
  },

  update(id, data) {
    return api.put(`/students/${id}`, data)
  },

  delete(id) {
    return api.delete(`/students/${id}`)
  }
}
