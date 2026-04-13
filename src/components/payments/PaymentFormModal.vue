<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { studentsApi } from '@/api/students'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const students = ref([])
const studentOptions = ref([])

const emptyForm = () => ({
  studentId: null,
  amount: null,
  totalDue: null,
  method: null,
  status: 'PENDING',
  dueDate: '',
  paidDate: '',
  installmentNumber: null,
  totalInstallments: null,
  comment: ''
})

const form = ref(emptyForm())

const methodOptions = computed(() => [
  { value: 'MBANK', label: t('payments.methodMbank') },
  { value: 'ODENGI', label: t('payments.methodOdengi') },
  { value: 'BALANCE_KG', label: t('payments.methodBalanceKg') },
  { value: 'ELCART', label: t('payments.methodElcart') },
  { value: 'BANK_TRANSFER', label: t('payments.methodBankTransfer') },
  { value: 'CASH', label: t('payments.methodCash') },
  { value: 'OTHER', label: t('payments.methodOther') }
])

const statusOptions = computed(() => [
  { value: 'PAID', label: t('payments.statusPaid') },
  { value: 'PENDING', label: t('payments.statusPending') },
  { value: 'OVERDUE', label: t('payments.statusOverdue') }
])

onMounted(async () => {
  try {
    const response = await studentsApi.getAll({ size: 1000 })
    students.value = response.content || response
    studentOptions.value = students.value.map(s => ({
      value: s.id,
      label: s.fullName
    }))
  } catch (e) {
    console.error('Failed to load students', e)
  }
})

watch(() => props.show, (open) => {
  if (open) {
    form.value = emptyForm()
  }
})

function handleSubmit() {
  const payload = {
    studentId: form.value.studentId ? Number(form.value.studentId) : null,
    amount: form.value.amount ? Number(form.value.amount) : null,
    totalDue: form.value.totalDue ? Number(form.value.totalDue) : null,
    method: form.value.method || null,
    status: form.value.status || null,
    dueDate: form.value.dueDate || null,
    paidDate: form.value.paidDate || null,
    installmentNumber: form.value.installmentNumber ? Number(form.value.installmentNumber) : null,
    totalInstallments: form.value.totalInstallments ? Number(form.value.totalInstallments) : null,
    comment: form.value.comment || null
  }

  emit('submit', payload)
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('payments.newPayment')"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Student -->
      <BaseSelect
        v-model="form.studentId"
        :label="t('payments.student') + ' *'"
        :options="studentOptions"
        :placeholder="t('payments.selectStudent')"
      />

      <!-- Amount & Total Due -->
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.amount"
          :label="t('payments.amount') + ' *'"
          type="number"
          placeholder="0"
        />
        <BaseInput
          v-model="form.totalDue"
          :label="t('payments.totalDue') + ' *'"
          type="number"
          placeholder="0"
        />
      </div>

      <!-- Method & Status -->
      <div class="grid grid-cols-2 gap-4">
        <BaseSelect
          v-model="form.method"
          :label="t('payments.paymentMethod')"
          :options="methodOptions"
          :placeholder="t('payments.selectMethod')"
        />
        <BaseSelect
          v-model="form.status"
          :label="t('payments.status')"
          :options="statusOptions"
        />
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.dueDate"
          :label="t('payments.dueDate')"
          type="date"
        />
        <BaseInput
          v-model="form.paidDate"
          :label="t('payments.paidDate')"
          type="date"
        />
      </div>

      <!-- Installments -->
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.installmentNumber"
          :label="t('payments.installmentNumber')"
          type="number"
          placeholder="1"
        />
        <BaseInput
          v-model="form.totalInstallments"
          :label="t('payments.totalInstallments')"
          type="number"
          placeholder="1"
        />
      </div>

      <!-- Comment -->
      <BaseTextarea
        v-model="form.comment"
        :label="t('payments.comment')"
        :placeholder="t('payments.optionalComment')"
        :rows="3"
      />
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton :loading="loading" @click="handleSubmit">
        {{ t('payments.createPayment') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

