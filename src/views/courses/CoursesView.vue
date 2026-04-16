<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BookOpen, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import CourseFormModal from '@/components/courses/CourseFormModal.vue'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const courses = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const modalLoading = ref(false)
const editingCourse = ref(null)

const filteredCourses = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return courses.value

  return courses.value.filter((course) => {
    const haystack = [course.name, course.status].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

const courseStats = computed(() => {
  const total = courses.value.length
  const active = courses.value.filter((course) => course.status === 'ACTIVE').length
  const planned = courses.value.filter((course) => course.status === 'PLANNED').length
  const completed = courses.value.filter((course) => course.status === 'COMPLETED').length

  return { total, active, planned, completed }
})

const canCreate = computed(() => authStore.hasPermission('COURSE_CREATE'))
const canUpdate = computed(() => authStore.hasPermission('COURSE_UPDATE'))
const canDelete = computed(() => authStore.hasPermission('COURSE_DELETE'))

onMounted(fetchCourses)

async function fetchCourses() {
  loading.value = true
  try {
    courses.value = await coursesApi.getAll()
  } catch (error) {
    toast.error(t('courses.failedLoad'))
  } finally {
    loading.value = false
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ru-RU')
}

function formatCurrency(value) {
  if (!value) return `0 ${t('common.currency')}`
  return `${new Intl.NumberFormat('ru-RU').format(value)} ${t('common.currency')}`
}

function getStatusLabel(status) {
  const labels = {
    PLANNED: t('courses.statusPlanned'),
    ACTIVE: t('courses.statusActive'),
    COMPLETED: t('courses.statusCompleted'),
    CANCELLED: t('courses.statusCancelled')
  }

  return labels[status] || status || '-'
}

function getStatusClass(status) {
  const classes = {
    PLANNED: 'course-status course-status-planned',
    ACTIVE: 'course-status course-status-active',
    COMPLETED: 'course-status course-status-completed',
    CANCELLED: 'course-status course-status-cancelled'
  }

  return classes[status] || 'course-status'
}

function openCreateModal() {
  editingCourse.value = null
  showModal.value = true
}

function openEditModal(course) {
  editingCourse.value = course
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCourse.value = null
}

function viewCourse(course) {
  router.push(`/courses/${course.id}`)
}

async function handleSubmit(payload) {
  modalLoading.value = true
  try {
    if (editingCourse.value) {
      await coursesApi.update(editingCourse.value.id, payload)
      toast.success(t('courses.courseUpdated'))
    } else {
      await coursesApi.create(payload)
      toast.success(t('courses.courseCreated'))
    }

    closeModal()
    await fetchCourses()
  } catch (error) {
    toast.error(t('courses.failedSave'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(course) {
  const confirmed = await confirm.confirm({
    title: t('courses.deleteCourse'),
    message: t('courses.deleteConfirm', { name: course.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) return

  try {
    await coursesApi.delete(course.id)
    toast.success(t('courses.courseDeleted'))
    await fetchCourses()
  } catch (error) {
    toast.error(t('courses.failedDelete'))
  }
}
</script>

<template>
  <div class="course-page">
    <section class="course-hero">
      <div>
        <p class="course-overline">ACADEMIC OPERATIONS</p>
        <h1 class="course-title">{{ t('courses.title') }}</h1>
        <p class="course-subtitle">
          Управление расписанием курсов, ценой и текущим набором в едином рабочем реестре.
        </p>
      </div>

      <button
        v-if="canCreate"
        type="button"
        class="course-primary-button"
        @click="openCreateModal"
      >
        <Plus class="h-4 w-4" />
        <span>{{ t('courses.newCourse') }}</span>
      </button>
    </section>

    <section class="course-stats-grid">
      <article class="course-stat-card">
        <span class="course-stat-label">{{ t('courses.title') }}</span>
        <strong class="course-stat-value">{{ courseStats.total }}</strong>
        <span class="course-stat-hint">{{ t('courses.coursesCount', { count: courseStats.total }) }}</span>
      </article>

      <article class="course-stat-card">
        <span class="course-stat-label">{{ t('courses.statusActive') }}</span>
        <strong class="course-stat-value">{{ courseStats.active }}</strong>
        <span class="course-stat-hint">Идут сейчас</span>
      </article>

      <article class="course-stat-card">
        <span class="course-stat-label">{{ t('courses.statusPlanned') }}</span>
        <strong class="course-stat-value">{{ courseStats.planned }}</strong>
        <span class="course-stat-hint">Ожидают запуска</span>
      </article>

      <article class="course-stat-card">
        <span class="course-stat-label">{{ t('courses.statusCompleted') }}</span>
        <strong class="course-stat-value">{{ courseStats.completed }}</strong>
        <span class="course-stat-hint">Завершены</span>
      </article>
    </section>

    <section class="course-panel">
      <div class="course-toolbar">
        <div class="course-search-wrap">
          <Search class="course-search-icon" />
          <input
            v-model="search"
            type="text"
            :placeholder="t('courses.searchCourses')"
            class="course-search-input"
          />
        </div>

        <div class="course-toolbar-meta">
          <span class="course-toolbar-count">
            {{ filteredCourses.length }} записей
          </span>
        </div>
      </div>

      <div class="course-table-wrap">
        <table class="course-table">
          <thead>
            <tr>
              <th>{{ t('courses.course') }}</th>
              <th>{{ t('courses.period') }}</th>
              <th>{{ t('courses.price') }}</th>
              <th>{{ t('courses.status') }}</th>
              <th class="course-actions-head">Actions</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr v-for="i in 6" :key="i">
              <td colspan="5">
                <div class="course-loading-row">
                  <div class="course-loading-line course-loading-line-wide" />
                  <div class="course-loading-line" />
                </div>
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredCourses.length === 0">
            <tr>
              <td colspan="5" class="course-empty">
                <BookOpen class="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p>{{ t('courses.noCourses') }}</p>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="course in filteredCourses" :key="course.id">
              <td>
                <div class="course-cell-main">
                  <div class="course-icon-box">
                    <BookOpen class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="course-name">{{ course.name }}</p>
                    <p class="course-meta">Course ID {{ course.id }}</p>
                  </div>
                </div>
              </td>

              <td>
                <div class="course-date-block">
                  <span>{{ formatDate(course.startDate) }}</span>
                  <span class="course-date-separator">-</span>
                  <span>{{ formatDate(course.endDate) }}</span>
                </div>
              </td>

              <td>
                <span class="course-price">{{ formatCurrency(course.price) }}</span>
              </td>

              <td>
                <span :class="getStatusClass(course.status)">
                  {{ getStatusLabel(course.status) }}
                </span>
              </td>

              <td>
                <div class="course-actions">
                  <button
                    type="button"
                    class="course-icon-action"
                    title="Open course"
                    @click="viewCourse(course)"
                  >
                    <Eye class="h-4 w-4" />
                  </button>

                  <button
                    v-if="canUpdate"
                    type="button"
                    class="course-icon-action"
                    title="Edit course"
                    @click="openEditModal(course)"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>

                  <button
                    v-if="canDelete"
                    type="button"
                    class="course-icon-action course-icon-action-danger"
                    title="Delete course"
                    @click="handleDelete(course)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <CourseFormModal
      :show="showModal"
      :loading="modalLoading"
      :course="editingCourse"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.course-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  border-radius: 16px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 92%, #ffffff 8%), var(--bg-secondary));
  padding: 24px;
}

.course-overline {
  margin: 0 0 8px;
  color: #5e6c84;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.dark .course-overline {
  color: #93a4bd;
}

.course-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}

.course-subtitle {
  max-width: 760px;
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.course-primary-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #0f5bd7;
  border-radius: 10px;
  background: #0f5bd7;
  color: #ffffff;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.course-primary-button:hover {
  background: #0b4fc2;
  border-color: #0b4fc2;
}

.course-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.course-stat-card {
  border: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  border-radius: 14px;
  background: var(--bg-secondary);
  padding: 16px 18px;
}

.course-stat-label {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.course-stat-value {
  display: block;
  margin-top: 8px;
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.course-stat-hint {
  display: block;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.course-panel {
  border: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  border-radius: 16px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.course-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  padding: 16px 20px;
}

.course-search-wrap {
  position: relative;
  width: min(420px, 100%);
}

.course-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  color: #6b778c;
}

.dark .course-search-icon {
  color: #8c9bab;
}

.course-search-input {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg-primary) 84%, var(--bg-secondary) 16%);
  color: var(--text-primary);
  padding: 10px 12px 10px 38px;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.course-search-input:focus {
  outline: none;
  border-color: #0f5bd7;
  box-shadow: 0 0 0 3px rgba(15, 91, 215, 0.12);
  background: var(--bg-secondary);
}

.course-toolbar-count {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.course-table-wrap {
  overflow-x: auto;
}

.course-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.course-table th {
  border-bottom: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  color: #6b778c;
  background: color-mix(in srgb, var(--bg-primary) 65%, var(--bg-secondary) 35%);
  padding: 13px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dark .course-table th {
  color: #94a3b8;
}

.course-table td {
  border-bottom: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  padding: 16px 20px;
  vertical-align: middle;
  color: var(--text-primary);
  font-size: 14px;
}

.course-table tbody tr:hover {
  background: color-mix(in srgb, var(--bg-tertiary) 55%, var(--bg-secondary) 45%);
}

.course-actions-head {
  text-align: right !important;
}

.course-cell-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.course-icon-box {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, #0f5bd7 10%, var(--bg-secondary) 90%);
  color: #0f5bd7;
  flex-shrink: 0;
}

.dark .course-icon-box {
  background: color-mix(in srgb, #0f5bd7 16%, var(--bg-secondary) 84%);
  color: #7cb0ff;
}

.course-name {
  margin: 0;
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.course-meta {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.course-date-block {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.course-date-separator {
  color: color-mix(in srgb, var(--text-secondary) 70%, transparent);
}

.course-price {
  font-weight: 600;
  white-space: nowrap;
}

.course-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.course-status-planned {
  background: rgba(37, 99, 235, 0.10);
  color: #1d4ed8;
}

.course-status-active {
  background: rgba(5, 150, 105, 0.12);
  color: #047857;
}

.course-status-completed {
  background: rgba(100, 116, 139, 0.14);
  color: #475569;
}

.course-status-cancelled {
  background: rgba(220, 38, 38, 0.10);
  color: #b91c1c;
}

.dark .course-status-planned {
  color: #8db7ff;
}

.dark .course-status-active {
  color: #5ee7b1;
}

.dark .course-status-completed {
  color: #cbd5e1;
}

.dark .course-status-cancelled {
  color: #fca5a5;
}

.course-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.course-icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid color-mix(in srgb, var(--border-color) 100%, transparent);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.course-icon-action:hover {
  background: color-mix(in srgb, var(--bg-tertiary) 72%, var(--bg-secondary) 28%);
  border-color: color-mix(in srgb, var(--border-color) 60%, #0f5bd7 40%);
  color: var(--text-primary);
}

.course-icon-action-danger:hover {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.22);
  color: #c53030;
}

.course-empty {
  padding: 56px 20px !important;
  color: var(--text-secondary) !important;
  text-align: center;
}

.course-loading-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-loading-line {
  width: 160px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-primary) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: course-loading 1.2s infinite linear;
}

.course-loading-line-wide {
  width: 260px;
}

@keyframes course-loading {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1024px) {
  .course-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .course-hero,
  .course-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .course-primary-button {
    justify-content: center;
  }

  .course-stats-grid {
    grid-template-columns: 1fr;
  }

  .course-title {
    font-size: 24px;
  }
}
</style>
