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
  loading: Boolean,
  course: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const statusOptions = computed(() => [
  { value: 'PLANNED', label: t('courses.statusPlanned') },
  { value: 'ACTIVE', label: t('courses.statusActive') },
  { value: 'COMPLETED', label: t('courses.statusCompleted') },
  { value: 'CANCELLED', label: t('courses.statusCancelled') }
])

const emptyForm = () => ({
  name: '',
  startDate: '',
  endDate: '',
  price: '',
  status: 'PLANNED'
})

const form = ref(emptyForm())

watch(() => props.show, (open) => {
  if (!open) return

  if (props.course) {
    form.value = {
      name: props.course.name || '',
      startDate: props.course.startDate || '',
      endDate: props.course.endDate || '',
      price: props.course.price ?? '',
      status: props.course.status || 'PLANNED'
    }
    return
  }

  form.value = emptyForm()
})

function handleSubmit() {
  emit('submit', {
    name: form.value.name.trim(),
    startDate: form.value.startDate || null,
    endDate: form.value.endDate || null,
    price: form.value.price === '' ? null : Number(form.value.price),
    status: form.value.status || null
  })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="course ? t('courses.editCourse') : t('courses.newCourse')"
    size="lg"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseInput
        v-model="form.name"
        :label="t('courses.name') + ' *'"
        :placeholder="t('courses.namePlaceholder')"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.price"
          :label="t('courses.price') + ' *'"
          type="number"
          placeholder="0"
        />
        <BaseSelect
          v-model="form.status"
          :label="t('courses.status')"
          :options="statusOptions"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.startDate"
          :label="t('courses.startDate')"
          type="date"
        />
        <BaseInput
          v-model="form.endDate"
          :label="t('courses.endDate')"
          type="date"
        />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!form.name.trim() || form.price === ''"
        @click="handleSubmit"
      >
        {{ course ? t('common.save') : t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
