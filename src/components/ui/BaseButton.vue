<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: Boolean,
    default: false
  }
})

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'btn-gradient text-white shadow-lg shadow-accent/25 hover:shadow-accent/40',
    secondary: 'bg-white/5 border border-white/10 text-[var(--text-primary)] hover:bg-white/10',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
  }

  const sizes = {
    sm: props.icon ? 'p-2' : 'px-3 py-1.5 text-sm',
    md: props.icon ? 'p-2.5' : 'px-4 py-2.5 text-sm',
    lg: props.icon ? 'p-3' : 'px-6 py-3 text-base'
  }

  return [base, variants[props.variant], sizes[props.size]]
})
</script>

<template>
  <button
    :class="classes"
    :disabled="disabled || loading"
  >
    <Loader2
      v-if="loading"
      class="w-4 h-4 animate-spin"
      :class="{ 'mr-2': !icon && $slots.default }"
    />
    <slot v-if="!loading || icon" />
  </button>
</template>
