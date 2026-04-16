import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'leads',
        name: 'leads',
        component: () => import('@/views/leads/LeadsView.vue'),
        meta: { title: 'Leads' }
      },
      {
        path: 'students',
        name: 'students',
        component: () => import('@/views/students/StudentsView.vue'),
        meta: { title: 'Students' }
      },
      {
        path: 'students/:id',
        name: 'student-detail',
        component: () => import('@/views/students/StudentDetailView.vue'),
        meta: { title: 'Student Profile' }
      },
      {
        path: 'courses',
        name: 'courses',
        component: () => import('@/views/courses/CoursesView.vue'),
        meta: { title: 'Courses', requiredPermission: 'COURSE_VIEW' }
      },
      {
        path: 'courses/:id',
        name: 'course-detail',
        component: () => import('@/views/courses/CourseDetailView.vue'),
        meta: { title: 'Course Details', requiredPermission: 'COURSE_VIEW' }
      },
      {
        path: 'enrollments',
        name: 'enrollments',
        component: () => import('@/views/enrollments/EnrollmentsView.vue'),
        meta: { title: 'Enrollments', requiredPermission: 'STUDENT_VIEW' }
      },
      {
        path: 'mock-exams',
        name: 'mock-exams',
        component: () => import('@/views/mockExams/MockExamsView.vue'),
        meta: { title: 'Mock Exams', requiredPermission: 'MOCK_EXAM_VIEW' }
      },
      {
        path: 'mock-exams/:id',
        name: 'mock-exam-detail',
        component: () => import('@/views/mockExams/MockExamDetailView.vue'),
        meta: { title: 'Mock Exam Results', requiredPermission: 'MOCK_EXAM_VIEW' }
      },
      {
        path: 'payments',
        name: 'payments',
        component: () => import('@/views/payments/PaymentsView.vue'),
        meta: { title: 'Payments', requiredPermission: 'PAYMENT_VIEW' }
      },
      {
        path: 'roles',
        name: 'roles',
        component: () => import('@/views/roles/RolesView.vue'),
        meta: { title: 'Roles', requiredPermission: 'ROLE_VIEW' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/users/UsersView.vue'),
        meta: { title: 'Users', requiredPermission: 'USER_VIEW' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const permissions = Array.isArray(user?.permissions || user?.authorities)
    ? (user.permissions || user.authorities)
    : []

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else if (to.meta.requiredPermission && permissions.length && !permissions.includes(to.meta.requiredPermission)) {
    next('/')
  } else {
    next()
  }
})

export default router
