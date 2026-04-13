<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { studentsApi } from '@/api/students'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import StudentFormModal from '@/components/students/StudentFormModal.vue'
import StudentStatusBadge from '@/components/students/StudentStatusBadge.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { Plus, Eye, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const students = ref([])
const loading = ref(true)
const showModal = ref(false)
const selectedStudent = ref(null)
const modalLoading = ref(false)
const search = ref('')
const statusFilter = ref(null)

const pagination = usePagination()

const columns = computed(() => [
  { key: 'student', label: t('students.student'), width: '25%' },
  { key: 'groups', label: t('students.groups') },
  { key: 'grade', label: t('common.grade'), width: '80px' },
  { key: 'city', label: t('students.city') },
  { key: 'status', label: t('leads.status'), width: '120px' },
  { key: 'actions', label: '', width: '100px' }
])

const statusOptions = computed(() => [
  { value: 'ACTIVE', label: t('students.statusActive') },
  { value: 'AT_RISK', label: t('students.statusAtRisk') },
  { value: 'DROPPED', label: t('students.statusDropped') },
  { value: 'COMPLETED', label: t('students.statusCompleted') }
])

async function fetchStudents() {
  loading.value = true
  try {
    const params = {
      ...pagination.params.value,
      status: statusFilter.value,
      search: search.value || undefined
    }
    const response = await studentsApi.getAll(params)
    students.value = response.content || response
    pagination.setTotal(response.totalElements, response.totalPages)
  } catch (e) {
    toast.error(t('students.failedLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchStudents)

watch([() => pagination.page.value, statusFilter, search], fetchStudents)

function openCreateModal() {
  selectedStudent.value = null
  showModal.value = true
}

function viewStudent(student) {
  router.push(`/students/${student.id}`)
}

async function handleSubmit(data) {
  modalLoading.value = true
  try {
    if (selectedStudent.value) {
      await studentsApi.update(selectedStudent.value.id, data)
      toast.success(t('students.studentUpdated'))
    } else {
      await studentsApi.create(data)
      toast.success(t('students.studentCreated'))
    }
    showModal.value = false
    fetchStudents()
  } catch (e) {
    toast.error(t('students.failedSave'))
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('students.title') }}</h1>
        <p class="text-[var(--text-secondary)] mt-1">
          {{ t('students.studentsCount', { count: pagination.totalElements.value }) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('students.searchStudents')"
          class="w-64"
        />

        <BaseSelect
          v-model="statusFilter"
          :options="statusOptions"
          :placeholder="t('common.allStatuses')"
          class="w-40"
        />

        <BaseButton @click="openCreateModal">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('students.newStudent') }}
        </BaseButton>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 overflow-hidden">
      <BaseTable :columns="columns" :data="students" :loading="loading">
        <template #student="{ row }">
          <div class="flex items-center gap-3">
            <BaseAvatar :name="row.fullName" size="sm" />
            <div>
              <p class="font-medium text-[var(--text-primary)]">{{ row.fullName }}</p>
              <p class="text-xs text-[var(--text-secondary)]">{{ row.phone }}</p>
            </div>
          </div>
        </template>

        <template #groups="{ row }">
          <div class="flex flex-wrap gap-1">
            <BaseBadge
              v-for="subject in (row.groups || []).slice(0, 3)"
              :key="subject.id"
              variant="purple"
              size="sm"
            >
              {{ groups.name }}
            </BaseBadge>
          </div>
        </template>

        <template #grade="{ row }">
          <span class="text-[var(--text-secondary)]">{{ row.grade || '-' }}</span>
        </template>

        <template #city="{ row }">
          <span class="text-[var(--text-secondary)]">{{ row.city || '-' }}</span>
        </template>

        <template #status="{ row }">
          <StudentStatusBadge :status="row.status" />
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              @click="viewStudent(row)"
              class="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </template>
      </BaseTable>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-white/5">
        <BasePagination
          v-model:currentPage="pagination.page.value"
          :totalPages="pagination.totalPages.value"
          :totalItems="pagination.totalElements.value"
        />
      </div>
    </div>

    <!-- Student form modal -->
    <StudentFormModal
      :show="showModal"
      :student="selectedStudent"
      :loading="modalLoading"
      @close="showModal = false"
      @submit="handleSubmit"
    />
  </div>
</template>
