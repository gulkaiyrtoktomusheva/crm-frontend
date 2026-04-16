<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { studentsApi } from '@/api/students'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()

const props = defineProps({
  selectedStudentId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['select'])

const students = ref([])
const loading = ref(false)
const search = ref('')
const dropdownOpen = ref(false)
const rootRef = ref(null)
const selectedStudentPreview = ref(null)

async function fetchStudents() {
  loading.value = true
  try {
    const response = await studentsApi.getAll({
      search: search.value || undefined,
      size: 12,
      page: 0
    })
    students.value = response.content || response || []
  } catch (error) {
    students.value = []
  } finally {
    loading.value = false
  }
}

const selectedStudent = computed(() => {
  if (selectedStudentPreview.value?.id === props.selectedStudentId) {
    return selectedStudentPreview.value
  }

  return students.value.find((student) => student.id === props.selectedStudentId) || null
})

function handleDocumentClick(event) {
  if (!rootRef.value?.contains(event.target)) {
    dropdownOpen.value = false
  }
}

function handleFocus() {
  dropdownOpen.value = true
  fetchStudents()
}

function handleSelect(student) {
  emit('select', student)
  selectedStudentPreview.value = student
  search.value = student.fullName
  dropdownOpen.value = false
}

onMounted(() => {
  fetchStudents()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

watch(search, () => {
  if (dropdownOpen.value) {
    fetchStudents()
  }
})

watch(() => props.selectedStudentId, (studentId) => {
  if (!studentId) {
    selectedStudentPreview.value = null
  }
})

function isSelected(student) {
  return student.id === props.selectedStudentId
}
</script>

<template>
  <BaseCard>
    <div ref="rootRef" class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('students.pickStudent') }}</h3>
        <p class="text-sm text-[var(--text-secondary)]">{{ t('students.pickStudentHint') }}</p>
      </div>

      <div class="relative">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('students.searchStudents')"
          @focus="handleFocus"
          @mouseenter="handleFocus"
        />

        <div
          v-if="dropdownOpen"
          class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
        >
          <div v-if="loading" class="space-y-3 p-3">
            <BaseSkeleton height="4rem" rounded="rounded-xl" />
            <BaseSkeleton height="4rem" rounded="rounded-xl" />
            <BaseSkeleton height="4rem" rounded="rounded-xl" />
          </div>

          <div v-else-if="students.length" class="max-h-80 overflow-y-auto p-2">
            <button
              v-for="student in students"
              :key="student.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              :class="isSelected(student)
                ? 'border-accent/40 bg-[var(--accent-soft)]'
                : 'border-transparent bg-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'"
              @click="handleSelect(student)"
            >
              <BaseAvatar :name="student.fullName" size="sm" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-[var(--text-primary)]">{{ student.fullName }}</p>
                <p class="truncate text-sm text-[var(--text-secondary)]">
                  {{ student.phone || student.city || '-' }}
                </p>
              </div>
            </button>
          </div>

          <p v-else class="px-4 py-5 text-center text-sm text-[var(--text-secondary)]">
            {{ t('students.noStudentsFound') }}
          </p>
        </div>
      </div>

      <div
        v-if="selectedStudent"
        class="rounded-2xl border border-accent/30 bg-[var(--accent-soft)] px-4 py-4"
      >
        <div class="flex items-center gap-3">
          <BaseAvatar :name="selectedStudent.fullName" size="sm" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-[var(--text-primary)]">{{ selectedStudent.fullName }}</p>
            <p class="truncate text-sm text-[var(--text-secondary)]">
              {{ selectedStudent.phone || selectedStudent.city || '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
