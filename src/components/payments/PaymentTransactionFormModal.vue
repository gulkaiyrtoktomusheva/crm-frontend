<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  agreements: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const methodOptions = computed(() => [
  { value: 'MBANK', label: t('payments.methodMbank') },
  { value: 'ODENGI', label: t('payments.methodOdengi') },
  { value: 'BALANCE_KG', label: t('payments.methodBalanceKg') },
  { value: 'ELCART', label: t('payments.methodElcart') },
  { value: 'BANK_TRANSFER', label: t('payments.methodBankTransfer') },
  { value: 'CASH', label: t('payments.methodCash') },
  { value: 'OTHER', label: t('payments.methodOther') }
])

const agreementOptions = computed(() => props.agreements.map((agreement) => ({
  value: agreement.id,
  label: `${agreement.courseName || '-'} • ${agreement.totalAmount || 0}`
})))

const emptyForm = () => ({
  agreementId: null,
  amount: '',
  paidAt: '',
  method: null,
  comment: ''
})

const form = ref(emptyForm())

watch(() => props.show, (open) => {
  if (open) {
    form.value = emptyForm()
  }
})

function handleSubmit() {
  emit('submit', {
    agreementId: form.value.agreementId ? Number(form.value.agreementId) : null,
    amount: form.value.amount === '' ? null : Number(form.value.amount),
    paidAt: form.value.paidAt || null,
    method: form.value.method || null,
    comment: form.value.comment || null
  })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('coursePayments.newTransaction')"
    size="lg"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseSelect
        v-model="form.agreementId"
        :label="t('coursePayments.agreement') + ' *'"
        :options="agreementOptions"
        :placeholder="t('coursePayments.selectAgreement')"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.amount"
          :label="t('payments.amount') + ' *'"
          type="number"
          placeholder="0"
        />
        <BaseInput
          v-model="form.paidAt"
          :label="t('coursePayments.paidAt')"
          type="date"
        />
      </div>

      <BaseSelect
        v-model="form.method"
        :label="t('payments.paymentMethod')"
        :options="methodOptions"
        :placeholder="t('payments.selectMethod')"
      />

      <BaseTextarea
        v-model="form.comment"
        :label="t('payments.comment')"
        :placeholder="t('payments.optionalComment')"
        :rows="3"
      />
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!form.agreementId || form.amount === ''"
        @click="handleSubmit"
      >
        {{ t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
