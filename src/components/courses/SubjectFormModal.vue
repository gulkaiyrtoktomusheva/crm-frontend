<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const name = ref('')

watch(() => props.show, (open) => {
  if (open) {
    name.value = ''
  }
})

function handleSubmit() {
  emit('submit', { name: name.value.trim() })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="t('courses.createSubject')"
    size="md"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseInput
        v-model="name"
        :label="`${t('courses.subjectName')} *`"
        :placeholder="t('courses.subjectNamePlaceholder')"
      />
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton :loading="loading" :disabled="!name.trim()" @click="handleSubmit">
        {{ t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
