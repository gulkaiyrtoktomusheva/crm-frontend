<script setup>
import { Search, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'mouseenter'])

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
    <input
      :value="modelValue"
      :placeholder="placeholder"
      type="text"
      class="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] pl-10 pr-10 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] input-focus"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="$emit('focus', $event)"
      @mouseenter="$emit('mouseenter', $event)"
    />
    <button
      v-if="modelValue"
      @click="clear"
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)]"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
