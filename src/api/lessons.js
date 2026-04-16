import api from './index'

export const lessonsApi = {
  getByCourse(courseId) {
    return api.get(`/lessons/course/${courseId}`)
  },

  getByCourseSubject(courseSubjectId) {
    return api.get(`/lessons/course-subject/${courseSubjectId}`)
  },

  getAttendanceByLesson(lessonId) {
    return api.get(`/lessons/${lessonId}/attendance`)
  },

  create(payload) {
    return api.post('/lessons', payload)
  },

  update(id, payload) {
    return api.put(`/lessons/${id}`, payload)
  },

  markAttendance(lessonId, payload) {
    return api.post(`/lessons/${lessonId}/attendance`, payload)
  }
}
