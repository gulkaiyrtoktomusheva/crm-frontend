<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, UserRound } from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useAuthStore } from '@/stores/auth'
import UserFormModal from '@/components/users/UserFormModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSearchInput from '@/components/ui/BaseSearchInput.vue'
import BaseTable from '@/components/ui/BaseTable.vue'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const users = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const modalLoading = ref(false)
const editingUser = ref(null)

const columns = computed(() => [
  { key: 'user', label: t('users.user'), width: '32%' },
  { key: 'role', label: t('users.role'), width: '20%' },
  { key: 'phone', label: t('users.phone'), width: '18%' },
  { key: 'createdAt', label: t('users.createdAt'), width: '18%' },
  { key: 'actions', label: '', width: '140px' }
])

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return users.value

  return users.value.filter((user) => {
    const haystack = [user.fullName, user.email, user.roleName, user.phone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
})

const canCreate = computed(() => authStore.hasPermission('USER_CREATE'))
const canUpdate = computed(() => authStore.hasPermission('USER_UPDATE'))
const canDelete = computed(() => authStore.hasPermission('USER_DELETE'))

onMounted(fetchUsers)

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await usersApi.getAll()
  } catch (error) {
    toast.error(t('users.failedLoad'))
  } finally {
    loading.value = false
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ru-RU')
}

function openCreateModal() {
  editingUser.value = null
  showModal.value = true
}

function openEditModal(user) {
  editingUser.value = user
  showModal.value = true
}

function closeModal() {
  editingUser.value = null
  showModal.value = false
}

async function handleSubmit(payload) {
  modalLoading.value = true
  try {
    if (editingUser.value) {
      await usersApi.update(editingUser.value.id, payload)
      toast.success(t('users.userUpdated'))
    } else {
      await usersApi.create(payload)
      toast.success(t('users.userCreated'))
    }

    closeModal()
    await fetchUsers()
  } catch (error) {
    toast.error(t('users.failedSave'))
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(user) {
  const confirmed = await confirm.confirm({
    title: t('users.deleteUser'),
    message: t('users.deleteConfirm', { name: user.fullName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) return

  try {
    await usersApi.delete(user.id)
    toast.success(t('users.userDeleted'))
    await fetchUsers()
  } catch (error) {
    toast.error(t('users.failedDelete'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('users.title') }}</h1>
        <p class="mt-1 text-[var(--text-secondary)]">
          {{ t('users.usersCount', { count: filteredUsers.length }) }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BaseSearchInput
          v-model="search"
          :placeholder="t('users.searchUsers')"
          class="w-full sm:w-72"
        />

        <BaseButton v-if="canCreate" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          {{ t('users.newUser') }}
        </BaseButton>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-secondary)]">
      <BaseTable
        :columns="columns"
        :data="filteredUsers"
        :loading="loading"
        :empty-text="t('users.noUsers')"
      >
        <template #user="{ row }">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <UserRound class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium text-[var(--text-primary)]">{{ row.fullName }}</p>
              <p class="text-xs text-[var(--text-secondary)]">{{ row.email }}</p>
            </div>
          </div>
        </template>

        <template #role="{ row }">
          <span class="text-[var(--text-secondary)]">{{ row.roleName || '-' }}</span>
        </template>

        <template #phone="{ row }">
          <span class="text-[var(--text-secondary)]">{{ row.phone || '-' }}</span>
        </template>

        <template #createdAt="{ row }">
          <span class="text-[var(--text-secondary)]">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <BaseButton v-if="canUpdate" variant="ghost" size="sm" @click="openEditModal(row)">
              <Pencil class="mr-1 h-4 w-4" />
              {{ t('common.edit') }}
            </BaseButton>

            <BaseButton v-if="canDelete" variant="danger" size="sm" @click="handleDelete(row)">
              <Trash2 class="mr-1 h-4 w-4" />
              {{ t('common.delete') }}
            </BaseButton>
          </div>
        </template>
      </BaseTable>
    </div>

    <UserFormModal
      :show="showModal"
      :loading="modalLoading"
      :user="editingUser"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>
