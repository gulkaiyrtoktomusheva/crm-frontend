<script setup>
import { Phone, MessageCircle, Calendar } from 'lucide-vue-next'
import LeadSourceBadge from './LeadSourceBadge.vue'

defineProps({
  lead: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

function formatDate(date) {
  if (!date) return null
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div
    @click="$emit('click', lead)"
    class="bg-[var(--bg-tertiary)] rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all border border-white/5 group"
  >
    <div class="flex items-start justify-between mb-3">
      <h4 class="font-medium text-[var(--text-primary)] group-hover:text-white transition-colors">
        {{ lead.fullName }}
      </h4>
      <LeadSourceBadge :source="lead.source" />
    </div>

    <div class="space-y-2 text-sm">
      <div v-if="lead.phone" class="flex items-center gap-2 text-[var(--text-secondary)]">
        <Phone class="w-4 h-4" />
        <span>{{ lead.phone }}</span>
      </div>

      <div v-if="lead.whatsapp" class="flex items-center gap-2 text-[var(--text-secondary)]">
        <MessageCircle class="w-4 h-4" />
        <span>{{ lead.whatsapp }}</span>
      </div>

      <div v-if="lead.nextContactDate" class="flex items-center gap-2 text-[var(--text-secondary)]">
        <Calendar class="w-4 h-4" />
        <span>{{ formatDate(lead.nextContactDate) }}</span>
      </div>
    </div>

    <p v-if="lead.comment" class="mt-3 text-xs text-[var(--text-secondary)] line-clamp-2">
      {{ lead.comment }}
    </p>
  </div>
</template>
