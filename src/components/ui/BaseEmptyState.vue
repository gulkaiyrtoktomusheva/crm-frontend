<script setup>
import { Package } from 'lucide-vue-next'

defineProps({
  icon: {
    type: Object,
    default: () => Package
  },
  title: {
    type: String,
    default: 'No data'
  },
  description: String
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
      <component :is="icon" class="w-8 h-8 text-[var(--text-secondary)]" />
    </div>
    <h3 class="text-lg font-medium text-[var(--text-primary)] mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-[var(--text-secondary)] max-w-sm">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
