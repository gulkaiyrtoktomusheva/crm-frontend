<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LeadKanbanColumn from './LeadKanbanColumn.vue'

const { t } = useI18n()

const props = defineProps({
  leads: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['status-change', 'card-click'])

const columns = computed(() => [
  { status: 'NEW', title: t('leads.statusNew') },
  { status: 'CONTACTED', title: t('leads.statusContacted') },
  { status: 'THINKING', title: t('leads.statusThinking') },
  { status: 'PAID', title: t('leads.statusPaid') },
  { status: 'REJECTED', title: t('leads.statusRejected') }
])

const leadsByStatus = computed(() => {
  const grouped = {}
  columns.value.forEach(col => {
    grouped[col.status] = props.leads.filter(l => l.status === col.status)
  })
  return grouped
})

function handleChange(event) {
  emit('status-change', {
    leadId: event.lead.id,
    newStatus: event.newStatus
  })
}
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-4">
    <LeadKanbanColumn
      v-for="col in columns"
      :key="col.status"
      :status="col.status"
      :title="col.title"
      :leads="leadsByStatus[col.status]"
      @change="handleChange"
      @card-click="$emit('card-click', $event)"
    />
  </div>
</template>
