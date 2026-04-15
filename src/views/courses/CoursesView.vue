<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-vue-next'
import { coursesApi } from '@/api/courses'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import CourseFormModal from '@/components/courses/CourseFormModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseTable from '@/components/ui/BaseTable.vue'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const courses = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const modalLoading = ref(false)
const editingCourse = ref(null)

const columns = computed(() => [
  { key: 'course', label: t('courses.course'), width: '36%' },
  { key: 'period', label: t('courses.period'), width: '24%' },
  { key: 'price', label: t('courses.price'), width: '18%' },
  { key: 'status', label: t('courses.status'), width: '16%' },
  { key: 'actions', label: '', width: '140px' }
])

const filteredCourses = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return courses.value

  return courses.value.filter((course) => {
    const haystack = [course.name, course.status].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  })
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
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('courses.title') }}</h1>
        <p class="mt-1 text-[var(--text-secondary)]">
          {{ t('courses.coursesCount', { count: filteredCourses.length }) }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('courses.searchCourses')"
          class="w-full sm:w-72"
        />

        <BaseButton v-if="canCreate" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          {{ t('courses.newCourse') }}
        </BaseButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-secondary)]">
      <BaseTable
        :columns="columns"
        :data="filteredCourses"
        :loading="loading"
        :empty-text="t('courses.noCourses')"
      >
        <template #course="{ row }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <BookOpen class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium text-[var(--text-primary)]">{{ row.name }}</p>
              <p class="text-xs text-[var(--text-secondary)]">{{ t('courses.course') }} #{{ row.id }}</p>
            </div>
          </div>
        </template>

        <template #period="{ row }">
          <span class="text-[var(--text-secondary)]">
            {{ formatDate(row.startDate) }} - {{ formatDate(row.endDate) }}
          </span>
        </template>

        <template #price="{ row }">
          <span class="font-medium text-[var(--text-primary)]">{{ formatCurrency(row.price) }}</span>
        </template>

        <template #status="{ row }">
          <span class="text-[var(--text-secondary)]">{{ getStatusLabel(row.status) }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <BaseButton v-if="canUpdate" variant="ghost" size="sm" @click="openEditModal(row)">
              <Pencil class="mr-1 h-4 w-4" />
              {{ t('common.edit') }}
            </BaseButton>

            <BaseButton v-if="canDelete" variant="danger" size="sm" @click="handleDelete(row)">
              <Trash2 class="mr-1 h-4 w-4" />
              {{ t('common.delete') }}
            </BaseButton>
          </div>
        </template>
      </BaseTable>
    </div>

    <CourseFormModal
      :show="showModal"
      :loading="modalLoading"
      :course="editingCourse"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>
