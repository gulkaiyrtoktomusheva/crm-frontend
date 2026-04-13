<script setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import LeadKanbanCard from './LeadKanbanCard.vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  leads: {
    type: Array,
    default: () => []
  },
  title: String
})

const emit = defineEmits(['update:leads', 'card-click', 'change'])

const statusColors = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-amber-500',
  THINKING: 'bg-purple-500',
  PAID: 'bg-emerald-500',
  REJECTED: 'bg-red-500'
}

const localLeads = computed({
  get: () => props.leads,
  set: (value) => emit('update:leads', value)
})

function handleChange(event) {
  if (event.added) {
    emit('change', {
      lead: event.added.element,
      newStatus: props.status
    })
  }
}
</script>

<template>
  <div class="flex-1 min-w-[280px] max-w-[320px]">
    <!-- Column header -->
    <div class="flex items-center gap-2 mb-4">
      <div :class="['w-2 h-2 rounded-full', statusColors[status]]" />
      <h3 class="font-medium text-[var(--text-primary)]">{{ title }}</h3>
      <span class="text-sm text-[var(--text-secondary)]">({{ leads.length }})</span>
    </div>

    <!-- Cards container -->
    <draggable
      v-model="localLeads"
      group="leads"
      item-key="id"
      class="space-y-3 min-h-[200px] p-2 bg-white/[0.02] rounded-xl"
      ghost-class="sortable-ghost"
      drag-class="sortable-drag"
      @change="handleChange"
    >
      <template #item="{ element }">
        <LeadKanbanCard
          :lead="element"
          @click="$emit('card-click', element)"
        />
      </template>
    </draggable>
  </div>
</template>
