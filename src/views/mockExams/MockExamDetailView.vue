<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Save, Users } from 'lucide-vue-next'
import { mockExamsApi } from '@/api/mockExams'
import { studentsApi } from '@/api/students'
import { subjectsApi } from '@/api/subjects'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const exam = ref(null)
const students = ref([])
const subjects = ref([])
const loading = ref(true)
const saving = ref(false)
const scoreMap = ref({})
const studentSearch = ref('')
const selectedSubjectId = ref(null)

const canManageScores = computed(() => authStore.hasPermission('MOCK_EXAM_SCORE_MANAGE'))

const subjectOptions = computed(() => [
  { value: null, label: t('mockExams.allSubjects') },
  ...subjects.value.map((subject) => ({ value: subject.id, label: subject.name }))
])

const visibleSubjects = computed(() => {
  if (!selectedSubjectId.value) return subjects.value
  return subjects.value.filter((subject) => subject.id === selectedSubjectId.value)
})

const filteredStudents = computed(() => {
  const query = studentSearch.value.trim().toLowerCase()
  if (!query) return students.value

  return students.value.filter((student) => (student.fullName || '').toLowerCase().includes(query))
})

onMounted(fetchPageData)

async function fetchAllStudents() {
  const result = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const response = await studentsApi.getAll({ page, size: 100 })
    const items = response.content || response || []
    result.push(...items)
    totalPages = response.totalPages || 1
    page += 1
  }

  return result
}

async function fetchPageData() {
  loading.value = true
  try {
    const [examData, scoresData, studentsData, subjectsData] = await Promise.all([
      mockExamsApi.getById(route.params.id),
      mockExamsApi.getScores(route.params.id),
      fetchAllStudents(),
      subjectsApi.getAll()
    ])

    exam.value = examData
    students.value = studentsData
    subjects.value = subjectsData
    scoreMap.value = {}

    scoresData.forEach((score) => {
      scoreMap.value[`${score.studentId}-${score.subjectId}`] = score.score ?? ''
    })
  } catch (error) {
    toast.error(t('mockExams.failedLoadExam'))
    router.push('/mock-exams')
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getScore(studentId, subjectId) {
  const value = scoreMap.value[`${studentId}-${subjectId}`]
  return value ?? ''
}

function setScore(studentId, subjectId, value) {
  const key = `${studentId}-${subjectId}`

  if (value === '' || value === null) {
    delete scoreMap.value[key]
    return
  }

  const parsed = Number(value)
  scoreMap.value[key] = Number.isNaN(parsed) ? '' : parsed
}

function getStudentAverage(studentId) {
  const values = subjects.value
    .map((subject) => scoreMap.value[`${studentId}-${subject.id}`])
    .filter((score) => typeof score === 'number')

  if (!values.length) return '-'

  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length)
}

async function saveScores() {
  const scores = Object.entries(scoreMap.value)
    .filter(([, score]) => score !== '' && score !== null && score !== undefined)
    .map(([key, score]) => {
      const [studentId, subjectId] = key.split('-').map(Number)
      return {
        studentId,
        subjectId,
        score: Number(score)
      }
    })

  if (!scores.length) {
    toast.warning(t('mockExams.noScoresToSave'))
    return
  }

  saving.value = true
  try {
    await mockExamsApi.addScores(exam.value.id, { scores })
    toast.success(t('mockExams.scoresSaved'))
    await fetchPageData()
  } catch (error) {
    toast.error(t('mockExams.failedSaveScores'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <button
      @click="router.push('/mock-exams')"
      class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-white"
    >
      <ArrowLeft class="h-4 w-4" />
      {{ t('mockExams.backToMockExams') }}
    </button>

    <template v-if="loading">
      <BaseCard>
        <BaseSkeleton height="2rem" width="40%" class="mb-4" />
        <BaseSkeleton height="1rem" width="25%" />
      </BaseCard>
    </template>

    <template v-else-if="exam">
      <BaseCard>
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ exam.title }}</h1>
            <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span>{{ t('mockExams.examDate') }}: {{ formatDate(exam.examDate) }}</span>
              <span class="flex items-center gap-2">
                <Users class="h-4 w-4" />
                {{ exam.participantCount || 0 }} {{ t('mockExams.participants') }}
              </span>
            </div>
          </div>

          <BaseButton v-if="canManageScores" :loading="saving" @click="saveScores">
            <Save class="mr-2 h-4 w-4" />
            {{ t('mockExams.saveScores') }}
          </BaseButton>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('mockExams.scoresMatrix') }}</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ t('mockExams.scoresMatrixHint') }}</p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <BaseSearchInput
              v-model="studentSearch"
              :placeholder="t('mockExams.searchStudents')"
              class="w-full sm:w-72"
            />
            <BaseSelect
              v-model="selectedSubjectId"
              :options="subjectOptions"
              :placeholder="t('mockExams.allSubjects')"
              class="w-full sm:w-64"
            />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[980px] w-full">
            <thead>
              <tr class="bg-[var(--bg-tertiary)]">
                <th class="sticky left-0 z-10 bg-[var(--bg-tertiary)] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  {{ t('students.student') }}
                </th>
                <th
                  v-for="subject in visibleSubjects"
                  :key="subject.id"
                  class="min-w-[140px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  {{ subject.name }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  {{ t('mockExams.averageScore') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-if="!filteredStudents.length">
                <td :colspan="visibleSubjects.length + 2" class="px-4 py-12 text-center text-[var(--text-secondary)]">
                  {{ t('mockExams.noStudentsFound') }}
                </td>
              </tr>

              <tr v-for="student in filteredStudents" :key="student.id" class="table-row">
                <td class="sticky left-0 bg-[var(--bg-secondary)] px-4 py-3 font-medium text-[var(--text-primary)]">
                  {{ student.fullName }}
                </td>
                <td
                  v-for="subject in visibleSubjects"
                  :key="subject.id"
                  class="px-4 py-3"
                >
                  <BaseInput
                    :model-value="getScore(student.id, subject.id)"
                    type="number"
                    :disabled="!canManageScores"
                    @update:model-value="setScore(student.id, subject.id, $event)"
                  />
                </td>
                <td class="px-4 py-3 text-center font-medium text-[var(--text-primary)]">
                  {{ getStudentAverage(student.id) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
