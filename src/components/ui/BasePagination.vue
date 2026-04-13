<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:currentPage'])

const pages = computed(() => {
  const items = []
  const current = props.currentPage
  const total = props.totalPages

  if (total <= 7) {
    for (let i = 0; i < total; i++) items.push(i)
  } else {
    items.push(0)
    if (current > 3) items.push('...')
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
      items.push(i)
    }
    if (current < total - 4) items.push('...')
    items.push(total - 1)
  }

  return items
})

const hasPrev = computed(() => props.currentPage > 0)
const hasNext = computed(() => props.currentPage < props.totalPages - 1)

function goToPage(page) {
  if (page >= 0 && page < props.totalPages) {
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <p class="text-sm text-[var(--text-secondary)]">
      Total: {{ totalItems }} items
    </p>

    <div class="flex items-center gap-1">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="!hasPrev"
        class="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <template v-for="(page, i) in pages" :key="i">
        <span v-if="page === '...'" class="px-2 text-[var(--text-secondary)]">...</span>
        <button
          v-else
          @click="goToPage(page)"
          :class="[
            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-accent text-white'
              : 'hover:bg-white/5 text-[var(--text-secondary)]'
          ]"
        >
          {{ page + 1 }}
        </button>
      </template>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="!hasNext"
        class="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
