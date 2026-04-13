import api from './index'

export const attendanceApi = {
  getByGroupAndDate(groupId, date) {
    return api.get(`/attendance/group/${groupId}`, { params: { date } })
  },

  getByStudent(studentId) {
    return api.get(`/attendance/student/${studentId}`)
  },

  markAttendance(groupId, data) {
    return api.post(`/attendance/group/${groupId}`, data)
  }
}
