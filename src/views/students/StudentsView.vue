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
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import { Plus, Eye, Download } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const students = ref([])
const loading = ref(true)
const showModal = ref(false)
const selectedStudent = ref(null)
const modalLoading = ref(false)
const exportLoading = ref(false)
const search = ref('')
const statusFilter = ref(null)
const cityFilter = ref(null)
const gradeFilter = ref(null)

const pagination = usePagination()

const columns = computed(() => [
  { key: 'student', label: t('students.student'), width: '44%' },
  { key: 'grade', label: t('common.grade'), width: '96px' },
  { key: 'city', label: t('students.city'), width: '22%' },
  { key: 'status', label: t('leads.status'), width: '160px' },
  { key: 'actions', label: '', width: '72px' }
])

const statusOptions = computed(() => [
  { value: 'ACTIVE', label: t('students.statusActive') },
  { value: 'AT_RISK', label: t('students.statusAtRisk') },
  { value: 'DROPPED', label: t('students.statusDropped') },
  { value: 'COMPLETED', label: t('students.statusCompleted') }
])

const gradeOptions = computed(() => [
  { value: '10', label: '10' },
  { value: '11', label: '11' }
])

const cityOptions = computed(() => {
  const uniqueCities = [...new Set(
    students.value
      .map(student => student.city?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))

  return uniqueCities.map(city => ({ value: city, label: city }))
})

const filteredStudents = computed(() => students.value.filter((student) => {
  if (cityFilter.value && student.city !== cityFilter.value) {
    return false
  }

  if (gradeFilter.value && String(student.grade) !== String(gradeFilter.value)) {
    return false
  }

  return true
}))

const exportRows = computed(() => filteredStudents.value.map((student) => ({
  fullName: student.fullName || '-',
  phone: student.phone || '-',
  grade: student.grade || '-',
  city: student.city || '-',
  status: getStatusLabel(student.status)
})))

const hasActiveColumnFilters = computed(() => (
  Boolean(statusFilter.value) ||
  Boolean(cityFilter.value) ||
  Boolean(gradeFilter.value)
))

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

function getStatusLabel(status) {
  const labels = {
    ACTIVE: t('students.statusActive'),
    AT_RISK: t('students.statusAtRisk'),
    DROPPED: t('students.statusDropped'),
    COMPLETED: t('students.statusCompleted')
  }

  return labels[status] || status || '-'
}

function getFilterLabel(type) {
  if (type === 'status') {
    return statusFilter.value ? getStatusLabel(statusFilter.value) : t('common.allStatuses')
  }

  if (type === 'city') {
    return cityFilter.value || t('students.allCities')
  }

  if (type === 'grade') {
    return gradeFilter.value || t('students.allGrades')
  }

  return ''
}

function resetColumnFilters() {
  statusFilter.value = null
  cityFilter.value = null
  gradeFilter.value = null
}

function getReportTitle() {
  return t('students.reportTitle')
}

function getReportMeta() {
  const parts = [new Date().toLocaleString()]

  if (statusFilter.value) {
    parts.push(`${t('leads.status')}: ${getStatusLabel(statusFilter.value)}`)
  }

  if (search.value) {
    parts.push(`${t('common.search')}: ${search.value}`)
  }

  if (cityFilter.value) {
    parts.push(`${t('students.city')}: ${cityFilter.value}`)
  }

  if (gradeFilter.value) {
    parts.push(`${t('common.grade')}: ${gradeFilter.value}`)
  }

  return parts.join(' | ')
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildReportTable() {
  const headers = [
    t('students.student'),
    t('students.phone'),
    t('common.grade'),
    t('students.city'),
    t('leads.status')
  ]

  const headHtml = headers
    .map(header => `<th>${escapeHtml(header)}</th>`)
    .join('')

  const rowsHtml = exportRows.value
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.fullName)}</td>
        <td>${escapeHtml(row.phone)}</td>
        <td>${escapeHtml(row.grade)}</td>
        <td>${escapeHtml(row.city)}</td>
        <td>${escapeHtml(row.status)}</td>
      </tr>
    `)
    .join('')

  return `
    <table>
      <thead>
        <tr>${headHtml}</tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `
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

async function exportStudentsToPdf() {
  exportLoading.value = true
  try {
    if (!exportRows.value.length) {
      toast.warning(t('students.nothingToExport'))
      return
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) {
      toast.error(t('students.exportPopupBlocked'))
      return
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(getReportTitle())}</title>
          <style>
            :root { color-scheme: light; }
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            .header { margin-bottom: 24px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; vertical-align: top; font-size: 12px; }
            th { background: #f3f4f6; }
            @page { size: A4 landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(getReportTitle())}</h1>
            <div class="meta">${escapeHtml(getReportMeta())}</div>
          </div>
          ${buildReportTable()}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()

    toast.success(t('students.exportPdfReady'))
  } catch (e) {
    toast.error(t('students.exportFailed'))
  } finally {
    exportLoading.value = false
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
          {{ t('students.studentsCount', { count: filteredStudents.length }) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('students.searchStudents')"
          class="w-64"
        />

        <BaseButton
          variant="ghost"
          :disabled="!hasActiveColumnFilters"
          @click="resetColumnFilters"
        >
          {{ t('students.resetFilters') }}
        </BaseButton>

        <BaseButton
          variant="secondary"
          :loading="exportLoading"
          @click="exportStudentsToPdf"
        >
          <Download class="w-4 h-4 mr-2" />
          {{ t('students.exportPdf') }}
        </BaseButton>

        <BaseButton @click="openCreateModal">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('students.newStudent') }}
        </BaseButton>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 overflow-hidden">
      <BaseTable :columns="columns" :data="filteredStudents" :loading="loading">
        <template #header-grade>
          <BaseDropdown align="left">
            <template #trigger>
              <button class="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors">
                <span>{{ t('common.grade') }}</span>
                <span v-if="gradeFilter" class="text-[10px] text-accent normal-case">{{ getFilterLabel('grade') }}</span>
              </button>
            </template>

            <template #default="{ close }">
              <button
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { gradeFilter = null; close() }"
              >
                {{ t('students.allGrades') }}
              </button>
              <button
                v-for="option in gradeOptions"
                :key="option.value"
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { gradeFilter = option.value; close() }"
              >
                {{ option.label }}
              </button>
            </template>
          </BaseDropdown>
        </template>

        <template #header-city>
          <BaseDropdown align="left">
            <template #trigger>
              <button class="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors">
                <span>{{ t('students.city') }}</span>
                <span v-if="cityFilter" class="text-[10px] text-accent normal-case">{{ getFilterLabel('city') }}</span>
              </button>
            </template>

            <template #default="{ close }">
              <button
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { cityFilter = null; close() }"
              >
                {{ t('students.allCities') }}
              </button>
              <button
                v-for="option in cityOptions"
                :key="option.value"
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { cityFilter = option.value; close() }"
              >
                {{ option.label }}
              </button>
            </template>
          </BaseDropdown>
        </template>

        <template #header-status>
          <BaseDropdown align="left">
            <template #trigger>
              <button class="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors">
                <span>{{ t('leads.status') }}</span>
                <span v-if="statusFilter" class="text-[10px] text-accent normal-case">{{ getFilterLabel('status') }}</span>
              </button>
            </template>

            <template #default="{ close }">
              <button
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { statusFilter = null; close() }"
              >
                {{ t('common.allStatuses') }}
              </button>
              <button
                v-for="option in statusOptions"
                :key="option.value"
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { statusFilter = option.value; close() }"
              >
                {{ option.label }}
              </button>
            </template>
          </BaseDropdown>
        </template>

        <template #student="{ row }">
          <div class="flex items-center gap-3">
            <BaseAvatar :name="row.fullName" size="sm" />
            <div>
              <p class="font-medium text-[var(--text-primary)]">{{ row.fullName }}</p>
              <p class="text-xs text-[var(--text-secondary)]">{{ row.phone }}</p>
            </div>
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
