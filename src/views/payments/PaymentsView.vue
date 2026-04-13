<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { paymentsApi } from '@/api/payments'
import { useToast } from '@/composables/useToast'
import { usePagination } from '@/composables/usePagination'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge.vue'
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import { Wallet, Clock, AlertTriangle, Check, Plus } from 'lucide-vue-next'

const { t } = useI18n()
const toast = useToast()

const payments = ref([])
const loading = ref(true)
const statusFilter = ref(null)
const showPaymentModal = ref(false)
const modalLoading = ref(false)

const pagination = usePagination()

const columns = computed(() => [
  { key: 'student', label: t('payments.student') },
  { key: 'amount', label: t('payments.amount') },
  { key: 'installment', label: t('payments.installment') },
  { key: 'method', label: t('payments.method') },
  { key: 'dueDate', label: t('payments.dueDate') },
  { key: 'status', label: t('payments.status') },
  { key: 'actions', label: '', width: '100px' }
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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('payments.title') }}</h1>
        <p class="text-[var(--text-secondary)] mt-1">
          {{ t('payments.subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseSelect
          v-model="statusFilter"
          :options="statusOptions"
          :placeholder="t('common.allStatuses')"
          class="w-40"
        />
        <BaseButton @click="showPaymentModal = true">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('payments.createPayment') }}
        </BaseButton>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 overflow-hidden">
      <BaseTable :columns="columns" :data="payments" :loading="loading">
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
