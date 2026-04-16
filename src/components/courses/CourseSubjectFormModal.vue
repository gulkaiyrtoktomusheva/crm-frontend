<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { subjectsApi } from '@/api/subjects'
import { usersApi } from '@/api/users'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  courseSubject: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const subjects = ref([])
const teachers = ref([])

const subjectOptions = computed(() => subjects.value.map((subject) => ({
  value: subject.id,
  label: subject.name
})))

const teacherOptions = computed(() => teachers.value.map((teacher) => ({
  value: teacher.id,
  label: teacher.fullName
})))

const form = ref({
  subjectId: null,
  teacherId: null
})

async function fetchOptions() {
  try {
    const [subjectsResponse, usersResponse] = await Promise.all([
      subjectsApi.getAll(),
      usersApi.getAll({ roleName: 'TEACHER' })
    ])
    subjects.value = subjectsResponse
    teachers.value = usersResponse
  } catch (error) {
    subjects.value = []
    teachers.value = []
  }
}

watch(() => props.show, (open) => {
  if (!open) return

  fetchOptions()

  if (props.courseSubject) {
    form.value = {
      subjectId: props.courseSubject.subjectId || null,
      teacherId: props.courseSubject.teacherId || null
    }
    return
  }

  form.value = {
    subjectId: null,
    teacherId: null
  }
})

function handleSubmit() {
  emit('submit', {
    subjectId: form.value.subjectId ? Number(form.value.subjectId) : null,
    teacherId: form.value.teacherId ? Number(form.value.teacherId) : null
  })
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="courseSubject ? t('courses.editSubjectTeacher') : t('courses.addSubjectTeacher')"
    size="lg"
    @close="$emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseSelect
        v-model="form.subjectId"
        :label="t('groups.subject') + ' *'"
        :options="subjectOptions"
        :placeholder="t('groups.selectSubject')"
      />

      <BaseSelect
        v-model="form.teacherId"
        :label="t('groups.teacher') + ' *'"
        :options="teacherOptions"
        :placeholder="t('users.selectRole')"
      />
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!form.subjectId || !form.teacherId"
        @click="handleSubmit"
      >
        {{ courseSubject ? t('common.save') : t('common.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
