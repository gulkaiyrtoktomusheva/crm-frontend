<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Pencil, Plus, RotateCw } from 'lucide-vue-next'
import { studentsApi } from '@/api/students'
import { paymentAgreementsApi } from '@/api/paymentAgreements'
import { paymentTransactionsApi } from '@/api/paymentTransactions'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage } from '@/utils/apiError'
import PaymentAgreementFormModal from '@/components/payments/PaymentAgreementFormModal.vue'
import PaymentTransactionFormModal from '@/components/payments/PaymentTransactionFormModal.vue'
import StudentPickerPanel from '@/components/students/StudentPickerPanel.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BasePagination from '@/components/ui/BasePagination.vue'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const selectedStudent = ref(null)
const finance = ref(null)
const agreements = ref([])
const studentTransactions = ref([])
const loading = ref(false)
const showAgreementModal = ref(false)
const showTransactionModal = ref(false)
const agreementLoading = ref(false)
const transactionLoading = ref(false)
const editingAgreement = ref(null)

const activeTab = ref('overview')
const historyTransactions = ref([])
const historyLoading = ref(false)
const historyExportLoading = ref(false)
const pagination = usePagination()

const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

const historyDateFrom = ref(formatDateInput(firstDayOfMonth))
const historyDateTo = ref(formatDateInput(today))

const canCreateAgreement = computed(() => authStore.hasPermission('PAYMENT_CREATE'))
const canCreateTransaction = computed(() => authStore.hasPermission('PAYMENT_CREATE'))

const tabs = computed(() => [
  { id: 'overview', label: t('coursePayments.title') },
  { id: 'history', label: t('payments.historyTab') }
])

const financeSummaryCards = computed(() => ([
  {
    key: 'total',
    label: t('payments.totalAmount'),
    value: formatCurrency(finance.value?.totalCourseAmount),
    valueClass: 'text-[var(--text-primary)]'
  },
  {
    key: 'paid',
    label: t('students.totalPaid'),
    value: formatCurrency(finance.value?.totalPaid),
    valueClass: 'text-emerald-500'
  },
  {
    key: 'balance',
    label: t('students.balance'),
    value: formatCurrency(finance.value?.balance),
    valueClass: 'text-[var(--text-primary)]'
  },
  {
    key: 'overdue',
    label: t('payments.overdueAmount'),
    value: formatCurrency(finance.value?.overdueAmount),
    valueClass: 'text-rose-500'
  },
  {
    key: 'nextDue',
    label: t('payments.nextDueDate'),
    value: formatDate(finance.value?.nextDueDate),
    description: formatCurrency(finance.value?.nextDueAmount),
    valueClass: 'text-[var(--text-primary)]'
  }
]))

const agreementCourseNameMap = computed(() => {
  const entries = agreements.value.map((agreement) => [agreement.id, agreement.courseName])
  return new Map(entries)
})

const historyColumns = computed(() => [
  { key: 'student', label: t('payments.student'), width: '28%' },
  { key: 'amount', label: t('payments.amount'), width: '14%' },
  { key: 'method', label: t('payments.method'), width: '14%' },
  { key: 'paidAt', label: t('payments.paidDate'), width: '16%' },
  { key: 'agreement', label: t('courses.course'), width: '28%' }
])

const filteredHistoryTransactions = computed(() => historyTransactions.value)

const paginatedHistoryTransactions = computed(() => {
  const start = pagination.page.value * pagination.size.value
  const end = start + pagination.size.value
  return filteredHistoryTransactions.value.slice(start, end)
})

const historyTotalAmount = computed(() => filteredHistoryTransactions.value.reduce(
  (sum, transaction) => sum + Number(transaction.amount || 0),
  0
))

watch(activeTab, async (tab) => {
  if (tab === 'history') {
    pagination.reset()
    await fetchPaymentHistory()
  }
})

watch([historyDateFrom, historyDateTo], async () => {
  if (activeTab.value !== 'history') return
  pagination.reset()
  await fetchPaymentHistory()
})

watch([filteredHistoryTransactions, () => pagination.size.value], ([transactions]) => {
  const total = transactions.length
  const pages = total === 0 ? 0 : Math.ceil(total / pagination.size.value)

  if (pages > 0 && pagination.page.value > pages - 1) {
    pagination.setPage(pages - 1)
  }

  if (pages === 0 && pagination.page.value !== 0) {
    pagination.setPage(0)
  }

  pagination.setTotal(total, pages)
})

function formatDateInput(date) {
  return date.toISOString().split('T')[0]
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ru-RU')
}

function formatCurrency(value) {
  if (!value) return `0 ${t('common.currency')}`
  return `${new Intl.NumberFormat('ru-RU').format(value)} ${t('common.currency')}`
}

function formatPaymentMethod(value) {
  const labels = {
    MBANK: t('payments.methodMbank'),
    ODENGI: t('payments.methodOdengi'),
    BALANCE_KG: t('payments.methodBalanceKg'),
    ELCART: t('payments.methodElcart'),
    BANK_TRANSFER: t('payments.methodBankTransfer'),
    CASH: t('payments.methodCash'),
    OTHER: t('payments.methodOther')
  }

  return labels[value] || value || '-'
}

function formatAgreementType(value) {
  const labels = {
    FULL: t('coursePayments.agreementTypeFull'),
    INSTALLMENT: t('coursePayments.agreementTypeInstallment')
  }

  return labels[value] || value || '-'
}

function getAgreementCourseName(agreementId) {
  if (!agreementId) return '-'
  return agreementCourseNameMap.value.get(agreementId) || `#${agreementId}`
}

function getAgreementTransactions(agreementId) {
  return studentTransactions.value
    .filter((transaction) => transaction.agreementId === agreementId)
    .sort((left, right) => new Date(left.paidAt || left.createdAt || 0) - new Date(right.paidAt || right.createdAt || 0))
}

function getAllocationScheduleId(allocation) {
  return allocation?.scheduleId
    ?? allocation?.paymentScheduleId
    ?? allocation?.paymentId
    ?? null
}

function getSchedulePaidAmount(agreementId, schedule, index) {
  const agreementTransactions = getAgreementTransactions(agreementId)

  const amountFromAllocations = agreementTransactions.reduce((sum, transaction) => {
    const allocationAmount = (transaction.allocations || []).reduce((allocationSum, allocation) => {
      return getAllocationScheduleId(allocation) === schedule?.id
        ? allocationSum + Number(allocation.amount || 0)
        : allocationSum
    }, 0)

    return sum + allocationAmount
  }, 0)

  if (amountFromAllocations > 0) {
    return amountFromAllocations
  }

  if (schedule?.status !== 'PAID') {
    return Number(schedule?.amount || 0)
  }

  const paidTransactions = agreementTransactions.filter((transaction) => Number(transaction.amount || 0) > 0)
  const paidIndex = (schedule?.installmentNumber || index + 1) - 1
  const matchedTransaction = paidTransactions[paidIndex]

  if (matchedTransaction?.amount != null) {
    return Number(matchedTransaction.amount)
  }

  return Number(schedule?.amount || 0)
}

function getStatusVariant(status) {
  const variants = {
    ACTIVE: 'info',
    PAID: 'success',
    COMPLETED: 'success',
    PENDING: 'warning',
    OVERDUE: 'danger',
    CANCELLED: 'danger'
  }

  return variants[status] || 'default'
}

async function handleSelectStudent(student) {
  selectedStudent.value = student
  await fetchFinance()
}

async function fetchFinance() {
  if (!selectedStudent.value) {
    finance.value = null
    agreements.value = []
    studentTransactions.value = []
    return
  }

  loading.value = true
  try {
    const [financeResponse, agreementsResponse, transactionsResponse] = await Promise.all([
      studentsApi.getFinance(selectedStudent.value.id),
      paymentAgreementsApi.getByStudent(selectedStudent.value.id),
      paymentTransactionsApi.getByStudent(selectedStudent.value.id)
    ])

    finance.value = financeResponse
    agreements.value = agreementsResponse
    studentTransactions.value = transactionsResponse
  } catch (error) {
    toast.error(getApiErrorMessage(error, t('payments.failedLoad')))
  } finally {
    loading.value = false
  }
}

async function fetchPaymentHistory() {
  if (!historyDateFrom.value || !historyDateTo.value) return

  historyLoading.value = true
  try {
    const response = await paymentTransactionsApi.getAll({
      dateFrom: historyDateFrom.value,
      dateTo: historyDateTo.value
    })

    historyTransactions.value = Array.isArray(response) ? response : []
  } catch (error) {
    historyTransactions.value = []
    toast.error(getApiErrorMessage(error, t('payments.failedLoadHistory')))
  } finally {
    historyLoading.value = false
  }
}

async function handleCreateAgreement(payload) {
  agreementLoading.value = true
  try {
    if (editingAgreement.value) {
      await paymentAgreementsApi.update(editingAgreement.value.id, payload)
      toast.success(t('coursePayments.agreementUpdated'))
    } else {
      await paymentAgreementsApi.create(payload)
      toast.success(t('coursePayments.agreementCreated'))
    }

    closeAgreementModal()
    await fetchFinance()
  } catch (error) {
    toast.error(getApiErrorMessage(
      error,
      editingAgreement.value
        ? t('coursePayments.failedUpdateAgreement')
        : t('coursePayments.failedCreateAgreement')
    ))
  } finally {
    agreementLoading.value = false
  }
}

async function handleCreateTransaction(payload) {
  transactionLoading.value = true
  try {
    await paymentTransactionsApi.create(payload)
    showTransactionModal.value = false
    toast.success(t('coursePayments.transactionCreated'))
    await fetchFinance()
    if (activeTab.value === 'history') {
      await fetchPaymentHistory()
    }
  } catch (error) {
    toast.error(getApiErrorMessage(error, t('coursePayments.failedCreateTransaction')))
  } finally {
    transactionLoading.value = false
  }
}

async function refreshAgreementStatus(agreementId) {
  try {
    await paymentAgreementsApi.refreshStatus(agreementId)
    await fetchFinance()
  } catch (error) {
    toast.error(getApiErrorMessage(error, t('coursePayments.failedRefreshAgreement')))
  }
}

function openCreateAgreementModal() {
  editingAgreement.value = null
  showAgreementModal.value = true
}

function openEditAgreementModal(agreement) {
  editingAgreement.value = agreement
  showAgreementModal.value = true
}

function closeAgreementModal() {
  showAgreementModal.value = false
  editingAgreement.value = null
}

function resetHistoryDates() {
  historyDateFrom.value = formatDateInput(firstDayOfMonth)
  historyDateTo.value = formatDateInput(today)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildHistoryReportTable() {
  const headers = [
    t('payments.student'),
    t('payments.amount'),
    t('payments.method'),
    t('payments.paidDate'),
    t('courses.course')
  ]

  const headHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')

  const rowsHtml = filteredHistoryTransactions.value.map((transaction) => `
    <tr>
      <td>${escapeHtml(transaction.studentName || '-')}</td>
      <td>${escapeHtml(formatCurrency(transaction.amount))}</td>
      <td>${escapeHtml(formatPaymentMethod(transaction.method))}</td>
      <td>${escapeHtml(formatDate(transaction.paidAt))}</td>
      <td>${escapeHtml(getAgreementCourseName(transaction.agreementId))}</td>
    </tr>
  `).join('')

  return `
    <table>
      <thead><tr>${headHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `
}

async function exportHistoryToPdf() {
  historyExportLoading.value = true
  try {
    if (!filteredHistoryTransactions.value.length) {
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
          <title>${escapeHtml(t('payments.historyReportTitle'))}</title>
          <style>
            :root { color-scheme: light; }
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            .header { margin-bottom: 24px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { color: #6b7280; font-size: 12px; }
            .summary { margin: 18px 0 24px; padding: 14px 16px; border: 1px solid #bfdbfe; border-radius: 10px; background: #eff6ff; font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; vertical-align: top; font-size: 12px; }
            th { background: #f3f4f6; }
            @page { size: A4 landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(t('payments.historyReportTitle'))}</h1>
            <div class="meta">${escapeHtml(`${t('payments.fromDate')}: ${historyDateFrom.value} | ${t('payments.toDate')}: ${historyDateTo.value}`)}</div>
          </div>
          <div class="summary">${escapeHtml(`${t('payments.totalAmount')}: ${formatCurrency(historyTotalAmount.value)}`)}</div>
          ${buildHistoryReportTable()}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    toast.success(t('payments.exportPdfReady'))
  } catch (error) {
    toast.error(getApiErrorMessage(error, t('payments.exportFailed')))
  } finally {
    historyExportLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="[
          'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
          activeTab === tab.id
            ? 'border-accent bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm'
            : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-accent/30 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
        ]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <template v-if="activeTab === 'overview'">
      <div class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <StudentPickerPanel
          :selected-student-id="selectedStudent?.id || null"
          @select="handleSelectStudent"
        />

        <div class="space-y-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('payments.title') }}</h1>
              <p class="mt-1 text-[var(--text-secondary)]">
                {{ selectedStudent ? selectedStudent.fullName : t('payments.selectStudentFirst') }}
              </p>
            </div>

            <div v-if="selectedStudent" class="flex flex-wrap gap-3">
              <BaseButton
                v-if="canCreateAgreement && finance?.courses?.some((course) => !course.agreement)"
                variant="secondary"
                @click="openCreateAgreementModal"
              >
                <Plus class="mr-2 h-4 w-4" />
                {{ t('coursePayments.newAgreement') }}
              </BaseButton>
              <BaseButton
                v-if="canCreateTransaction"
                :disabled="!agreements.length"
                @click="showTransactionModal = true"
              >
                <Plus class="mr-2 h-4 w-4" />
                {{ t('coursePayments.newTransaction') }}
              </BaseButton>
            </div>
          </div>

          <BaseCard v-if="!selectedStudent">
            <p class="py-8 text-center text-[var(--text-secondary)]">
              {{ t('payments.selectStudentFirst') }}
            </p>
          </BaseCard>

          <div v-else-if="loading" class="space-y-4">
            <BaseSkeleton height="6rem" rounded="rounded-2xl" />
            <BaseSkeleton height="10rem" rounded="rounded-2xl" />
            <BaseSkeleton height="10rem" rounded="rounded-2xl" />
          </div>

          <template v-else-if="finance">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <BaseCard
                v-for="card in financeSummaryCards"
                :key="card.key"
              >
                <p class="text-sm text-[var(--text-secondary)]">{{ card.label }}</p>
                <p class="mt-1 text-2xl font-bold" :class="card.valueClass">{{ card.value }}</p>
                <p v-if="card.description" class="mt-2 text-sm text-[var(--text-secondary)]">{{ card.description }}</p>
              </BaseCard>
            </div>

            <BaseCard>
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('coursePayments.enrollments') }}</h3>
                <span class="text-sm text-[var(--text-secondary)]">{{ finance.courses?.length || 0 }}</span>
              </div>

              <div v-if="finance.courses?.length" class="space-y-4">
                <div
                  v-for="course in finance.courses"
                  :key="course.studentCourseId"
                  class="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/35 p-4"
                >
                  <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div class="flex items-center gap-3">
                          <h4 class="font-semibold text-[var(--text-primary)]">{{ course.courseName }}</h4>
                          <BaseBadge :variant="getStatusVariant(course.status)" dot>
                            {{ course.status || '-' }}
                          </BaseBadge>
                        </div>
                        <p class="mt-1 text-sm text-[var(--text-secondary)]">
                          {{ t('coursePayments.period') }}: {{ formatDate(course.startDate) }} - {{ formatDate(course.endDate) }}
                        </p>
                      </div>

                      <div class="grid grid-cols-1 gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-4">
                        <div>
                          <p>{{ t('coursePayments.coursePrice') }}</p>
                          <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(course.coursePrice) }}</p>
                        </div>
                        <div>
                          <p>{{ t('coursePayments.discountAmount') }}</p>
                          <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(course.discountAmount) }}</p>
                        </div>
                        <div>
                          <p>{{ t('coursePayments.referralDiscountAmount') }}</p>
                          <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(course.referralDiscountAmount) }}</p>
                        </div>
                        <div>
                          <p>{{ t('coursePayments.finalPrice') }}</p>
                          <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(course.finalPrice) }}</p>
                        </div>
                      </div>
                    </div>

                    <div v-if="course.agreement" class="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div class="flex items-center gap-3">
                            <p class="font-medium text-[var(--text-primary)]">{{ t('coursePayments.agreement') }}</p>
                            <BaseBadge :variant="getStatusVariant(course.agreement.status)" dot>
                              {{ course.agreement.status || '-' }}
                            </BaseBadge>
                          </div>
                          <p class="mt-1 text-sm text-[var(--text-secondary)]">
                            {{ formatAgreementType(course.agreement.type) }} • {{ t('coursePayments.firstDueDate') }}: {{ formatDate(course.agreement.firstDueDate) }}
                          </p>
                        </div>

                        <div class="flex items-center gap-2">
                          <BaseButton variant="ghost" size="sm" @click="refreshAgreementStatus(course.agreement.id)">
                            <RotateCw class="mr-1 h-4 w-4" />
                            {{ t('coursePayments.refreshAgreement') }}
                          </BaseButton>
                          <BaseButton
                            v-if="canCreateAgreement && course.agreement.status === 'ACTIVE'"
                            variant="ghost"
                            size="sm"
                            @click="openEditAgreementModal(course.agreement)"
                          >
                            <Pencil class="mr-1 h-4 w-4" />
                            {{ t('common.edit') }}
                          </BaseButton>
                        </div>
                      </div>

                      <div class="mt-4 grid grid-cols-1 gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-3">
                        <div>
                          <p>{{ t('coursePayments.totalAmount') }}</p>
                          <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(course.agreement.totalAmount) }}</p>
                        </div>
                        <div>
                          <p>{{ t('coursePayments.totalPaid') }}</p>
                          <p class="mt-1 font-medium text-emerald-500">{{ formatCurrency(course.agreement.totalPaid) }}</p>
                        </div>
                        <div>
                          <p>{{ t('coursePayments.remainingAmount') }}</p>
                          <p class="mt-1 font-medium text-[var(--text-primary)]">{{ formatCurrency(course.agreement.remainingAmount) }}</p>
                        </div>
                      </div>

                      <div v-if="course.agreement.schedules?.length" class="mt-4 overflow-x-auto">
                        <table class="w-full min-w-[560px] text-sm">
                          <thead>
                            <tr class="text-left text-[var(--text-secondary)]">
                              <th class="pb-2 font-medium">{{ t('coursePayments.installment') }}</th>
                              <th class="pb-2 font-medium">{{ t('payments.amount') }}</th>
                              <th class="pb-2 font-medium">{{ t('payments.dueDate') }}</th>
                              <th class="pb-2 font-medium">{{ t('payments.status') }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(schedule, index) in course.agreement.schedules"
                              :key="schedule.id || index"
                              class="border-t text-[var(--text-primary)]"
                              :style="{ borderColor: 'var(--border-color)' }"
                            >
                              <td class="py-3">{{ schedule.installmentNumber || index + 1 }}</td>
                              <td class="py-3">{{ formatCurrency(getSchedulePaidAmount(course.agreement.id, schedule, index)) }}</td>
                              <td class="py-3">{{ formatDate(schedule.dueDate) }}</td>
                              <td class="py-3">
                                <BaseBadge :variant="getStatusVariant(schedule.status)" dot>
                                  {{ schedule.status || '-' }}
                                </BaseBadge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p v-else class="py-8 text-center text-[var(--text-secondary)]">
                {{ t('coursePayments.noEnrollments') }}
              </p>
            </BaseCard>

            <BaseCard>
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('coursePayments.transactions') }}</h3>
                <span class="text-sm text-[var(--text-secondary)]">{{ studentTransactions.length || 0 }}</span>
              </div>

              <div v-if="studentTransactions.length" class="space-y-3">
                <div
                  v-for="transaction in studentTransactions"
                  :key="transaction.id"
                  class="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/35 p-4"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p class="font-semibold text-[var(--text-primary)]">{{ formatCurrency(transaction.amount) }}</p>
                      <p class="mt-1 text-sm text-[var(--text-secondary)]">
                        {{ t('coursePayments.paidAt') }}: {{ formatDate(transaction.paidAt) }}
                      </p>
                      <p v-if="transaction.comment" class="mt-2 text-sm text-[var(--text-secondary)]">
                        {{ transaction.comment }}
                      </p>
                    </div>
                    <div class="text-sm text-[var(--text-secondary)]">
                      <p>{{ t('payments.method') }}: {{ formatPaymentMethod(transaction.method) }}</p>
                      <p class="mt-1">{{ t('courses.course') }}: {{ getAgreementCourseName(transaction.agreementId) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p v-else class="py-8 text-center text-[var(--text-secondary)]">
                {{ t('coursePayments.noTransactions') }}
              </p>
            </BaseCard>
          </template>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('payments.historyTitle') }}</h1>
            <p class="mt-1 text-[var(--text-secondary)]">{{ t('payments.historySubtitle') }}</p>
          </div>

          <BaseButton variant="secondary" :loading="historyExportLoading" @click="exportHistoryToPdf">
            <Download class="mr-2 h-4 w-4" />
            {{ t('payments.exportPdf') }}
          </BaseButton>
        </div>

        <BaseCard>
          <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div class="grid gap-4 sm:grid-cols-2 xl:min-w-[440px]">
              <BaseInput
                v-model="historyDateFrom"
                :label="t('payments.fromDate')"
                type="date"
              />
              <BaseInput
                v-model="historyDateTo"
                :label="t('payments.toDate')"
                type="date"
              />
            </div>

            <div class="flex items-end">
              <BaseButton variant="ghost" class="w-full xl:w-auto" @click="resetHistoryDates">
                {{ t('payments.resetDates') }}
              </BaseButton>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3">
            <p class="text-sm text-[var(--text-secondary)]">{{ t('payments.totalAmount') }}</p>
            <p class="mt-1 text-xl font-semibold text-[var(--text-primary)]">{{ formatCurrency(historyTotalAmount) }}</p>
          </div>
        </BaseCard>

        <div class="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <BaseTable
            :columns="historyColumns"
            :data="paginatedHistoryTransactions"
            :loading="historyLoading"
            :empty-text="t('payments.noHistoryPayments')"
            table-layout="auto"
            table-class="min-w-[1080px]"
          >
            <template #student="{ row }">
              <div>
                <p class="font-medium text-[var(--text-primary)]">{{ row.studentName }}</p>
                <p class="text-xs text-[var(--text-secondary)]">#{{ row.studentId }}</p>
              </div>
            </template>

            <template #amount="{ row }">
              <span class="whitespace-nowrap font-medium text-[var(--text-primary)]">{{ formatCurrency(row.amount) }}</span>
            </template>

            <template #method="{ row }">
              <span class="text-[var(--text-secondary)]">{{ formatPaymentMethod(row.method) }}</span>
            </template>

            <template #paidAt="{ row }">
              <span class="whitespace-nowrap text-[var(--text-secondary)]">{{ formatDate(row.paidAt) }}</span>
            </template>

            <template #agreement="{ row }">
              <span class="whitespace-nowrap text-[var(--text-secondary)]">
                {{ getAgreementCourseName(row.agreementId) }}
              </span>
            </template>
          </BaseTable>

          <div class="border-t px-4 py-3" :style="{ borderColor: 'var(--border-color)' }">
            <BasePagination
              v-model:currentPage="pagination.page.value"
              :totalPages="pagination.totalPages.value"
              :totalItems="pagination.totalElements.value"
            />
          </div>
        </div>
      </div>
    </template>

    <PaymentAgreementFormModal
      :show="showAgreementModal"
      :loading="agreementLoading"
      :agreement="editingAgreement"
      :agreements="agreements"
      :enrollments="finance?.courses || []"
      @close="closeAgreementModal"
      @submit="handleCreateAgreement"
    />

    <PaymentTransactionFormModal
      :show="showTransactionModal"
      :loading="transactionLoading"
      :agreements="agreements"
      @close="showTransactionModal = false"
      @submit="handleCreateTransaction"
    />
  </div>
</template>
