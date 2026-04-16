<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Calendar, Eye, Pencil, Plus, Trash2, Users } from 'lucide-vue-next'
import { mockExamsApi } from '@/api/mockExams'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const mockExams = ref([])
const loading = ref(true)
const showModal = ref(false)
const modalLoading = ref(false)
const editingExam = ref(null)
const search = ref('')

const form = ref({
  title: '',
  examDate: ''
})

const canCreate = computed(() => authStore.hasPermission('MOCK_EXAM_CREATE'))
const canUpdate = computed(() => authStore.hasPermission('MOCK_EXAM_UPDATE'))
const canDelete = computed(() => authStore.hasPermission('MOCK_EXAM_DELETE'))

const columns = computed(() => [
  { key: 'title', label: t('mockExams.examTitle'), width: '38%' },
  { key: 'examDate', label: t('mockExams.examDate'), width: '22%' },
  { key: 'participantCount', label: t('mockExams.participants'), width: '18%' },
  { key: 'actions', label: '', width: '132px' }
])

const filteredExams = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return mockExams.value

  return mockExams.value.filter((exam) => {
    const haystack = [exam.title, exam.examDate].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

onMounted(fetchExams)

async function fetchExams() {
  loading.value = true
  try {
    mockExams.value = await mockExamsApi.getAll()
  } catch (error) {
    toast.error(t('mockExams.failedLoad'))
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function openCreateModal() {
  editingExam.value = null
  form.value = { title: '', examDate: '' }
  showModal.value = true
}

function openEditModal(exam) {
  editingExam.value = exam
  form.value = {
    title: exam.title || '',
    examDate: exam.examDate || ''
  }
  showModal.value = true
}

function closeModal() {
  editingExam.value = null
  showModal.value = false
}

function viewExam(exam) {
  router.push(`/mock-exams/${exam.id}`)
}

async function handleSubmit() {
  if (!form.value.title?.trim() || !form.value.examDate) {
    toast.warning(t('mockExams.fillAllFields'))
    return
  }

  modalLoading.value = true
  try {
    if (editingExam.value) {
      await mockExamsApi.update(editingExam.value.id, {
        title: form.value.title.trim(),
        examDate: form.value.examDate
      })
      toast.success(t('mockExams.mockExamUpdated'))
    } else {
      await mockExamsApi.create({
        title: form.value.title.trim(),
        examDate: form.value.examDate
      })
      toast.success(t('mockExams.mockExamCreated'))
    }

    closeModal()
    await fetchExams()
  } catch (error) {
    toast.error(editingExam.value ? t('mockExams.failedUpdate') : t('mockExams.failedCreate'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(exam) {
  const confirmed = await confirm.confirm({
    title: t('mockExams.deleteMockExam'),
    message: t('mockExams.deleteConfirm', { name: exam.title }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) return

  try {
    await mockExamsApi.delete(exam.id)
    toast.success(t('mockExams.mockExamDeleted'))
    await fetchExams()
  } catch (error) {
    toast.error(t('mockExams.failedDelete'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('mockExams.title') }}</h1>
        <p class="mt-1 text-[var(--text-secondary)]">
          {{ t('mockExams.examsCount', { count: filteredExams.length }) }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('mockExams.searchExams')"
          class="w-full sm:w-72"
        />

        <BaseButton v-if="canCreate" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          {{ t('mockExams.newMockExam') }}
        </BaseButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-secondary)]">
      <BaseTable
        :columns="columns"
        :data="filteredExams"
        :loading="loading"
        :empty-text="t('mockExams.noExams')"
        table-layout="auto"
        table-class="min-w-[820px]"
      >
        <template #title="{ row }">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Calendar class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--text-primary)]">{{ row.title }}</p>
              <p class="text-xs text-[var(--text-secondary)]">#{{ row.id }}</p>
            </div>
          </div>
        </template>

        <template #examDate="{ row }">
          <span class="whitespace-nowrap text-[var(--text-secondary)]">{{ formatDate(row.examDate) }}</span>
        </template>

        <template #participantCount="{ row }">
          <div class="flex items-center gap-2 text-[var(--text-secondary)]">
            <Users class="h-4 w-4" />
            <span>{{ row.participantCount || 0 }}</span>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <BaseButton variant="ghost" size="sm" icon @click="viewExam(row)">
              <Eye class="h-4 w-4" />
            </BaseButton>
            <BaseButton v-if="canUpdate" variant="ghost" size="sm" icon @click="openEditModal(row)">
              <Pencil class="h-4 w-4" />
            </BaseButton>
            <BaseButton v-if="canDelete" variant="danger" size="sm" icon @click="handleDelete(row)">
              <Trash2 class="h-4 w-4" />
            </BaseButton>
          </div>
        </template>
      </BaseTable>
    </div>

    <BaseModal
      :show="showModal"
      :title="editingExam ? t('mockExams.editMockExam') : t('mockExams.newMockExam')"
      @close="closeModal"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="form.title"
          :label="t('mockExams.examTitle')"
          :placeholder="t('mockExams.examTitlePlaceholder')"
        />
        <BaseInput
          v-model="form.examDate"
          :label="t('mockExams.examDate')"
          type="date"
        />
      </form>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="modalLoading" @click="handleSubmit">
          {{ editingExam ? t('common.save') : t('common.create') }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
