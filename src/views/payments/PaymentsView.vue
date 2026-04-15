<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, RotateCw, Pencil } from 'lucide-vue-next'
import { studentsApi } from '@/api/students'
import { paymentAgreementsApi } from '@/api/paymentAgreements'
import { paymentTransactionsApi } from '@/api/paymentTransactions'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import PaymentAgreementFormModal from '@/components/payments/PaymentAgreementFormModal.vue'
import PaymentTransactionFormModal from '@/components/payments/PaymentTransactionFormModal.vue'
import StudentPickerPanel from '@/components/students/StudentPickerPanel.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const selectedStudent = ref(null)
const finance = ref(null)
const agreements = ref([])
const loading = ref(false)
const showAgreementModal = ref(false)
const showTransactionModal = ref(false)
const agreementLoading = ref(false)
const transactionLoading = ref(false)
const editingAgreement = ref(null)

const canCreateAgreement = computed(() => authStore.hasPermission('PAYMENT_CREATE'))
const canCreateTransaction = computed(() => authStore.hasPermission('PAYMENT_CREATE'))

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ru-RU')
}

function formatCurrency(value) {
  if (!value) return `0 ${t('common.currency')}`
  return `${new Intl.NumberFormat('ru-RU').format(value)} ${t('common.currency')}`
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
    return
  }

  loading.value = true
  try {
    const [financeResponse, agreementsResponse] = await Promise.all([
      studentsApi.getFinance(selectedStudent.value.id),
      paymentAgreementsApi.getByStudent(selectedStudent.value.id)
    ])

    finance.value = financeResponse
    agreements.value = agreementsResponse
  } catch (error) {
    toast.error(t('payments.failedLoad'))
  } finally {
    loading.value = false
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
    toast.error(editingAgreement.value
      ? t('coursePayments.failedUpdateAgreement')
      : t('coursePayments.failedCreateAgreement'))
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
  } catch (error) {
    toast.error(t('coursePayments.failedCreateTransaction'))
  } finally {
    transactionLoading.value = false
  }
}

async function refreshAgreementStatus(agreementId) {
  try {
    await paymentAgreementsApi.refreshStatus(agreementId)
    await fetchFinance()
  } catch (error) {
    toast.error(t('coursePayments.failedRefreshAgreement'))
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
</script>

<template>
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
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <BaseCard>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('payments.totalAmount') }}</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">{{ formatCurrency(finance.totalCourseAmount) }}</p>
          </BaseCard>
          <BaseCard>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('students.totalPaid') }}</p>
            <p class="mt-1 text-2xl font-bold text-emerald-400">{{ formatCurrency(finance.totalPaid) }}</p>
          </BaseCard>
          <BaseCard>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('students.balance') }}</p>
            <p class="mt-1 text-2xl font-bold text-red-400">{{ formatCurrency(finance.balance) }}</p>
          </BaseCard>
          <BaseCard>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('payments.nextDueDate') }}</p>
            <p class="mt-1 text-2xl font-bold text-[var(--text-primary)]">{{ formatDate(finance.nextDueDate) }}</p>
            <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ formatCurrency(finance.nextDueAmount) }}</p>
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
              class="rounded-2xl border border-white/10 bg-white/5 p-4"
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

                <div v-if="course.agreement" class="rounded-xl border border-white/10 bg-[var(--bg-secondary)] p-4">
                  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div class="flex items-center gap-3">
                        <p class="font-medium text-[var(--text-primary)]">{{ t('coursePayments.agreement') }}</p>
                        <BaseBadge :variant="getStatusVariant(course.agreement.status)" dot>
                          {{ course.agreement.status || '-' }}
                        </BaseBadge>
                      </div>
                      <p class="mt-1 text-sm text-[var(--text-secondary)]">
                        {{ course.agreement.type }} • {{ t('coursePayments.firstDueDate') }}: {{ formatDate(course.agreement.firstDueDate) }}
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
                      <p class="mt-1 font-medium text-emerald-400">{{ formatCurrency(course.agreement.totalPaid) }}</p>
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
                          class="border-t border-white/5 text-[var(--text-primary)]"
                        >
                          <td class="py-3">{{ schedule.installmentNumber || index + 1 }}</td>
                          <td class="py-3">{{ formatCurrency(schedule.amount) }}</td>
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
            <span class="text-sm text-[var(--text-secondary)]">{{ finance.transactions?.length || 0 }}</span>
          </div>

          <div v-if="finance.transactions?.length" class="space-y-3">
            <div
              v-for="transaction in finance.transactions"
              :key="transaction.id"
              class="rounded-xl border border-white/10 bg-white/5 p-4"
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
                  <p>{{ t('payments.method') }}: {{ transaction.method || '-' }}</p>
                  <p class="mt-1">{{ t('coursePayments.agreement') }}: #{{ transaction.agreementId }}</p>
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
