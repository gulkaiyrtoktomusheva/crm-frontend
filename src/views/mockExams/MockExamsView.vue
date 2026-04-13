<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mockExamsApi } from '@/api/mockExams'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import { Plus, FileText, Calendar, Users } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const mockExams = ref([])
const loading = ref(true)
const showModal = ref(false)
const modalLoading = ref(false)

const form = ref({
  title: '',
  examDate: ''
})

async function fetchExams() {
  loading.value = true
  try {
    mockExams.value = await mockExamsApi.getAll()
  } catch (e) {
    toast.error(t('mockExams.failedLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchExams)

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function handleSubmit() {
  if (!form.value.title || !form.value.examDate) {
    toast.warning(t('mockExams.fillAllFields'))
    return
  }

  modalLoading.value = true
  try {
    await mockExamsApi.create(form.value)
    toast.success(t('mockExams.mockExamCreated'))
    showModal.value = false
    form.value = { title: '', examDate: '' }
    fetchExams()
  } catch (e) {
    toast.error(t('mockExams.failedCreate'))
  } finally {
    modalLoading.value = false
  }
}

function viewExam(exam) {
  router.push(`/mock-exams/${exam.id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('mockExams.title') }}</h1>
        <p class="text-[var(--text-secondary)] mt-1">
          {{ t('mockExams.examsCount', { count: mockExams.length }) }}
        </p>
      </div>

      <BaseButton @click="showModal = true">
        <Plus class="w-4 h-4 mr-2" />
        {{ t('mockExams.newMockExam') }}
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 p-6">
        <BaseSkeleton height="1.5rem" width="60%" class="mb-4" />
        <BaseSkeleton height="1rem" width="40%" />
      </div>
    </div>

    <!-- Empty state -->
    <BaseEmptyState
      v-else-if="mockExams.length === 0"
      :icon="FileText"
      :title="t('mockExams.noExams')"
      :description="t('mockExams.noExamsDescription')"
    >
      <template #action>
        <BaseButton @click="showModal = true">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('mockExams.createMockExam') }}
        </BaseButton>
      </template>
    </BaseEmptyState>

    <!-- Exams grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <BaseCard
        v-for="exam in mockExams"
        :key="exam.id"
        hoverable
        @click="viewExam(exam)"
      >
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-3">{{ exam.title }}</h3>

        <div class="space-y-2 text-sm text-[var(--text-secondary)]">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            <span>{{ formatDate(exam.examDate) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Users class="w-4 h-4" />
            <span>{{ exam.participantCount || 0 }} {{ t('common.participants') }}</span>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Create modal -->
    <BaseModal :show="showModal" :title="t('mockExams.newMockExam')" @close="showModal = false">
      <form @submit.prevent="handleSubmit" class="space-y-4">
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
        <BaseButton variant="ghost" @click="showModal = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="modalLoading" @click="handleSubmit">{{ t('common.create') }}</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
