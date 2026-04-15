<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeadsStore } from '@/stores/leads'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import LeadKanban from '@/components/leads/LeadKanban.vue'
import LeadFormModal from '@/components/leads/LeadFormModal.vue'
import LeadSourceBadge from '@/components/leads/LeadSourceBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import { Plus, LayoutGrid, List, Pencil, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()
const leadsStore = useLeadsStore()
const toast = useToast()
const { confirm } = useConfirm()

const viewMode = ref('kanban')
const showModal = ref(false)
const selectedLead = ref(null)
const statusFilter = ref(null)
const sourceFilter = ref(null)
const modalLoading = ref(false)

const columns = computed(() => [
  { key: 'lead', label: t('leads.fullName'), width: '28%' },
  { key: 'source', label: t('leads.source'), width: '14%' },
  { key: 'status', label: t('leads.status'), width: '16%' },
  { key: 'phone', label: t('leads.phone'), width: '14%' },
  { key: 'nextContactDate', label: t('leads.nextContactDate'), width: '16%' },
  { key: 'actions', label: '', width: '12%' }
])

const sourceOptions = computed(() => [
  { value: 'INSTAGRAM', label: t('sources.INSTAGRAM') },
  { value: 'TIKTOK', label: t('sources.TIKTOK') },
  { value: 'FACEBOOK', label: t('sources.FACEBOOK') },
  { value: 'WHATSAPP', label: t('sources.WHATSAPP') },
  { value: 'REFERRAL', label: t('sources.REFERRAL') },
  { value: 'OTHER', label: t('sources.OTHER') }
])

const filteredLeads = computed(() => {
  let leads = leadsStore.leads
  if (sourceFilter.value) {
    leads = leads.filter(l => l.source === sourceFilter.value)
  }
  return leads
})

const statusOptions = computed(() => [
  { value: 'NEW', label: t('leads.statusNew') },
  { value: 'CONTACTED', label: t('leads.statusContacted') },
  { value: 'THINKING', label: t('leads.statusThinking') },
  { value: 'PAID', label: t('leads.statusPaid') },
  { value: 'REJECTED', label: t('leads.statusRejected') }
])

onMounted(() => {
  leadsStore.fetchLeads()
})

function openCreateModal() {
  selectedLead.value = null
  showModal.value = true
}

function openEditModal(lead) {
  selectedLead.value = lead
  showModal.value = true
}

async function handleSubmit(data) {
  modalLoading.value = true
  try {
    if (selectedLead.value) {
      await leadsStore.updateLead(selectedLead.value.id, data)
    } else {
      await leadsStore.createLead(data)
    }
    showModal.value = false
  } catch (e) {
    // Error handled in store
  } finally {
    modalLoading.value = false
  }
}

async function handleStatusChange({ leadId, newStatus }) {
  try {
    await leadsStore.updateLeadStatus(leadId, newStatus)
    if (newStatus === 'PAID') {
      toast.success(t('leads.convertedToPaid'))
    }
  } catch (e) {
    leadsStore.fetchLeads()
  }
}

async function handleDelete(lead) {
  const confirmed = await confirm({
    title: t('leads.deleteLead'),
    message: t('leads.deleteConfirm', { name: lead.fullName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    variant: 'danger'
  })

  if (!confirmed) {
    return
  }

  try {
    await leadsStore.deleteLead(lead.id)
  } catch (e) {
    toast.error(t('leads.failedDelete'))
  }
}

function getStatusLabel(status) {
  const labels = {
    NEW: t('leads.statusNew'),
    CONTACTED: t('leads.statusContacted'),
    THINKING: t('leads.statusThinking'),
    PAID: t('leads.statusPaid'),
    REJECTED: t('leads.statusRejected')
  }

  return labels[status] || status || '-'
}

function formatDate(date) {
  if (!date) {
    return '-'
  }

  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('leads.title') }}</h1>
        <p class="text-[var(--text-secondary)] mt-1">
          {{ t('leads.totalLeads', { count: leadsStore.leads.length }) }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View toggle -->
        <div class="flex items-center bg-white/5 rounded-xl p-1">
          <button
            @click="viewMode = 'kanban'"
            :class="[
              'p-2 rounded-lg transition-colors',
              viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-[var(--text-secondary)] hover:text-white'
            ]"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'table'"
            :class="[
              'p-2 rounded-lg transition-colors',
              viewMode === 'table' ? 'bg-white/10 text-white' : 'text-[var(--text-secondary)] hover:text-white'
            ]"
          >
            <List class="w-4 h-4" />
          </button>
        </div>

        <!-- Source filter -->
        <BaseSelect
          v-model="sourceFilter"
          :options="sourceOptions"
          :placeholder="t('common.allSources')"
          class="w-40"
        />

        <!-- Create button -->
        <BaseButton @click="openCreateModal">
          <Plus class="w-4 h-4 mr-2" />
          {{ t('leads.newLead') }}
        </BaseButton>
      </div>
    </div>

    <!-- Content -->
    <div v-if="leadsStore.loading" class="space-y-4">
      <div class="flex gap-4">
        <div v-for="i in 5" :key="i" class="flex-1 min-w-[280px]">
          <BaseSkeleton height="2rem" width="40%" class="mb-4" />
          <div class="space-y-3">
            <BaseSkeleton v-for="j in 3" :key="j" height="6rem" rounded="rounded-xl" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Kanban view -->
      <LeadKanban
        v-if="viewMode === 'kanban'"
        :leads="filteredLeads"
        @status-change="handleStatusChange"
        @card-click="openEditModal"
      />

      <div v-else class="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-secondary)]">
        <BaseTable
          :columns="columns"
          :data="filteredLeads"
          :empty-text="t('common.noData')"
        >
          <template #lead="{ row }">
            <div>
              <p class="font-medium text-[var(--text-primary)]">{{ row.fullName }}</p>
              <p v-if="row.parentName" class="mt-1 text-xs text-[var(--text-secondary)]">
                {{ t('leads.parentName') }}: {{ row.parentName }}
              </p>
            </div>
          </template>

          <template #source="{ row }">
            <LeadSourceBadge :source="row.source" />
          </template>

          <template #status="{ row }">
            <BaseSelect
              :model-value="row.status"
              :options="statusOptions"
              class="min-w-[150px]"
              @update:model-value="(value) => handleStatusChange({ leadId: row.id, newStatus: value })"
            />
          </template>

          <template #phone="{ row }">
            <div class="space-y-1">
              <p class="text-[var(--text-primary)]">{{ row.phone || '-' }}</p>
              <p v-if="row.whatsapp" class="text-xs text-[var(--text-secondary)]">
                WhatsApp: {{ row.whatsapp }}
              </p>
            </div>
          </template>

          <template #nextContactDate="{ row }">
            <span class="text-[var(--text-secondary)]">{{ formatDate(row.nextContactDate) }}</span>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="openEditModal(row)"
              >
                <Pencil class="mr-1 h-4 w-4" />
                {{ t('common.edit') }}
              </BaseButton>

              <BaseButton
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
    </template>

    <!-- Lead form modal -->
    <LeadFormModal
      :show="showModal"
      :lead="selectedLead"
      :loading="modalLoading"
      @close="showModal = false"
      @submit="handleSubmit"
    />
  </div>
</template>
