<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { studentsApi } from '@/api/students'
import { useToast } from '@/composables/useToast'
import { getApiErrorMessage } from '@/utils/apiError'
import StudentStatusBadge from '@/components/students/StudentStatusBadge.vue'
import StudentFormModal from '@/components/students/StudentFormModal.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  ArrowLeft,
  Pencil,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  User
} from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const student = ref(null)
const loading = ref(true)
const activeTab = ref('attendance')
const showEditModal = ref(false)
const modalLoading = ref(false)

const tabs = computed(() => [
  { id: 'attendance', label: t('students.attendance') },
  { id: 'scores', label: t('students.mockScores') }
])

const studentCourses = computed(() => student.value?.finance?.courses || [])

onMounted(async () => {
  await fetchStudent()
})

async function fetchStudent() {
  try {
    student.value = await studentsApi.getById(route.params.id)
  } catch (e) {
    toast.error(getApiErrorMessage(e, t('students.failedLoadStudent')))
    router.push('/students')
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU')
}

const attendancePercent = computed(() => {
  if (!student.value?.attendancePercentage) return 0
  return Math.round(student.value.attendancePercentage)
})

function formatCurrency(value) {
  if (value === null || value === undefined) return `0 ${t('common.currency')}`
  return `${new Intl.NumberFormat('ru-RU').format(value)} ${t('common.currency')}`
}

function getEnrollmentStatusLabel(status) {
  const labels = {
    ACTIVE: t('enrollments.statusActive'),
    COMPLETED: t('enrollments.statusCompleted'),
    CANCELLED: t('enrollments.statusCancelled'),
    PAUSED: t('enrollments.statusPaused')
  }

  return labels[status] || status || '-'
}

async function handleSubmit(data) {
  modalLoading.value = true
  try {
    student.value = await studentsApi.update(route.params.id, data)
    showEditModal.value = false
    toast.success(t('students.studentUpdated'))
  } catch (e) {
    toast.error(getApiErrorMessage(e, t('students.failedSave')))
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back button -->
    <button
      @click="router.push('/students')"
      class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
    >
      <ArrowLeft class="w-4 h-4" />
      {{ t('students.backToStudents') }}
    </button>

    <!-- Loading state -->
    <template v-if="loading">
      <BaseCard>
        <div class="flex items-start gap-6">
          <BaseSkeleton width="5rem" height="5rem" rounded="rounded-full" />
          <div class="flex-1 space-y-3">
            <BaseSkeleton width="40%" height="1.5rem" />
            <BaseSkeleton width="60%" height="1rem" />
            <BaseSkeleton width="30%" height="1rem" />
          </div>
        </div>
      </BaseCard>
    </template>

    <template v-else-if="student">
      <!-- Student header -->
      <BaseCard>
        <div class="flex flex-col md:flex-row md:items-start gap-6">
          <BaseAvatar :name="student.fullName" size="xl" />

          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ student.fullName }}</h1>
                <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                  <span v-if="student.phone" class="flex items-center gap-1">
                    <Phone class="w-4 h-4" /> {{ student.phone }}
                  </span>
                  <span v-if="student.school" class="flex items-center gap-1">
                    <GraduationCap class="w-4 h-4" /> {{ student.school }}
                  </span>
                  <span v-if="student.city" class="flex items-center gap-1">
                    <MapPin class="w-4 h-4" /> {{ student.city }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <StudentStatusBadge :status="student.status" />
                <BaseButton variant="secondary" size="sm" @click="showEditModal = true">
                  <Pencil class="w-4 h-4 mr-2" />
                  {{ t('common.edit') }}
                </BaseButton>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 mt-4 text-sm text-[var(--text-secondary)]">
              <span v-if="student.parentName" class="flex items-center gap-1">
                <User class="w-4 h-4" /> {{ student.parentName }} ({{ student.parentPhone }})
              </span>
              <span v-if="student.ortDate" class="flex items-center gap-1">
                <Calendar class="w-4 h-4" /> ORT: {{ formatDate(student.ortDate) }}
              </span>
              <span v-if="student.grade">{{ t('common.grade') }}: {{ student.grade }}</span>
              <span v-if="student.whatsapp" class="flex items-center gap-1">
                <Phone class="w-4 h-4" /> WhatsApp: {{ student.whatsapp }}
              </span>
            </div>

            <div class="flex flex-wrap gap-2 mt-4">
              <BaseBadge v-for="subject in student.subjects" :key="subject.id" variant="purple">
                {{ subject.name }}
              </BaseBadge>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Stats row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseCard>
          <p class="text-sm text-[var(--text-secondary)]">{{ t('students.attendance') }}</p>
          <p class="text-2xl font-bold text-[var(--text-primary)] mt-1">{{ attendancePercent }}%</p>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            <div
              class="h-full bg-accent transition-all"
              :style="{ width: `${attendancePercent}%` }"
            />
          </div>
        </BaseCard>

        <BaseCard>
          <p class="text-sm text-[var(--text-secondary)]">{{ t('students.lessons') }}</p>
          <p class="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {{ student.attendedLessons || 0 }} / {{ student.totalLessons || 0 }}
          </p>
        </BaseCard>

        <BaseCard>
          <p class="text-sm text-[var(--text-secondary)]">{{ t('students.avgMockScore') }}</p>
          <p class="text-2xl font-bold text-[var(--text-primary)] mt-1">
            {{ student.averageMockScore ? Math.round(student.averageMockScore) : '-' }}
          </p>
        </BaseCard>
      </div>

      <!-- Tabs -->
      <BaseCard padding="none">
        <div class="flex border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class=" [
              'relative px-6 py-4 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            ]"
          >
            {{ tab.label }}
            <div
              v-if="activeTab === tab.id"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          </button>
        </div>

        <div class="p-6">
          <!-- Attendance tab -->
          <div v-if="activeTab === 'attendance'">
            <div v-if="studentCourses.length" class="space-y-4">
              <div
                v-for="course in studentCourses"
                :key="course.studentCourseId || course.courseId"
                class="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4"
              >
                <div class="mb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="font-medium text-[var(--text-primary)]">{{ course.courseName }}</p>
                    <p class="text-sm text-[var(--text-secondary)]">
                      {{ formatDate(course.startDate) }} - {{ formatDate(course.endDate) }}
                    </p>
                  </div>
                  <BaseBadge variant="default">
                    {{ getEnrollmentStatusLabel(course.status) }}
                  </BaseBadge>
                </div>

                <div class="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                  <span>{{ t('enrollments.finalPrice') }}: {{ formatCurrency(course.finalPrice) }}</span>
                  <span>{{ t('courses.course') }} #{{ course.courseId }}</span>
                </div>
              </div>
            </div>
            <p v-else class="text-[var(--text-secondary)] text-center py-8">
              {{ t('enrollments.noEnrollments') }}
            </p>
          </div>

          <!-- Scores tab -->
          <div v-if="activeTab === 'scores'">
            <div v-if="student.mockExamScores?.length" class="space-y-3">
              <div
                v-for="score in student.mockExamScores"
                :key="score.id"
                class="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4"
              >
                <div>
                  <p class="font-medium text-[var(--text-primary)]">{{ score.mockExamTitle }}</p>
                  <p class="text-sm text-[var(--text-secondary)]">
                    {{ score.subjectName }} - {{ formatDate(score.examDate) }}
                  </p>
                </div>
                <p class="text-xl font-bold text-accent">{{ score.score }}</p>
              </div>
            </div>
            <p v-else class="text-[var(--text-secondary)] text-center py-8">
              {{ t('students.noMockScores') }}
            </p>
          </div>

        </div>
      </BaseCard>
    </template>

    <StudentFormModal
      :show="showEditModal"
      :student="student"
      :loading="modalLoading"
      @close="showEditModal = false"
      @submit="handleSubmit"
    />
  </div>
</template>
