<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { courseSubjectsApi } from '@/api/courseSubjects'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import CourseSubjectFormModal from '@/components/courses/CourseSubjectFormModal.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const course = ref(null)
const courseSubjects = ref([])
const loading = ref(true)
const showModal = ref(false)
const modalLoading = ref(false)
const editingCourseSubject = ref(null)

const canManageSubjects = computed(() => authStore.hasPermission('COURSE_MANAGE_SUBJECTS'))

onMounted(fetchCourseData)

async function fetchCourseData() {
  loading.value = true
  try {
    const [courseResponse, subjectsResponse] = await Promise.all([
      coursesApi.getById(route.params.id),
      courseSubjectsApi.getByCourse(route.params.id)
    ])
    course.value = courseResponse
    courseSubjects.value = subjectsResponse
  } catch (error) {
    toast.error(t('courses.failedLoad'))
    router.push('/courses')
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

function openCreateModal() {
  editingCourseSubject.value = null
  showModal.value = true
}

function openEditModal(courseSubject) {
  editingCourseSubject.value = courseSubject
  showModal.value = true
}

function closeModal() {
  editingCourseSubject.value = null
  showModal.value = false
}

async function handleSubmit(payload) {
  modalLoading.value = true
  try {
    if (editingCourseSubject.value) {
      await courseSubjectsApi.update(editingCourseSubject.value.id, payload)
      toast.success(t('courses.subjectTeacherUpdated'))
    } else {
      await courseSubjectsApi.create(route.params.id, payload)
      toast.success(t('courses.subjectTeacherAdded'))
    }

    closeModal()
    await fetchCourseData()
  } catch (error) {
    toast.error(t('courses.failedSaveSubjectTeacher'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(courseSubject) {
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
    await fetchCourseData()
  } catch (error) {
    toast.error(t('courses.failedDeleteSubjectTeacher'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <button
      class="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
      @click="router.push('/courses')"
    >
      <ArrowLeft class="w-4 h-4" />
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
                <span>{{ t('courses.status') }}: {{ course.status || '-' }}</span>
              </div>
            </div>
          </div>

          <BaseButton v-if="canManageSubjects" @click="openCreateModal">
            <Plus class="mr-2 h-4 w-4" />
            {{ t('courses.addSubjectTeacher') }}
          </BaseButton>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('courses.subjectsTeachers') }}</h2>
          <span class="text-sm text-[var(--text-secondary)]">{{ courseSubjects.length }}</span>
        </div>

        <div v-if="courseSubjects.length" class="space-y-3">
          <div
            v-for="courseSubject in courseSubjects"
            :key="courseSubject.id"
            class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p class="font-semibold text-[var(--text-primary)]">{{ courseSubject.subjectName }}</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ courseSubject.teacherName || '-' }}</p>
            </div>

            <div v-if="canManageSubjects" class="flex items-center gap-2">
              <BaseButton variant="ghost" size="sm" @click="openEditModal(courseSubject)">
                <Pencil class="mr-1 h-4 w-4" />
                {{ t('common.edit') }}
              </BaseButton>
              <BaseButton variant="danger" size="sm" @click="handleDelete(courseSubject)">
                <Trash2 class="mr-1 h-4 w-4" />
                {{ t('common.delete') }}
              </BaseButton>
            </div>
          </div>
        </div>

        <p v-else class="py-8 text-center text-[var(--text-secondary)]">
          {{ t('courses.noSubjectsTeachers') }}
        </p>
      </BaseCard>
    </template>

    <CourseSubjectFormModal
      :show="showModal"
      :loading="modalLoading"
      :course-subject="editingCourseSubject"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>
