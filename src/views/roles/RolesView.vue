<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Shield, Plus, Pencil, Trash2, Check } from 'lucide-vue-next'
import { rolesApi } from '@/api/roles'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseTable from '@/components/ui/BaseTable.vue'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const roles = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const modalLoading = ref(false)
const editingRole = ref(null)

const form = ref({
  name: '',
  permissions: []
})

const permissionGroups = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permissions: ['DASHBOARD_VIEW']
  },
  {
    key: 'users',
    label: 'Users',
    permissions: ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE']
  },
  {
    key: 'courses',
    label: 'Courses',
    permissions: ['COURSE_VIEW', 'COURSE_CREATE', 'COURSE_UPDATE', 'COURSE_DELETE', 'COURSE_MANAGE_SUBJECTS']
  },
  {
    key: 'roles',
    label: 'Roles',
    permissions: ['ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE']
  },
  {
    key: 'subjects',
    label: 'Subjects',
    permissions: ['SUBJECT_VIEW', 'SUBJECT_CREATE', 'SUBJECT_DELETE']
  },
  {
    key: 'groups',
    label: 'Groups',
    permissions: ['GROUP_VIEW', 'GROUP_CREATE', 'GROUP_UPDATE', 'GROUP_DELETE', 'GROUP_MANAGE_STUDENTS']
  },
  {
    key: 'students',
    label: 'Students',
    permissions: ['STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'STUDENT_DELETE']
  },
  {
    key: 'leads',
    label: 'Leads',
    permissions: ['LEAD_VIEW', 'LEAD_CREATE', 'LEAD_UPDATE', 'LEAD_DELETE']
  },
  {
    key: 'payments',
    label: 'Payments',
    permissions: ['PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_UPDATE', 'PAYMENT_DELETE']
  },
  {
    key: 'attendance',
    label: 'Attendance',
    permissions: ['ATTENDANCE_VIEW', 'ATTENDANCE_MARK']
  },
  {
    key: 'mockExams',
    label: 'Mock Exams',
    permissions: ['MOCK_EXAM_VIEW', 'MOCK_EXAM_CREATE', 'MOCK_EXAM_UPDATE', 'MOCK_EXAM_DELETE', 'MOCK_EXAM_SCORE_MANAGE']
  }
]

const columns = computed(() => [
  { key: 'role', label: t('roles.role'), width: '30%' },
  { key: 'permissions', label: t('roles.permissions'), width: '50%' },
  { key: 'actions', label: '', width: '140px' }
])

const filteredRoles = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return roles.value
  }

  return roles.value.filter((role) => {
    const haystack = [
      role.name,
      ...(role.permissions || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const canCreate = computed(() => authStore.hasPermission('ROLE_CREATE'))
const canUpdate = computed(() => authStore.hasPermission('ROLE_UPDATE'))
const canDelete = computed(() => authStore.hasPermission('ROLE_DELETE'))

async function fetchRoles() {
  loading.value = true
  try {
    roles.value = await rolesApi.getAll()
  } catch (error) {
    toast.error(t('roles.failedLoad'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchRoles)

function resetForm() {
  form.value = {
    name: '',
    permissions: []
  }
}

function openCreateModal() {
  editingRole.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(role) {
  editingRole.value = role
  form.value = {
    name: role.name || '',
    permissions: [...(role.permissions || [])]
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingRole.value = null
  resetForm()
}

function hasPermission(permission) {
  return form.value.permissions.includes(permission)
}

function togglePermission(permission) {
  if (hasPermission(permission)) {
    form.value.permissions = form.value.permissions.filter((item) => item !== permission)
    return
  }

  form.value.permissions = [...form.value.permissions, permission]
}

function toggleGroup(group) {
  const allSelected = isGroupSelected(group.permissions)
  if (allSelected) {
    form.value.permissions = form.value.permissions.filter((item) => !group.permissions.includes(item))
    return
  }

  form.value.permissions = Array.from(new Set([...form.value.permissions, ...group.permissions]))
}

function isGroupSelected(groupPermissions) {
  return groupPermissions.every((permission) => form.value.permissions.includes(permission))
}

function formatPermission(permission) {
  const translated = t(`permissions.${permission}`)
  return translated === `permissions.${permission}` ? permission : translated
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    toast.warning(t('roles.nameRequired'))
    return
  }

  modalLoading.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      permissions: form.value.permissions
    }

    if (editingRole.value) {
      await rolesApi.update(editingRole.value.id, payload)
      toast.success(t('roles.roleUpdated'))
    } else {
      await rolesApi.create(payload)
      toast.success(t('roles.roleCreated'))
    }

    closeModal()
    await fetchRoles()
  } catch (error) {
    toast.error(t('roles.failedSave'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(role) {
  const confirmed = await confirm.confirm({
    title: t('roles.deleteRole'),
    message: t('roles.deleteConfirm', { name: role.name }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) {
    return
  }

  try {
    await rolesApi.delete(role.id)
    toast.success(t('roles.roleDeleted'))
    await fetchRoles()
  } catch (error) {
    toast.error(t('roles.failedDelete'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('roles.title') }}</h1>
        <p class="mt-1 text-[var(--text-secondary)]">
          {{ t('roles.rolesCount', { count: filteredRoles.length }) }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('roles.searchRoles')"
          class="w-full sm:w-72"
        />

        <BaseButton v-if="canCreate" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          {{ t('roles.newRole') }}
        </BaseButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-secondary)]">
      <BaseTable
        :columns="columns"
        :data="filteredRoles"
        :loading="loading"
        :empty-text="t('roles.noRoles')"
      >
        <template #role="{ row }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Shield class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium text-[var(--text-primary)]">{{ row.name }}</p>
              <p class="text-xs text-[var(--text-secondary)]">
                {{ t('roles.permissionsCount', { count: row.permissions?.length || 0 }) }}
              </p>
            </div>
          </div>
        </template>

        <template #permissions="{ row }">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="permission in row.permissions || []"
              :key="permission"
              class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[var(--text-secondary)]"
            >
              {{ formatPermission(permission) }}
            </span>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <BaseButton
              v-if="canUpdate"
              variant="ghost"
              size="sm"
              @click="openEditModal(row)"
            >
              <Pencil class="mr-1 h-4 w-4" />
              {{ t('common.edit') }}
            </BaseButton>

            <BaseButton
              v-if="canDelete"
              variant="danger"
              size="sm"
              @click="handleDelete(row)"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              {{ t('common.delete') }}
            </BaseButton>
          </div>
        </template>
      </BaseTable>
    </div>

    <BaseModal
      :show="showModal"
      :title="editingRole ? t('roles.editRole') : t('roles.createRole')"
      size="xl"
      @close="closeModal"
    >
      <div class="space-y-6">
        <BaseInput
          v-model="form.name"
          :label="t('roles.roleName')"
          :placeholder="t('roles.roleNamePlaceholder')"
        />

        <div class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-medium text-[var(--text-primary)]">{{ t('roles.permissions') }}</h3>
              <p class="text-sm text-[var(--text-secondary)]">{{ t('roles.permissionsHint') }}</p>
            </div>
            <span class="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {{ t('roles.permissionsCount', { count: form.permissions.length }) }}
            </span>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div
              v-for="group in permissionGroups"
              :key="group.key"
              class="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <button
                type="button"
                class="mb-3 flex w-full items-center justify-between gap-3 text-left"
                @click="toggleGroup(group)"
              >
                <div>
                  <h4 class="font-medium text-[var(--text-primary)]">{{ group.label }}</h4>
                  <p class="text-xs text-[var(--text-secondary)]">
                    {{ t('roles.permissionsCount', { count: group.permissions.length }) }}
                  </p>
                </div>
                <span
                  :class="[
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    isGroupSelected(group.permissions)
                      ? 'bg-accent text-white'
                      : 'bg-white/5 text-[var(--text-secondary)]'
                  ]"
                >
                  {{ isGroupSelected(group.permissions) ? t('roles.allSelected') : t('roles.selectAll') }}
                </span>
              </button>

              <div class="space-y-2">
                <button
                  v-for="permission in group.permissions"
                  :key="permission"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors"
                  :class="hasPermission(permission)
                    ? 'border-accent/40 bg-accent/10 text-[var(--text-primary)]'
                    : 'border-white/10 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-white/20 hover:text-[var(--text-primary)]'"
                  @click="togglePermission(permission)"
                >
                  <span class="text-sm">{{ formatPermission(permission) }}</span>
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-full border"
                    :class="hasPermission(permission)
                      ? 'border-accent bg-accent text-white'
                      : 'border-white/15 text-transparent'"
                  >
                    <Check class="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">
          {{ t('common.cancel') }}
        </BaseButton>
        <BaseButton
          :loading="modalLoading"
          :disabled="!form.name.trim()"
          @click="handleSubmit"
        >
          {{ editingRole ? t('common.save') : t('common.create') }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
