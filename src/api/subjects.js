import api from './index'

export const subjectsApi = {
  getAll() {
    return api.get('/subjects')
  },

  create(data) {
    return api.post('/subjects', data)
  },

  delete(id) {
    return api.delete(`/subjects/${id}`)
  }
}
