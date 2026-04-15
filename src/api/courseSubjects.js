import api from './index'

export const courseSubjectsApi = {
  getByCourse(courseId) {
    return api.get(`/course-subjects/course/${courseId}`)
  },

  getById(id) {
    return api.get(`/course-subjects/${id}`)
  },

  create(courseId, payload) {
    return api.post(`/course-subjects/course/${courseId}`, payload)
  },

  update(id, payload) {
    return api.put(`/course-subjects/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/course-subjects/${id}`)
  }
}
