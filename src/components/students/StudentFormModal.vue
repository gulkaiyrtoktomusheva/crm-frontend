<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  student: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const emptyForm = () => ({
  fullName: '',
  phone: '',
  whatsapp: '',
  school: '',
  grade: null,
  city: '',
  parentName: '',
  parentPhone: '',
  ortDate: '',
  status: 'ACTIVE',
  source: null,
  referredByStudentId: ''
})

const form = ref(emptyForm())

const sourceOptions = computed(() => [
  { value: 'INSTAGRAM', label: t('sources.INSTAGRAM') },
  { value: 'TIKTOK', label: t('sources.TIKTOK') },
  { value: 'FACEBOOK', label: t('sources.FACEBOOK') },
  { value: 'WHATSAPP', label: t('sources.WHATSAPP') },
  { value: 'REFERRAL', label: t('sources.REFERRAL') },
  { value: 'OTHER', label: t('sources.OTHER') }
])

const statusOptions = computed(() => [
  { value: 'ACTIVE', label: t('students.statusActive') },
  { value: 'AT_RISK', label: t('students.statusAtRisk') },
  { value: 'DROPPED', label: t('students.statusDropped') },
  { value: 'COMPLETED', label: t('students.statusCompleted') }
])

const gradeOptions = computed(() => [
  { value: 10, label: '10 ' + t('students.gradeClass') },
  { value: 11, label: '11 ' + t('students.gradeClass') }
])

watch(() => props.show, (open) => {
  if (!open) return

  if (props.student) {
    form.value = {
      ...emptyForm(),
      ...props.student,
      referredByStudentId: props.student.referredByStudentId || ''
    }
  } else {
    form.value = emptyForm()
  }
})

function handleSubmit() {
  const payload = {
    fullName: form.value.fullName,
    phone: form.value.phone,
    whatsapp: form.value.whatsapp,
    school: form.value.school,
    grade: form.value.grade ? Number(form.value.grade) : null,
    city: form.value.city,
    parentName: form.value.parentName,
    parentPhone: form.value.parentPhone,
    ortDate: form.value.ortDate || null,
    status: form.value.status,
    source: form.value.source,
    referredByStudentId: form.value.referredByStudentId
      ? Number(form.value.referredByStudentId)
      : null
  }

  emit('submit', payload)
}

</script>

<template>
  <BaseModal
      :show="show"
      :title="student ? t('students.editStudent') : t('students.newStudent')"
      size="lg"
      @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.fullName" :label="t('students.fullName') + ' *'" :placeholder="t('students.enterFullName')" />
        <BaseSelect v-model="form.status" :label="t('leads.status')" :options="statusOptions" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.phone" :label="t('students.phone')" placeholder="+996 XXX XXX XXX" />
        <BaseInput v-model="form.whatsapp" :label="t('students.whatsapp')" placeholder="+996 XXX XXX XXX" />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <BaseInput v-model="form.school" :label="t('students.school')" :placeholder="t('students.schoolName')" />
        <BaseSelect v-model="form.grade" :label="t('students.grade')" :options="gradeOptions" :placeholder="t('students.selectGrade')" />
        <BaseInput v-model="form.city" :label="t('students.city')" :placeholder="t('students.city')" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.parentName" :label="t('students.parentName')" :placeholder="t('students.parentNamePlaceholder')" />
        <BaseInput v-model="form.parentPhone" :label="t('students.parentPhone')" placeholder="+996 XXX XXX XXX" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.ortDate" :label="t('students.ortDate')" type="date" />
        <BaseSelect v-model="form.source" :label="t('students.source')" :options="sourceOptions" :placeholder="t('students.selectSource')" />
      </div>

      <BaseInput
        v-model="form.referredByStudentId"
        :label="t('students.referredByStudentId')"
        type="number"
        placeholder="ID"
      />
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton :loading="loading" @click="handleSubmit">
        {{ student ? t('students.saveChanges') : t('students.createStudent') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
