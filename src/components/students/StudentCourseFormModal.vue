<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { coursesApi } from '@/api/courses'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  studentId: {
    type: Number,
    required: true
  },
  enrollment: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const courses = ref([])

const courseOptions = computed(() => courses.value.map((course) => ({
  value: course.id,
  label: course.name
})))

const emptyForm = () => ({
  courseId: null,
  discountAmount: '',
  status: 'ACTIVE'
})

const form = ref(emptyForm())

const statusOptions = computed(() => [
  { value: 'ACTIVE', label: t('enrollments.statusActive') },
  { value: 'COMPLETED', label: t('enrollments.statusCompleted') },
  { value: 'CANCELLED', label: t('enrollments.statusCancelled') },
  { value: 'PAUSED', label: t('enrollments.statusPaused') }
])

onMounted(async () => {
  try {
    courses.value = await coursesApi.getAll()
  } catch (error) {
    courses.value = []
  }
})

watch(() => props.show, (open) => {
  if (!open) {
    return
  }

  if (props.enrollment) {
    form.value = {
      courseId: props.enrollment.courseId || null,
      discountAmount: props.enrollment.discountAmount ?? '',
      status: props.enrollment.status || 'ACTIVE'
    }
    return
  }

  form.value = emptyForm()
})

function handleSubmit() {
  emit('submit', {
    studentId: props.studentId,
    courseId: form.value.courseId ? Number(form.value.courseId) : null,
    discountAmount: form.value.discountAmount === '' ? 0 : Number(form.value.discountAmount),
    status: form.value.status || null
  })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="enrollment ? t('coursePayments.editEnrollment') : t('coursePayments.newEnrollment')"
    size="lg"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseSelect
        v-model="form.courseId"
        :label="t('courses.course') + ' *'"
        :options="courseOptions"
        :placeholder="t('courses.selectCourse')"
      />

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.discountAmount"
          :label="t('coursePayments.discountAmount')"
          type="number"
          placeholder="0"
        />
        <BaseSelect
          v-model="form.status"
          :label="t('enrollments.status')"
          :options="statusOptions"
        />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!form.courseId"
        @click="handleSubmit"
      >
        {{ enrollment ? t('common.save') : t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
