<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, BookOpen, Calendar, Check, ClipboardCheck, Pencil, Plus, Trash2, UserRound, X } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { courseSubjectsApi } from '@/api/courseSubjects'
import { lessonsApi } from '@/api/lessons'
import { studentCoursesApi } from '@/api/studentCourses'
import { studentsApi } from '@/api/students'
import { subjectsApi } from '@/api/subjects'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import CourseSubjectFormModal from '@/components/courses/CourseSubjectFormModal.vue'
import SubjectFormModal from '@/components/courses/SubjectFormModal.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const course = ref(null)
const courseSubjects = ref([])
const lessons = ref([])
const enrolledStudents = ref([])
const attendance = ref([])
const loading = ref(true)
const lessonsLoading = ref(false)
const attendanceLoading = ref(false)
const showSubjectLinkModal = ref(false)
const showSubjectCreateModal = ref(false)
const modalLoading = ref(false)
const subjectCreateLoading = ref(false)
const editingCourseSubject = ref(null)
const activeTab = ref('subjects')
const selectedCourseSubjectId = ref(null)
const selectedLessonId = ref(null)

const lessonForm = ref({
  courseSubjectId: null,
  lessonDate: new Date().toISOString().split('T')[0],
  topic: ''
})

const tabs = computed(() => [
  { value: 'subjects', label: t('courses.subjectsTab') },
  { value: 'attendance', label: t('courses.attendanceTab') }
])

const canManageSubjects = computed(() => authStore.hasPermission('COURSE_MANAGE_SUBJECTS'))
const canCreateSubject = computed(() => authStore.hasPermission('SUBJECT_CREATE'))
const canViewAttendance = computed(() => authStore.hasPermission('ATTENDANCE_VIEW'))
const canMarkAttendance = computed(() => authStore.hasPermission('ATTENDANCE_MARK'))

const courseSubjectOptions = computed(() => courseSubjects.value.map((item) => ({
  value: item.id,
  label: item.teacherName ? `${item.subjectName} - ${item.teacherName}` : item.subjectName
})))

const filteredLessons = computed(() => {
  if (!selectedCourseSubjectId.value) return lessons.value
  return lessons.value.filter((lesson) => lesson.courseSubjectId === selectedCourseSubjectId.value)
})

const selectedLesson = computed(() => lessons.value.find((lesson) => lesson.id === selectedLessonId.value) || null)

onMounted(fetchCourseData)

watch(selectedCourseSubjectId, async (value) => {
  lessonForm.value.courseSubjectId = value

  if (activeTab.value === 'attendance') {
    await fetchLessons()
  }
})

watch(selectedLessonId, async (lessonId) => {
  if (lessonId && activeTab.value === 'attendance') {
    await fetchAttendance(lessonId)
  } else {
    buildBaseAttendance()
  }
})

watch(activeTab, async (tab) => {
  if (tab === 'attendance' && canViewAttendance.value) {
    await fetchEnrolledStudents()
    await fetchLessons()
  }
})

async function fetchCourseData() {
  loading.value = true
  try {
    const [courseResponse, subjectsResponse] = await Promise.all([
      coursesApi.getById(route.params.id),
      courseSubjectsApi.getByCourse(route.params.id)
    ])

    course.value = courseResponse
    courseSubjects.value = subjectsResponse

    if (!selectedCourseSubjectId.value && subjectsResponse.length) {
      selectedCourseSubjectId.value = subjectsResponse[0].id
      lessonForm.value.courseSubjectId = subjectsResponse[0].id
    }
  } catch (error) {
    toast.error(t('courses.failedLoad'))
    router.push('/courses')
  } finally {
    loading.value = false
  }
}

async function fetchLessons() {
  if (!canViewAttendance.value) return

  lessonsLoading.value = true
  try {
    const data = selectedCourseSubjectId.value
      ? await lessonsApi.getByCourseSubject(selectedCourseSubjectId.value)
      : await lessonsApi.getByCourse(route.params.id)

    lessons.value = data.sort((a, b) => new Date(b.lessonDate) - new Date(a.lessonDate))

    if (!lessons.value.some((lesson) => lesson.id === selectedLessonId.value)) {
      selectedLessonId.value = lessons.value[0]?.id || null
    }
  } catch (error) {
    lessons.value = []
    toast.error(t('courses.failedLoadAttendance'))
  } finally {
    lessonsLoading.value = false
  }
}

async function fetchEnrolledStudents() {
  if (enrolledStudents.value.length) return

  try {
    const students = []
    let page = 0
    let totalPages = 1

    while (page < totalPages) {
      const response = await studentsApi.getAll({ page, size: 100 })
      const pageStudents = response.content || response || []
      students.push(...pageStudents)
      totalPages = response.totalPages || 1
      page += 1
    }

    const enrollmentsByStudent = await Promise.all(
      students.map(async (student) => ({
        student,
        enrollments: await studentCoursesApi.getByStudent(student.id)
      }))
    )

    enrolledStudents.value = enrollmentsByStudent
      .flatMap(({ student, enrollments }) => enrollments
        .filter((item) => item.courseId === Number(route.params.id) && item.status !== 'CANCELLED')
        .map((item) => ({
          studentCourseId: item.id,
          studentId: student.id,
          studentName: student.fullName,
          status: item.status
        })))
      .sort((a, b) => a.studentName.localeCompare(b.studentName))

    buildBaseAttendance()

    if (selectedLessonId.value) {
      await fetchAttendance(selectedLessonId.value)
    }
  } catch (error) {
    enrolledStudents.value = []
    toast.error(t('courses.failedLoadStudents'))
  }
}

async function fetchAttendance(lessonId) {
  attendanceLoading.value = true
  try {
    const records = await lessonsApi.getAttendanceByLesson(lessonId)
    const attendanceMap = new Map(records.map((record) => [record.studentCourseId, record.present]))

    attendance.value = enrolledStudents.value.map((student) => ({
      ...student,
      present: attendanceMap.has(student.studentCourseId) ? attendanceMap.get(student.studentCourseId) : null
    }))
  } catch (error) {
    buildBaseAttendance()
    toast.error(t('courses.failedLoadAttendance'))
  } finally {
    attendanceLoading.value = false
  }
}

function buildBaseAttendance() {
  attendance.value = enrolledStudents.value.map((student) => ({
    ...student,
    present: null
  }))
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

function openCreateModal() {
  editingCourseSubject.value = null
  showSubjectLinkModal.value = true
}

function openEditModal(courseSubject) {
  editingCourseSubject.value = courseSubject
  showSubjectLinkModal.value = true
}

function closeSubjectLinkModal() {
  editingCourseSubject.value = null
  showSubjectLinkModal.value = false
}

async function handleCourseSubjectSubmit(payload) {
  modalLoading.value = true
  try {
    if (editingCourseSubject.value) {
      await courseSubjectsApi.update(editingCourseSubject.value.id, payload)
      toast.success(t('courses.subjectTeacherUpdated'))
    } else {
      await courseSubjectsApi.create(route.params.id, payload)
      toast.success(t('courses.subjectTeacherAdded'))
    }

    closeSubjectLinkModal()
    await fetchCourseData()
  } catch (error) {
    toast.error(t('courses.failedSaveSubjectTeacher'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDeleteCourseSubject(courseSubject) {
  const confirmed = await confirm.confirm({
    title: t('courses.deleteSubjectTeacher'),
    message: t('courses.deleteSubjectTeacherConfirm', { name: courseSubject.subjectName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) return

  try {
    await courseSubjectsApi.delete(courseSubject.id)
    toast.success(t('courses.subjectTeacherDeleted'))

    if (selectedCourseSubjectId.value === courseSubject.id) {
      selectedCourseSubjectId.value = null
    }

    await fetchCourseData()
    await fetchLessons()
  } catch (error) {
    toast.error(t('courses.failedDeleteSubjectTeacher'))
  }
}

async function handleCreateSubject(payload) {
  if (!payload.name) return

  subjectCreateLoading.value = true
  try {
    await subjectsApi.create(payload)
    showSubjectCreateModal.value = false
    toast.success(t('courses.subjectCreated'))
  } catch (error) {
    toast.error(t('courses.failedCreateSubject'))
  } finally {
    subjectCreateLoading.value = false
  }
}

async function createLesson() {
  if (!lessonForm.value.courseSubjectId || !lessonForm.value.lessonDate) {
    toast.warning(t('courses.fillLessonFields'))
    return
  }

  modalLoading.value = true
  try {
    await lessonsApi.create({
      courseSubjectId: Number(lessonForm.value.courseSubjectId),
      lessonDate: lessonForm.value.lessonDate,
      topic: lessonForm.value.topic?.trim() || null,
      status: 'SCHEDULED'
    })

    toast.success(t('courses.lessonCreated'))
    lessonForm.value.topic = ''
    await fetchLessons()
  } catch (error) {
    toast.error(t('courses.failedCreateLesson'))
  } finally {
    modalLoading.value = false
  }
}

function toggleAttendance(studentCourseId, present) {
  const record = attendance.value.find((item) => item.studentCourseId === studentCourseId)
  if (!record) return

  record.present = record.present === present ? null : present
}

async function saveAttendance() {
  if (!selectedLessonId.value) {
    toast.warning(t('courses.selectLessonFirst'))
    return
  }

  const records = attendance.value
    .filter((item) => item.present !== null)
    .map((item) => ({
      studentCourseId: item.studentCourseId,
      present: item.present
    }))

  if (!records.length) {
    toast.warning(t('courses.noAttendanceMarked'))
    return
  }

  attendanceLoading.value = true
  try {
    await lessonsApi.markAttendance(selectedLessonId.value, { records })
    toast.success(t('courses.attendanceSaved'))
    await fetchAttendance(selectedLessonId.value)
  } catch (error) {
    toast.error(t('courses.failedSaveAttendance'))
  } finally {
    attendanceLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <button class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-white" @click="router.push('/courses')">
      <ArrowLeft class="h-4 w-4" />
      {{ t('courses.backToCourses') }}
    </button>

    <template v-if="loading">
      <BaseCard>
        <BaseSkeleton height="2rem" width="40%" class="mb-4" />
        <BaseSkeleton height="1rem" width="60%" />
      </BaseCard>
    </template>

    <template v-else-if="course">
      <BaseCard>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <BookOpen class="h-6 w-6" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ course.name }}</h1>
              <div class="mt-3 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                <span>{{ t('courses.period') }}: {{ formatDate(course.startDate) }} - {{ formatDate(course.endDate) }}</span>
                <span>{{ t('courses.price') }}: {{ formatCurrency(course.price) }}</span>
                <span>{{ t('courses.status') }}: {{ getStatusLabel(course.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="[
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.value
              ? 'border-accent bg-accent/10 text-white'
              : 'border-white/10 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white'
          ]"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <template v-if="activeTab === 'subjects'">
        <BaseCard>
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('courses.subjectsTeachers') }}</h2>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ t('courses.subjectsCount', { count: courseSubjects.length }) }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <BaseButton v-if="canCreateSubject" variant="secondary" @click="showSubjectCreateModal = true">
                <Plus class="mr-2 h-4 w-4" />
                {{ t('courses.createSubject') }}
              </BaseButton>
              <BaseButton v-if="canManageSubjects" @click="openCreateModal">
                <Plus class="mr-2 h-4 w-4" />
                {{ t('courses.addSubjectTeacher') }}
              </BaseButton>
            </div>
          </div>

          <div v-if="courseSubjects.length" class="space-y-3">
            <div
              v-for="courseSubject in courseSubjects"
              :key="courseSubject.id"
              class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div class="space-y-1">
                <p class="font-semibold text-[var(--text-primary)]">{{ courseSubject.subjectName }}</p>
                <p class="text-sm text-[var(--text-secondary)]">{{ courseSubject.teacherName || t('common.optional') }}</p>
              </div>

              <div class="flex items-center gap-2">
                <BaseButton v-if="canManageSubjects" variant="ghost" size="sm" @click="openEditModal(courseSubject)">
                  <Pencil class="mr-1 h-4 w-4" />
                  {{ t('common.edit') }}
                </BaseButton>
                <BaseButton v-if="canManageSubjects" variant="danger" size="sm" @click="handleDeleteCourseSubject(courseSubject)">
                  <Trash2 class="mr-1 h-4 w-4" />
                  {{ t('common.delete') }}
                </BaseButton>
              </div>
            </div>
          </div>

          <p v-else class="py-8 text-center text-[var(--text-secondary)]">{{ t('courses.noSubjectsTeachers') }}</p>
        </BaseCard>
      </template>

      <template v-else>
        <div v-if="canViewAttendance" class="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
          <BaseCard class="space-y-5">
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('courses.attendanceTab') }}</h2>
              <p class="text-sm text-[var(--text-secondary)]">{{ t('courses.attendanceHint') }}</p>
            </div>

            <BaseSelect
              v-model="selectedCourseSubjectId"
              :label="t('courses.subjectFilter')"
              :options="courseSubjectOptions"
              :placeholder="t('courses.selectCourseSubject')"
            />

            <div v-if="canMarkAttendance" class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div class="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Plus class="h-4 w-4" />
                {{ t('courses.newLesson') }}
              </div>

              <BaseInput v-model="lessonForm.lessonDate" :label="t('courses.lessonDate')" type="date" />
              <BaseInput
                v-model="lessonForm.topic"
                :label="t('courses.lessonTopic')"
                :placeholder="t('courses.lessonTopicPlaceholder')"
              />

              <BaseButton class="w-full" :loading="modalLoading" @click="createLesson">
                {{ t('courses.createLesson') }}
              </BaseButton>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{{ t('courses.lessonsList') }}</h3>
                <span class="text-sm text-[var(--text-secondary)]">{{ filteredLessons.length }}</span>
              </div>

              <div v-if="lessonsLoading" class="space-y-2">
                <BaseSkeleton v-for="i in 3" :key="i" height="4rem" />
              </div>

              <div v-else-if="filteredLessons.length" class="space-y-2">
                <button
                  v-for="lesson in filteredLessons"
                  :key="lesson.id"
                  type="button"
                  :class="[
                    'w-full rounded-2xl border p-4 text-left transition-colors',
                    selectedLessonId === lesson.id ? 'border-accent bg-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                  ]"
                  @click="selectedLessonId = lesson.id"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="space-y-1">
                      <p class="font-medium text-[var(--text-primary)]">{{ formatDate(lesson.lessonDate) }}</p>
                      <p class="text-sm text-[var(--text-secondary)]">{{ lesson.topic || t('courses.noLessonTopic') }}</p>
                    </div>
                    <Calendar class="h-4 w-4 text-[var(--text-secondary)]" />
                  </div>
                </button>
              </div>

              <p v-else class="rounded-2xl border border-dashed border-white/10 py-8 text-center text-sm text-[var(--text-secondary)]">
                {{ t('courses.noLessons') }}
              </p>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-[var(--text-primary)]">
                  {{ selectedLesson ? t('courses.attendanceForLesson') : t('courses.attendanceStudents') }}
                </h2>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">
                  {{ selectedLesson ? `${formatDate(selectedLesson.lessonDate)} - ${selectedLesson.subjectName || ''}` : t('courses.selectLessonHint') }}
                </p>
              </div>

              <BaseButton v-if="canMarkAttendance" :loading="attendanceLoading" @click="saveAttendance">
                <ClipboardCheck class="mr-2 h-4 w-4" />
                {{ t('courses.saveAttendance') }}
              </BaseButton>
            </div>

            <div v-if="attendanceLoading" class="space-y-3">
              <BaseSkeleton v-for="i in 5" :key="i" height="4rem" />
            </div>

            <div v-else-if="attendance.length" class="space-y-2">
              <div
                v-for="record in attendance"
                :key="record.studentCourseId"
                class="flex flex-col gap-4 rounded-2xl bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div class="flex items-center gap-3">
                  <BaseAvatar :name="record.studentName" size="sm" />
                  <div>
                    <p class="font-medium text-[var(--text-primary)]">{{ record.studentName }}</p>
                    <p class="text-xs text-[var(--text-secondary)]">#{{ record.studentCourseId }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    :disabled="!canMarkAttendance"
                    :class="[
                      'rounded-lg p-2 transition-colors',
                      record.present === true
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/5 text-[var(--text-secondary)] hover:bg-emerald-500/20 hover:text-emerald-400'
                    ]"
                    @click="toggleAttendance(record.studentCourseId, true)"
                  >
                    <Check class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    :disabled="!canMarkAttendance"
                    :class="[
                      'rounded-lg p-2 transition-colors',
                      record.present === false
                        ? 'bg-red-500 text-white'
                        : 'bg-white/5 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400'
                    ]"
                    @click="toggleAttendance(record.studentCourseId, false)"
                  >
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <UserRound class="mx-auto h-10 w-10 text-[var(--text-secondary)]" />
              <p class="mt-4 text-[var(--text-secondary)]">{{ t('courses.noStudentsInCourse') }}</p>
            </div>
          </BaseCard>
        </div>

        <BaseCard v-else>
          <p class="text-[var(--text-secondary)]">{{ t('courses.attendanceUnavailable') }}</p>
        </BaseCard>
      </template>
    </template>

    <CourseSubjectFormModal
      :show="showSubjectLinkModal"
      :loading="modalLoading"
      :course-subject="editingCourseSubject"
      @close="closeSubjectLinkModal"
      @submit="handleCourseSubjectSubmit"
    />

    <SubjectFormModal
      :show="showSubjectCreateModal"
      :loading="subjectCreateLoading"
      @close="showSubjectCreateModal = false"
      @submit="handleCreateSubject"
    />
  </div>
</template>
