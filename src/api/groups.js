import api from './index'

export const groupsApi = {
  getAll(params = {}) {
    return api.get('/groups', { params })
  },

  getById(id) {
    return api.get(`/groups/${id}`)
  },

  create(data) {
    return api.post('/groups/new', data)
  },

  update(id, data) {
    return api.put(`/groups/${id}`, data)
  },

  delete(id) {
    return api.delete(`/groups/${id}`)
  },

  addStudent(groupId, studentId) {
    return api.post(`/groups/${groupId}/students/${studentId}`)
  },

  removeStudent(groupId, studentId) {
    return api.delete(`/groups/${groupId}/students/${studentId}`)
  }
}
