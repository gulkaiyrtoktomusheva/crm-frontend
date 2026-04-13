<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { groupsApi } from '@/api/groups'
import { subjectsApi } from '@/api/subjects'
import { usersApi } from '@/api/users'
import { useToast } from '@/composables/useToast'
import GroupCard from '@/components/groups/GroupCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import { Plus, Users } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const groups = ref([])
const subjects = ref([])
const loading = ref(true)
const subjectFilter = ref(null)
const openCreate = ref(false)

const subjectOptions = ref([])
const teachers = ref([])
const teachersOptions = ref([])

const createForm = ref({
  name: '',
  subjectId: null,
  teacherId: null,
  startDate: null,
  endDate: null
})

const creating = ref(false)

async function fetchTeachers() {
  try {
    const data = await usersApi.getAll({ role: 'TEACHER' })
    teachers.value = data
    teachersOptions.value = data.map(t => ({ value: t.id, label: t.fullName }))
  } catch (e) {
    toast.error(t('groups.failedLoadTeachers'))
  }
}

async function fetchGroups() {
  loading.value = true
  try {
    const params = {}
    if (subjectFilter.value) params.subjectId = subjectFilter.value
    groups.value = await groupsApi.getAll(params)
  } catch (e) {
    toast.error(t('groups.failedLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const subjectsData = await subjectsApi.getAll()
    subjectOptions.value = subjectsData.map(s => ({ value: s.id, label: s.name }))
  } catch (e) {
    console.error(e)
  }
  fetchGroups()
})

watch(subjectFilter, fetchGroups)

watch(openCreate, async (v) => {
  if (v) {
    // когда открыли модалку — подгрузи teachers если пусто
    if (!teachers.value.length) await fetchTeachers()
  }
})

async function createGroup() {
  if (!createForm.value.name?.trim()) return toast.warning(t('groups.nameRequired'))
  if (!createForm.value.subjectId) return toast.warning(t('groups.subjectRequired'))

  creating.value = true
  try {
    await groupsApi.create({
      name: createForm.value.name,
      subjectId: createForm.value.subjectId,
      teacherId: createForm.value.teacherId, // Long или null
      startDate: createForm.value.startDate,
      endDate: createForm.value.endDate
    })
    toast.success(t('groups.groupCreated'))
    openCreate.value = false

    // reset
    createForm.value = { name: '', subjectId: null, teacherId: null, startDate: null, endDate: null }

    await fetchGroups()
  } catch (e) {
    toast.error(t('groups.failedCreate'))
  } finally {
    creating.value = false
  }
}

function viewGroup(group) {
  router.push(`/groups/${group.id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('groups.title') }}</h1>
        <p class="text-[var(--text-secondary)] mt-1">
          {{ t('groups.groupsCount', { count: groups.length }) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseSelect
          v-model="subjectFilter"
          :options="subjectOptions"
          :placeholder="t('common.allSubjects')"
          class="w-48"
        />

        <BaseButton @click="openCreate = true">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('groups.newGroup') }}
        </BaseButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 p-5">
        <BaseSkeleton height="1rem" width="30%" class="mb-2" />
        <BaseSkeleton height="1.5rem" width="60%" class="mb-4" />
        <div class="space-y-2">
          <BaseSkeleton height="1rem" />
          <BaseSkeleton height="1rem" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <BaseEmptyState
      v-else-if="groups.length === 0"
      :icon="Users"
      :title="t('groups.noGroups')"
      :description="t('groups.noGroupsDescription')"
    >
      <template #action>
        <BaseButton @click="openCreate = true">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('groups.createGroup') }}
        </BaseButton>
      </template>
    </BaseEmptyState>

    <!-- Groups grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <GroupCard
        v-for="group in groups"
        :key="group.id"
        :group="group"
        @click="viewGroup"
      />
    </div>

    <!-- Create Group Modal -->
    <div
        v-if="openCreate"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="openCreate = false"
    >
      <div class="w-full max-w-lg rounded-2xl bg-[var(--bg-secondary)] border border-white/10 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('groups.createGroup') }}</h2>
          <button class="text-[var(--text-secondary)] hover:text-white" @click="openCreate = false">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-[var(--text-secondary)] mb-1">{{ t('groups.name') }}</label>
            <input
                v-model="createForm.name"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[var(--text-primary)]"
                placeholder="e.g. Java Core - Evening"
            />
          </div>

          <div>
            <label class="block text-sm text-[var(--text-secondary)] mb-1">{{ t('groups.subject') }}</label>
            <BaseSelect
                v-model="createForm.subjectId"
                :options="subjectOptions"
                :placeholder="t('groups.selectSubject')"
            />
          </div>

          <div>
            <label class="block text-sm text-[var(--text-secondary)] mb-1">{{ t('groups.teacher') }}</label>
            <BaseSelect
                v-model="createForm.teacherId"
                :options="teachersOptions"
                :placeholder="t('common.optional')"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1">{{ t('groups.startDate') }}</label>
              <input
                  v-model="createForm.startDate"
                  type="date"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label class="block text-sm text-[var(--text-secondary)] mb-1">{{ t('groups.endDate') }}</label>
              <input
                  v-model="createForm.endDate"
                  type="date"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <BaseButton variant="ghost" @click="openCreate = false">{{ t('common.cancel') }}</BaseButton>
            <BaseButton :loading="creating" @click="createGroup">{{ t('common.create') }}</BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
