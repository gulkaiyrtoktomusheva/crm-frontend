import api from './index'

export const studentCoursesApi = {
  getByStudent(studentId) {
    return api.get(`/student-courses/student/${studentId}`)
  },

  getById(id) {
    return api.get(`/student-courses/${id}`)
  },

  create(payload) {
    return api.post('/student-courses', payload)
  },

  update(id, payload) {
    return api.put(`/student-courses/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/student-courses/${id}`)
  }
}
