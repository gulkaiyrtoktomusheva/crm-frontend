<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  lead: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const form = ref({
  fullName: '',
  phone: '',
  whatsapp: '',
  parentName: '',
  parentPhone: '',
  source: null,
  status: 'NEW',
  comment: '',
  referredBy: '',
  nextContactDate: ''
})

const sourceOptions = computed(() => [
  { value: 'INSTAGRAM', label: t('sources.INSTAGRAM') },
  { value: 'TIKTOK', label: t('sources.TIKTOK') },
  { value: 'FACEBOOK', label: t('sources.FACEBOOK') },
  { value: 'WHATSAPP', label: t('sources.WHATSAPP') },
  { value: 'REFERRAL', label: t('sources.REFERRAL') },
  { value: 'OTHER', label: t('sources.OTHER') }
])

const statusOptions = computed(() => [
  { value: 'NEW', label: t('leads.statusNew') },
  { value: 'CONTACTED', label: t('leads.statusContacted') },
  { value: 'THINKING', label: t('leads.statusThinking') },
  { value: 'PAID', label: t('leads.statusPaid') },
  { value: 'REJECTED', label: t('leads.statusRejected') }
])

watch(() => props.show, (newVal) => {
  if (newVal && props.lead) {
    form.value = { ...props.lead }
  } else if (newVal) {
    form.value = {
      fullName: '',
      phone: '',
      whatsapp: '',
      parentName: '',
      parentPhone: '',
      source: null,
      status: 'NEW',
      comment: '',
      referredBy: '',
      nextContactDate: ''
    }
  }
})

function handleSubmit() {
  emit('submit', form.value)
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="lead ? t('leads.editLead') : t('leads.newLead')"
    size="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.fullName"
          :label="t('leads.fullName') + ' *'"
          :placeholder="t('leads.enterFullName')"
        />
        <BaseSelect
          v-model="form.source"
          :label="t('leads.source') + ' *'"
          :options="sourceOptions"
          :placeholder="t('leads.selectSource')"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.phone"
          :label="t('leads.phone')"
          placeholder="+996 XXX XXX XXX"
        />
        <BaseInput
          v-model="form.whatsapp"
          :label="t('leads.whatsapp')"
          placeholder="+996 XXX XXX XXX"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.parentName"
          :label="t('leads.parentName')"
          :placeholder="t('leads.enterParentName')"
        />
        <BaseInput
          v-model="form.parentPhone"
          :label="t('leads.parentPhone')"
          placeholder="+996 XXX XXX XXX"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseSelect
          v-model="form.status"
          :label="t('leads.status')"
          :options="statusOptions"
        />
        <BaseInput
          v-model="form.nextContactDate"
          :label="t('leads.nextContactDate')"
          type="date"
        />
      </div>

      <BaseInput
        v-model="form.referredBy"
        :label="t('leads.referredBy')"
        :placeholder="t('leads.whoReferred')"
      />

      <BaseTextarea
        v-model="form.comment"
        :label="t('leads.comment')"
        :placeholder="t('leads.addNotes')"
        :rows="3"
      />
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton :loading="loading" @click="handleSubmit">
        {{ lead ? t('leads.saveChanges') : t('leads.createLead') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
