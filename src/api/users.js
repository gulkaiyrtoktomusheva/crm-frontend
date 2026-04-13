import api from './index'

export const usersApi = {
    getAll(params = {}) {
        return api.get('/users', { params })
    }
}