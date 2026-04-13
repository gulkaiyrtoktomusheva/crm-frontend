import api from './index'

export const mockExamsApi = {
  getAll() {
    return api.get('/mock-exams')
  },

  getById(id) {
    return api.get(`/mock-exams/${id}`)
  },

  create(data) {
    return api.post('/mock-exams', data)
  },

  update(id, data) {
    return api.put(`/mock-exams/${id}`, data)
  },

  delete(id) {
    return api.delete(`/mock-exams/${id}`)
  },

  addScores(examId, data) {
    return api.post(`/mock-exams/${examId}/scores`, data)
  },

  getScores(examId) {
    return api.get(`/mock-exams/${examId}/scores`)
  },

  getStudentScores(studentId) {
    return api.get(`/mock-exams/student/${studentId}/scores`)
  }
}
