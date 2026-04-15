import api from './index'

export const usersApi = {
  getAll(params = {}) {
    return api.get('/users', { params })
  },

  getById(id) {
    return api.get(`/users/${id}`)
  },

  create(payload) {
    return api.post('/users', payload)
  },

  update(id, payload) {
    return api.put(`/users/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/users/${id}`)
  }
}
