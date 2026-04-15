<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  agreements: {
    type: Array,
    default: () => []
  },
  enrollments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const typeOptions = computed(() => [
  { value: 'FULL', label: t('coursePayments.agreementTypeFull') },
  { value: 'INSTALLMENT', label: t('coursePayments.agreementTypeInstallment') }
])

const occupiedEnrollmentIds = computed(() => new Set(
  props.agreements.map((agreement) => agreement.studentCourseId).filter(Boolean)
))

const enrollmentOptions = computed(() => props.enrollments
  .filter((enrollment) => !occupiedEnrollmentIds.value.has(enrollment.studentCourseId || enrollment.id))
  .map((enrollment) => ({
    value: enrollment.studentCourseId || enrollment.id,
    label: `${enrollment.courseName} • ${enrollment.finalPrice || enrollment.coursePrice || 0}`
  })))

const emptyForm = () => ({
  studentCourseId: null,
  type: 'FULL',
  firstDueDate: '',
  monthsCount: 1,
  billingDay: ''
})

const form = ref(emptyForm())

watch(() => props.show, (open) => {
  if (open) {
    form.value = emptyForm()
  }
})

function handleSubmit() {
  emit('submit', {
    studentCourseId: form.value.studentCourseId ? Number(form.value.studentCourseId) : null,
    type: form.value.type || null,
    firstDueDate: form.value.firstDueDate || null,
    monthsCount: Number(form.value.monthsCount || 1),
    billingDay: form.value.billingDay === '' ? null : Number(form.value.billingDay)
  })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('coursePayments.newAgreement')"
    size="lg"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseSelect
        v-model="form.studentCourseId"
        :label="t('coursePayments.enrollment') + ' *'"
        :options="enrollmentOptions"
        :placeholder="t('coursePayments.selectEnrollment')"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseSelect
          v-model="form.type"
          :label="t('coursePayments.agreementType') + ' *'"
          :options="typeOptions"
        />
        <BaseInput
          v-model="form.firstDueDate"
          :label="t('coursePayments.firstDueDate') + ' *'"
          type="date"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.monthsCount"
          :label="t('coursePayments.monthsCount') + ' *'"
          type="number"
          min="1"
        />
        <BaseInput
          v-model="form.billingDay"
          :label="t('coursePayments.billingDay')"
          type="number"
          min="1"
          max="31"
        />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!form.studentCourseId || !form.type || !form.firstDueDate"
        @click="handleSubmit"
      >
        {{ t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
