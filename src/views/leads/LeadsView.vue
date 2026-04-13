<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeadsStore } from '@/stores/leads'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import LeadKanban from '@/components/leads/LeadKanban.vue'
import LeadFormModal from '@/components/leads/LeadFormModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { Plus, LayoutGrid, List } from 'lucide-vue-next'

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

      <!-- Table view placeholder -->
      <div v-else class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 p-6">
        <p class="text-[var(--text-secondary)] text-center">{{ t('leads.tableViewSoon') }}</p>
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
