<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: String,
  placeholder: String,
  rows: {
    type: Number,
    default: 4
  },
  error: String,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])

const textareaClasses = computed(() => {
  const base = 'w-full bg-white/5 border rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] input-focus resize-none'
  const borderClass = props.error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : 'border-white/10 focus:border-accent focus:ring-accent/20'

  return [base, borderClass]
})
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)]">
      {{ label }}
    </label>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :class="textareaClasses"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
  </div>
</template>
