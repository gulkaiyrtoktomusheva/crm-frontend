<script setup>
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

defineProps({
  title: String,
  value: [String, Number],
  icon: Object,
  trend: Number,
  trendLabel: String,
  iconColor: {
    type: String,
    default: 'text-accent bg-accent/10'
  }
})
</script>

<template>
  <div class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 p-6">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-[var(--text-secondary)]">{{ title }}</p>
        <p class="text-3xl font-bold text-[var(--text-primary)] mt-2">{{ value }}</p>

        <div v-if="trend !== undefined" class="flex items-center gap-1 mt-2">
          <TrendingUp v-if="trend > 0" class="w-4 h-4 text-emerald-400" />
          <TrendingDown v-else-if="trend < 0" class="w-4 h-4 text-red-400" />
          <span
            :class="[
              'text-sm font-medium',
              trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'
            ]"
          >
            {{ trend > 0 ? '+' : '' }}{{ trend }}%
          </span>
          <span v-if="trendLabel" class="text-sm text-[var(--text-secondary)]">
            {{ trendLabel }}
          </span>
        </div>
      </div>

      <div v-if="icon" :class="['p-3 rounded-xl', iconColor]">
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>
  </div>
</template>
