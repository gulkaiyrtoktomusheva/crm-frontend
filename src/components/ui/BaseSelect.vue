<script setup>
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: null
  },
  label: String,
  placeholder: {
    type: String,
    default: 'Select option'
  },
  options: {
    type: Array,
    default: () => []
  },
  error: String,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])

const selectClasses = computed(() => {
  const base = 'w-full appearance-none rounded-md border bg-[var(--bg-tertiary)] px-4 py-2.5 pr-10 text-[var(--text-primary)] cursor-pointer input-focus'
  const borderClass = props.error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : 'border-[var(--border-color)] focus:border-accent focus:ring-accent/20'

  return [base, borderClass]
})

function handleChange(event) {
  const rawValue = event.target.value
  if (!rawValue) {
    emit('update:modelValue', null)
    return
  }

  const matchedOption = props.options.find((option) => String(option.value) === rawValue)
  emit('update:modelValue', matchedOption ? matchedOption.value : rawValue)
}
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)]">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        :class="selectClasses"
        @change="handleChange"
      >
        <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
        >
          {{ option.label }}
        </option>
      </select>
      <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
    </div>
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
  </div>
</template>
