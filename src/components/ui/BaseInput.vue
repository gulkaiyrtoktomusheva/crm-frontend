<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: String,
  placeholder: String,
  type: {
    type: String,
    default: 'text'
  },
  error: String,
  disabled: Boolean,
  icon: Object
})

const emit = defineEmits(['update:modelValue'])

const inputClasses = computed(() => {
  const base = 'w-full bg-white/5 border rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] input-focus'
  const borderClass = props.error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : 'border-white/10 focus:border-accent focus:ring-accent/20'
  const iconPadding = props.icon ? 'pl-11' : ''

  return [base, borderClass, iconPadding]
})

function handleInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)]">
      {{ label }}
    </label>
    <div class="relative">
      <div
        v-if="icon"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
      >
        <component :is="icon" class="w-4 h-4" />
      </div>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
      />
    </div>
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
  </div>
</template>
