<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { groupsApi } from '@/api/groups'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  student: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const groups = ref([])

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
  referredBy: '',
  groupIds: []
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

onMounted(async () => {
  try {
    groups.value = await groupsApi.getAll()
  } catch (e) {
    console.error(e)
  }
})

watch(() => props.show, (open) => {
  if (!open) return

  if (props.student) {
    form.value = {
      ...emptyForm(),
      ...props.student,
      groupIds: (props.student.groups || []).map(g => g.id)
    }
  } else {
    form.value = emptyForm()
  }
})

function toggleGroup(id) {
  const ids = form.value.groupIds
  const index = ids.indexOf(id)
  if (index > -1) ids.splice(index, 1)
  else ids.push(id)
}

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
    referredBy: form.value.referredBy,
    groupIds: form.value.groupIds
  }

  console.log('PAYLOAD =>', payload)
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

      <div>
        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">{{ t('students.groups') }}</label>
        <div class="flex flex-wrap gap-2">
          <button
              v-for="group in groups"
              :key="group.id"
              type="button"
              @click="toggleGroup(group.id)"
              :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
              form.groupIds.includes(group.id)
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10'
            ]"
          >
            {{ group.name }}
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      <BaseButton :loading="loading" @click="handleSubmit">
        {{ student ? t('students.saveChanges') : t('students.createStudent') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>