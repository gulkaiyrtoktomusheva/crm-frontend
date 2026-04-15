<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { studentCoursesApi } from '@/api/studentCourses'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import StudentCourseFormModal from '@/components/students/StudentCourseFormModal.vue'
import StudentPickerPanel from '@/components/students/StudentPickerPanel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const selectedStudent = ref(null)
const enrollments = ref([])
const loading = ref(false)
const showModal = ref(false)
const modalLoading = ref(false)
const editingEnrollment = ref(null)

const canManage = computed(() => authStore.hasPermission('STUDENT_UPDATE'))

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ru-RU')
}

function formatCurrency(value) {
  if (!value) return `0 ${t('common.currency')}`
  return `${new Intl.NumberFormat('ru-RU').format(value)} ${t('common.currency')}`
}

function getStatusVariant(status) {
  const variants = {
    ACTIVE: 'info',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    PAUSED: 'warning'
  }

  return variants[status] || 'default'
}

async function handleSelectStudent(student) {
  selectedStudent.value = student
  await fetchEnrollments()
}

async function fetchEnrollments() {
  if (!selectedStudent.value) {
    enrollments.value = []
    return
  }

  loading.value = true
  try {
    enrollments.value = await studentCoursesApi.getByStudent(selectedStudent.value.id)
  } catch (error) {
    toast.error(t('enrollments.failedLoad'))
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingEnrollment.value = null
  showModal.value = true
}

function openEditModal(enrollment) {
  editingEnrollment.value = enrollment
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingEnrollment.value = null
}

async function handleSubmit(payload) {
  modalLoading.value = true
  try {
    if (editingEnrollment.value) {
      await studentCoursesApi.update(editingEnrollment.value.id, payload)
      toast.success(t('enrollments.enrollmentUpdated'))
    } else {
      await studentCoursesApi.create(payload)
      toast.success(t('enrollments.enrollmentCreated'))
    }

    closeModal()
    await fetchEnrollments()
  } catch (error) {
    toast.error(t('enrollments.failedSave'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(enrollment) {
  const confirmed = await confirm.confirm({
    title: t('enrollments.deleteEnrollment'),
    message: t('enrollments.deleteConfirm', { name: enrollment.courseName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) return

  try {
    await studentCoursesApi.delete(enrollment.id)
    toast.success(t('enrollments.enrollmentDeleted'))
    await fetchEnrollments()
  } catch (error) {
    toast.error(t('enrollments.failedDelete'))
  }
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
    <StudentPickerPanel
      :selected-student-id="selectedStudent?.id || null"
      @select="handleSelectStudent"
    />

    <div class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('enrollments.title') }}</h1>
          <p class="mt-1 text-[var(--text-secondary)]">
            {{ selectedStudent ? selectedStudent.fullName : t('enrollments.selectStudentFirst') }}
          </p>
        </div>

        <BaseButton v-if="selectedStudent && canManage" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          {{ t('enrollments.newEnrollment') }}
        </BaseButton>
      </div>

      <BaseCard v-if="!selectedStudent">
        <p class="py-8 text-center text-[var(--text-secondary)]">
          {{ t('enrollments.selectStudentFirst') }}
        </p>
      </BaseCard>

      <div v-else-if="loading" class="space-y-4">
        <BaseSkeleton height="7rem" rounded="rounded-2xl" />
        <BaseSkeleton height="7rem" rounded="rounded-2xl" />
      </div>

      <div v-else class="space-y-4">
        <BaseCard v-for="enrollment in enrollments" :key="enrollment.id">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ enrollment.courseName }}</h3>
                <BaseBadge :variant="getStatusVariant(enrollment.status)" dot>
                  {{ enrollment.status || '-' }}
                </BaseBadge>
              </div>

              <div class="grid grid-cols-1 gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-3">
                <div>
                  <p>{{ t('enrollments.coursePrice') }}</p>
                  <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(enrollment.coursePrice) }}</p>
                </div>
                <div>
                  <p>{{ t('enrollments.discountAmount') }}</p>
                  <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(enrollment.discountAmount) }}</p>
                </div>
                <div>
                  <p>{{ t('enrollments.finalPrice') }}</p>
                  <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(enrollment.finalPrice) }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
                <p>{{ t('enrollments.period') }}: {{ formatDate(enrollment.startDate) }} - {{ formatDate(enrollment.endDate) }}</p>
                <p>{{ t('enrollments.referralDiscountAmount') }}: {{ formatCurrency(enrollment.referralDiscountAmount) }}</p>
              </div>
            </div>

            <div v-if="canManage" class="flex items-center gap-2">
              <BaseButton variant="ghost" size="sm" @click="openEditModal(enrollment)">
                <Pencil class="mr-1 h-4 w-4" />
                {{ t('common.edit') }}
              </BaseButton>
              <BaseButton variant="danger" size="sm" @click="handleDelete(enrollment)">
                <Trash2 class="mr-1 h-4 w-4" />
                {{ t('common.delete') }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="selectedStudent && !enrollments.length">
          <p class="py-8 text-center text-[var(--text-secondary)]">
            {{ t('enrollments.noEnrollments') }}
          </p>
        </BaseCard>
      </div>
    </div>

    <StudentCourseFormModal
      v-if="selectedStudent"
      :show="showModal"
      :loading="modalLoading"
      :student-id="selectedStudent.id"
      :enrollment="editingEnrollment"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>
