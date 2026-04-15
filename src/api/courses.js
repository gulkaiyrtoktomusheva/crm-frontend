import api from './index'

export const coursesApi = {
  getAll() {
    return api.get('/courses')
  },

  getById(id) {
    return api.get(`/courses/${id}`)
  },

  create(payload) {
    return api.post('/courses', payload)
  },

  update(id, payload) {
    return api.put(`/courses/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/courses/${id}`)
  }
}
