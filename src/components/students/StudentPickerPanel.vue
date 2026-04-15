<script setup>
import { onMounted, ref, watch } from 'vue'
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

async function fetchStudents() {
  loading.value = true
  try {
    const response = await studentsApi.getAll({
      search: search.value || undefined,
      size: 20,
      page: 0
    })
    students.value = response.content || response || []
  } catch (error) {
    students.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchStudents)
watch(search, fetchStudents)

function isSelected(student) {
  return student.id === props.selectedStudentId
}
</script>

<template>
  <BaseCard>
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('students.pickStudent') }}</h3>
        <p class="text-sm text-[var(--text-secondary)]">{{ t('students.pickStudentHint') }}</p>
      </div>

      <BaseSearchInput
        v-model="search"
        :placeholder="t('students.searchStudents')"
      />

      <div v-if="loading" class="space-y-3">
        <BaseSkeleton height="4rem" rounded="rounded-xl" />
        <BaseSkeleton height="4rem" rounded="rounded-xl" />
        <BaseSkeleton height="4rem" rounded="rounded-xl" />
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="student in students"
          :key="student.id"
          type="button"
          class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
          :class="isSelected(student)
            ? 'border-accent/40 bg-accent/10'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'"
          @click="emit('select', student)"
        >
          <BaseAvatar :name="student.fullName" size="sm" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-[var(--text-primary)]">{{ student.fullName }}</p>
            <p class="truncate text-sm text-[var(--text-secondary)]">
              {{ student.phone || student.city || '-' }}
            </p>
          </div>
        </button>

        <p v-if="!students.length" class="py-4 text-center text-sm text-[var(--text-secondary)]">
          {{ t('students.noStudentsFound') }}
        </p>
      </div>
    </div>
  </BaseCard>
</template>
