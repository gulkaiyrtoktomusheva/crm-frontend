<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mockExamsApi } from '@/api/mockExams'
import { studentsApi } from '@/api/students'
import { subjectsApi } from '@/api/subjects'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { ArrowLeft, Save } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const exam = ref(null)
const students = ref([])
const subjects = ref([])
const loading = ref(true)
const saving = ref(false)
const scores = ref({})

onMounted(async () => {
  try {
    const [examData, studentsData, subjectsData] = await Promise.all([
      mockExamsApi.getById(route.params.id),
      studentsApi.getAll({ size: 100 }),
      subjectsApi.getAll()
    ])

    exam.value = examData
    students.value = studentsData.content || studentsData
    subjects.value = subjectsData

    if (examData.scores) {
      examData.scores.forEach(s => {
        scores.value[`${s.studentId}-${s.subjectId}`] = s.score
      })
    }
  } catch (e) {
    toast.error(t('mockExams.failedLoadExam'))
    router.push('/mock-exams')
  } finally {
    loading.value = false
  }
})

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getScore(studentId, subjectId) {
  return scores.value[`${studentId}-${subjectId}`] || ''
}

function setScore(studentId, subjectId, value) {
  const key = `${studentId}-${subjectId}`
  if (value === '' || value === null) {
    delete scores.value[key]
  } else {
    scores.value[key] = parseInt(value) || 0
  }
}

async function saveScores() {
  const scoreEntries = []

  for (const [key, score] of Object.entries(scores.value)) {
    const [studentId, subjectId] = key.split('-').map(Number)
    scoreEntries.push({ studentId, subjectId, score })
  }

  if (scoreEntries.length === 0) {
    toast.warning(t('mockExams.noScoresToSave'))
    return
  }

  saving.value = true
  try {
    await mockExamsApi.addScores(exam.value.id, { scores: scoreEntries })
    toast.success(t('mockExams.scoresSaved'))
  } catch (e) {
    toast.error(t('mockExams.failedSaveScores'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back button -->
    <button
      @click="router.push('/mock-exams')"
      class="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      {{ t('mockExams.backToMockExams') }}
    </button>

    <!-- Loading -->
    <template v-if="loading">
      <BaseCard>
        <BaseSkeleton height="2rem" width="40%" class="mb-4" />
        <BaseSkeleton height="1rem" width="20%" />
      </BaseCard>
    </template>

    <template v-else-if="exam">
      <!-- Exam info -->
      <BaseCard>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ exam.title }}</h1>
            <p class="text-[var(--text-secondary)] mt-1">{{ formatDate(exam.examDate) }}</p>
          </div>
          <BaseButton :loading="saving" @click="saveScores">
            <Save class="w-4 h-4 mr-2" />
            {{ t('mockExams.saveScores') }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Score entry table -->
      <BaseCard padding="none">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-[var(--bg-tertiary)]">
                <th class="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase sticky left-0 bg-[var(--bg-tertiary)]">
                  {{ t('students.student') }}
                </th>
                <th
                  v-for="subject in subjects"
                  :key="subject.id"
                  class="px-4 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase min-w-[100px]"
                >
                  {{ subject.name }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="student in students" :key="student.id" class="table-row">
                <td class="px-4 py-3 font-medium text-[var(--text-primary)] sticky left-0 bg-[var(--bg-secondary)]">
                  {{ student.fullName }}
                </td>
                <td v-for="subject in subjects" :key="subject.id" class="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    :value="getScore(student.id, subject.id)"
                    @input="setScore(student.id, subject.id, $event.target.value)"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-[var(--text-primary)] focus:border-accent focus:outline-none"
                    placeholder="-"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
