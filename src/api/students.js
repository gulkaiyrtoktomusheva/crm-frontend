import api from './index'

export const studentsApi = {
  getAll(params = {}) {
    return api.get('/students', { params })
  },

  getById(id) {
    return api.get(`/students/${id}`)
  },

  create(data) {
    return api.post('/students', data)
  },

  update(id, data) {
    return api.put(`/students/${id}`, data)
  },

  delete(id) {
    return api.delete(`/students/${id}`)
  }
}
