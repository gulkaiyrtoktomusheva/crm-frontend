<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { paymentsApi } from '@/api/payments'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge.vue'
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import { Check, Plus, Download } from 'lucide-vue-next'

const { t } = useI18n()
const toast = useToast()

const payments = ref([])
const loading = ref(true)
const statusFilter = ref(null)
const methodFilter = ref(null)
const dueDateFrom = ref('')
const dueDateTo = ref('')
const studentSearch = ref('')
const showPaymentModal = ref(false)
const modalLoading = ref(false)
const exportLoading = ref(false)

const pagination = usePagination()

const columns = computed(() => [
  { key: 'student', label: t('payments.student'), width: '28%' },
  { key: 'amount', label: t('payments.amount'), width: '16%' },
  { key: 'installment', label: t('payments.installment'), width: '12%' },
  { key: 'method', label: t('payments.method'), width: '18%' },
  { key: 'dueDate', label: t('payments.dueDate'), width: '16%' },
  { key: 'status', label: t('payments.status'), width: '15%' },
  { key: 'actions', label: '', width: '64px' }
])

const statusOptions = computed(() => [
  { value: 'PAID', label: t('payments.statusPaid') },
  { value: 'PENDING', label: t('payments.statusPending') },
  { value: 'OVERDUE', label: t('payments.statusOverdue') }
])

const methodLabels = computed(() => ({
  MBANK: t('payments.methodMbank'),
  ODENGI: t('payments.methodOdengi'),
  BALANCE_KG: t('payments.methodBalanceKg'),
  ELCART: t('payments.methodElcart'),
  BANK_TRANSFER: t('payments.methodBankTransfer'),
  CASH: t('payments.methodCash'),
  OTHER: t('payments.methodOther')
}))

const methodOptions = computed(() => Object.entries(methodLabels.value).map(([value, label]) => ({
  value,
  label
})))

const filteredPayments = computed(() => payments.value.filter((payment) => {
  if (methodFilter.value && payment.method !== methodFilter.value) {
    return false
  }

  if (dueDateFrom.value || dueDateTo.value) {
    if (!payment.dueDate) {
      return false
    }

    const paymentDate = new Date(payment.dueDate)
    paymentDate.setHours(0, 0, 0, 0)

    if (dueDateFrom.value) {
      const fromDate = new Date(dueDateFrom.value)
      fromDate.setHours(0, 0, 0, 0)
      if (paymentDate < fromDate) {
        return false
      }
    }

    if (dueDateTo.value) {
      const toDate = new Date(dueDateTo.value)
      toDate.setHours(0, 0, 0, 0)
      if (paymentDate > toDate) {
        return false
      }
    }
  }

  if (studentSearch.value) {
    const searchValue = studentSearch.value.toLowerCase().trim()
    const name = (payment.studentName || '').toLowerCase()
    if (!name.includes(searchValue)) {
      return false
    }
  }

  return true
}))

const exportRows = computed(() => filteredPayments.value.map((payment) => ({
  student: payment.studentName || '-',
  amount: formatCurrency(payment.amount),
  installment: `${payment.installmentNumber || '-'} / ${payment.totalInstallments || '-'}`,
  method: methodLabels.value[payment.method] || payment.method || '-',
  dueDate: formatDate(payment.dueDate),
  status: getStatusLabel(payment.status)
})))

const totalFilteredAmount = computed(() => filteredPayments.value.reduce(
  (sum, payment) => sum + (Number(payment.amount) || 0),
  0
))

const hasActiveColumnFilters = computed(() => (
  Boolean(statusFilter.value) ||
  Boolean(methodFilter.value) ||
  Boolean(dueDateFrom.value) ||
  Boolean(dueDateTo.value)
))

async function fetchPayments() {
  loading.value = true
  try {
    const params = {
      ...pagination.params.value,
      status: statusFilter.value || undefined
    }
    const response = await paymentsApi.getAll(params)
    payments.value = response.content || response
    pagination.setTotal(response.totalElements, response.totalPages)
  } catch (e) {
    toast.error(t('payments.failedLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchPayments)
watch([() => pagination.page.value, statusFilter], fetchPayments)

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU')
}

function formatCurrency(amount) {
  if (!amount) return '0'
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + t('common.currency')
}

function getStatusLabel(status) {
  const labels = {
    PAID: t('payments.statusPaid'),
    PENDING: t('payments.statusPending'),
    OVERDUE: t('payments.statusOverdue')
  }

  return labels[status] || status || '-'
}

function getFilterLabel(type) {
  if (type === 'status') {
    return statusFilter.value ? getStatusLabel(statusFilter.value) : t('common.allStatuses')
  }

  if (type === 'method') {
    return methodFilter.value ? (methodLabels.value[methodFilter.value] || methodFilter.value) : t('payments.allMethods')
  }

  if (type === 'dueDate') {
    if (!dueDateFrom.value && !dueDateTo.value) {
      return t('payments.allDates')
    }

    if (dueDateFrom.value && dueDateTo.value) {
      return `${formatDate(dueDateFrom.value)} - ${formatDate(dueDateTo.value)}`
    }

    if (dueDateFrom.value) {
      return `${t('payments.fromDate')} ${formatDate(dueDateFrom.value)}`
    }

    return `${t('payments.toDate')} ${formatDate(dueDateTo.value)}`
  }

  return ''
}

function resetColumnFilters() {
  statusFilter.value = null
  methodFilter.value = null
  dueDateFrom.value = ''
  dueDateTo.value = ''
}

function getReportTitle() {
  return t('payments.reportTitle')
}

function getReportMeta() {
  const parts = [new Date().toLocaleString()]

  if (statusFilter.value) {
    parts.push(`${t('payments.status')}: ${getStatusLabel(statusFilter.value)}`)
  }

  if (methodFilter.value) {
    parts.push(`${t('payments.method')}: ${methodLabels.value[methodFilter.value] || methodFilter.value}`)
  }

  if (dueDateFrom.value || dueDateTo.value) {
    parts.push(`${t('payments.dueDate')}: ${getFilterLabel('dueDate')}`)
  }

  if (studentSearch.value) {
    parts.push(`${t('common.search')}: ${studentSearch.value}`)
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
    t('payments.student'),
    t('payments.amount'),
    t('payments.installment'),
    t('payments.method'),
    t('payments.dueDate'),
    t('payments.status')
  ]

  const headHtml = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')
  const rowsHtml = exportRows.value.map((row) => `
    <tr>
      <td>${escapeHtml(row.student)}</td>
      <td>${escapeHtml(row.amount)}</td>
      <td>${escapeHtml(row.installment)}</td>
      <td>${escapeHtml(row.method)}</td>
      <td>${escapeHtml(row.dueDate)}</td>
      <td>${escapeHtml(row.status)}</td>
    </tr>
  `).join('')

  return `
    <table>
      <thead><tr>${headHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `
}

async function markAsPaid(payment) {
  try {
    await paymentsApi.updateStatus(payment.id, 'PAID')
    toast.success(t('payments.markedAsPaid'))
    fetchPayments()
  } catch (e) {
    toast.error(t('payments.failedUpdate'))
  }
}

async function createPayment(payload) {
  modalLoading.value = true
  try {
    await paymentsApi.create(payload)
    toast.success(t('payments.paymentCreated'))
    showPaymentModal.value = false
    fetchPayments()
  } catch (e) {
    toast.error(t('payments.failedCreate'))
  } finally {
    modalLoading.value = false
  }
}

async function exportPaymentsToPdf() {
  exportLoading.value = true
  try {
    if (!exportRows.value.length) {
      toast.warning(t('payments.nothingToExport'))
      return
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) {
      toast.error(t('payments.exportPopupBlocked'))
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
            .summary { margin-top: 16px; display: flex; justify-content: flex-end; }
            .summary-box { min-width: 240px; border: 1px solid #d1d5db; padding: 12px 16px; background: #f9fafb; }
            .summary-label { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
            .summary-value { font-size: 18px; font-weight: 700; }
            @page { size: A4 landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(getReportTitle())}</h1>
            <div class="meta">${escapeHtml(getReportMeta())}</div>
          </div>
          ${buildReportTable()}
          <div class="summary">
            <div class="summary-box">
              <div class="summary-label">${escapeHtml(t('payments.totalAmount'))}</div>
              <div class="summary-value">${escapeHtml(formatCurrency(totalFilteredAmount.value))}</div>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()

    toast.success(t('payments.exportPdfReady'))
  } catch (e) {
    toast.error(t('payments.exportFailed'))
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
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('payments.title') }}</h1>
        <p class="text-[var(--text-secondary)] mt-1">
          {{ t('payments.paymentsCount', { count: filteredPayments.length }) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseSearchInput
          v-model="studentSearch"
          :placeholder="t('payments.searchPayments')"
          class="w-64"
        />
        <BaseButton
          variant="ghost"
          :disabled="!hasActiveColumnFilters"
          @click="resetColumnFilters"
        >
          {{ t('payments.resetFilters') }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          :loading="exportLoading"
          @click="exportPaymentsToPdf"
        >
          <Download class="w-4 h-4 mr-2" />
          {{ t('payments.exportPdf') }}
        </BaseButton>
        <BaseButton @click="showPaymentModal = true">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('payments.createPayment') }}
        </BaseButton>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 overflow-hidden">
      <BaseTable :columns="columns" :data="filteredPayments" :loading="loading">
        <template #header-dueDate>
          <BaseDropdown align="left">
            <template #trigger>
              <button class="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors">
                <span>{{ t('payments.dueDate') }}</span>
                <span v-if="dueDateFrom || dueDateTo" class="text-[10px] text-accent normal-case">{{ getFilterLabel('dueDate') }}</span>
              </button>
            </template>

            <template #default="{ close }">
              <div class="px-4 py-3 space-y-3 min-w-[260px]">
                <div class="space-y-1">
                  <label class="block text-xs text-[var(--text-secondary)]">{{ t('payments.fromDate') }}</label>
                  <input
                    v-model="dueDateFrom"
                    type="date"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs text-[var(--text-secondary)]">{{ t('payments.toDate') }}</label>
                  <input
                    v-model="dueDateTo"
                    type="date"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div class="flex justify-between gap-2 pt-1">
                  <button
                    class="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                    @click="() => { dueDateFrom = ''; dueDateTo = ''; close() }"
                  >
                    {{ t('payments.clearDateRange') }}
                  </button>
                  <button
                    class="px-3 py-2 text-sm text-white bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
                    @click="close()"
                  >
                    {{ t('common.save') }}
                  </button>
                </div>
              </div>
            </template>
          </BaseDropdown>
        </template>

        <template #header-method>
          <BaseDropdown align="left">
            <template #trigger>
              <button class="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-colors">
                <span>{{ t('payments.method') }}</span>
                <span v-if="methodFilter" class="text-[10px] text-accent normal-case">{{ getFilterLabel('method') }}</span>
              </button>
            </template>

            <template #default="{ close }">
              <button
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { methodFilter = null; close() }"
              >
                {{ t('payments.allMethods') }}
              </button>
              <button
                v-for="option in methodOptions"
                :key="option.value"
                class="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
                @click="() => { methodFilter = option.value; close() }"
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
                <span>{{ t('payments.status') }}</span>
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
            <BaseAvatar :name="row.studentName || 'Unknown'" size="sm" />
            <span class="font-medium text-[var(--text-primary)]">{{ row.studentName }}</span>
          </div>
        </template>

        <template #amount="{ row }">
          <span class="font-medium text-[var(--text-primary)]">{{ formatCurrency(row.amount) }}</span>
        </template>

        <template #installment="{ row }">
          <span class="text-[var(--text-secondary)]">
            {{ row.installmentNumber || '-' }}/{{ row.totalInstallments || '-' }}
          </span>
        </template>

        <template #method="{ row }">
          <span class="text-[var(--text-secondary)]">{{ methodLabels[row.method] || row.method || '-' }}</span>
        </template>

        <template #dueDate="{ row }">
          <span class="text-[var(--text-secondary)]">{{ formatDate(row.dueDate) }}</span>
        </template>

        <template #status="{ row }">
          <PaymentStatusBadge :status="row.status" />
        </template>

        <template #actions="{ row }">
          <button
            v-if="row.status !== 'PAID'"
            @click="markAsPaid(row)"
            class="p-2 rounded-lg hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
            :title="t('payments.markAsPaid')"
          >
            <Check class="w-4 h-4" />
          </button>
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

    <!-- Payment Form Modal -->
    <PaymentFormModal
      :show="showPaymentModal"
      :loading="modalLoading"
      @close="showPaymentModal = false"
      @submit="createPayment"
    />
  </div>
</template>
