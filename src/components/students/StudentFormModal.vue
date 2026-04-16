<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { studentsApi } from '@/api/students'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const { t } = useI18n()

const props = defineProps({
  show: Boolean,
  student: Object,
  loading: Boolean
})

const emit = defineEmits(['close', 'submit'])
const isEditMode = computed(() => Boolean(props.student?.id))

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
const referralSearch = ref('')
const referralStudents = ref([])
const referralLoading = ref(false)
const referralDropdownOpen = ref(false)
const referralRootRef = ref(null)
const selectedReferralStudent = ref(null)

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
    referralSearch.value = ''
    selectedReferralStudent.value = null
  } else {
    form.value = emptyForm()
    referralSearch.value = ''
    selectedReferralStudent.value = null
  }
})

watch(() => props.show, async (open) => {
  if (!open) {
    referralDropdownOpen.value = false
    return
  }

  if (form.value.referredByStudentId) {
    await loadSelectedReferralStudent(form.value.referredByStudentId)
  }
})

watch(referralSearch, async () => {
  if (!referralDropdownOpen.value) return
  await fetchReferralStudents()
})

function handleDocumentClick(event) {
  if (!referralRootRef.value?.contains(event.target)) {
    referralDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

async function fetchReferralStudents() {
  referralLoading.value = true
  try {
    const response = await studentsApi.getAll({
      search: referralSearch.value || undefined,
      size: 12,
      page: 0
    })

    referralStudents.value = (response.content || response || [])
      .filter((studentOption) => studentOption.id !== props.student?.id)
  } catch (error) {
    referralStudents.value = []
  } finally {
    referralLoading.value = false
  }
}

async function loadSelectedReferralStudent(studentId) {
  try {
    const studentOption = await studentsApi.getById(studentId)
    selectedReferralStudent.value = studentOption
    referralSearch.value = studentOption.fullName || ''
  } catch (error) {
    selectedReferralStudent.value = null
    referralSearch.value = ''
  }
}

async function openReferralDropdown() {
  if (isEditMode.value) return
  referralDropdownOpen.value = true
  await fetchReferralStudents()
}

function selectReferralStudent(studentOption) {
  if (isEditMode.value) return
  form.value.referredByStudentId = studentOption.id
  selectedReferralStudent.value = studentOption
  referralSearch.value = studentOption.fullName
  referralDropdownOpen.value = false
}

function clearReferralStudent() {
  if (isEditMode.value) return
  form.value.referredByStudentId = ''
  selectedReferralStudent.value = null
  referralSearch.value = ''
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
    referredByStudentId: isEditMode.value
      ? null
      : (form.value.referredByStudentId ? Number(form.value.referredByStudentId) : null)
  }

  emit('submit', payload)
}

</script>

<template>
  <BaseModal
      :show="show"
      :title="student ? t('students.editStudent') : t('students.newStudent')"
      size="lg"
      body-overflow-visible
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

      <div v-if="!isEditMode" ref="referralRootRef" class="space-y-2">
        <label class="block text-sm font-medium text-[var(--text-primary)]">
          {{ t('students.referredByStudentId') }}
        </label>

        <div class="relative">
          <BaseSearchInput
            v-model="referralSearch"
            :placeholder="t('students.searchStudents')"
            @focus="openReferralDropdown"
          />

          <div
            v-if="referralDropdownOpen"
            class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
          >
            <div v-if="referralLoading" class="space-y-3 p-3">
              <BaseSkeleton height="4rem" rounded="rounded-xl" />
              <BaseSkeleton height="4rem" rounded="rounded-xl" />
            </div>

            <div v-else-if="referralStudents.length" class="max-h-72 overflow-y-auto p-2">
              <button
                v-for="studentOption in referralStudents"
                :key="studentOption.id"
                type="button"
                class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                @click="selectReferralStudent(studentOption)"
              >
                <BaseAvatar :name="studentOption.fullName" size="sm" />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-[var(--text-primary)]">{{ studentOption.fullName }}</p>
                  <p class="truncate text-sm text-[var(--text-secondary)]">
                    {{ studentOption.phone || studentOption.city || '-' }}
                  </p>
                </div>
              </button>
            </div>

            <p v-else class="px-4 py-5 text-center text-sm text-[var(--text-secondary)]">
              {{ t('students.noStudentsFound') }}
            </p>
          </div>
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
