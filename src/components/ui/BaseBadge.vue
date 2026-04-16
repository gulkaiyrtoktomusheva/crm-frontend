<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['success', 'warning', 'danger', 'info', 'default', 'purple'].includes(v)
  },
  dot: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md'].includes(v)
  }
})

const classes = computed(() => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    default: 'badge-default',
    purple: 'bg-accent/10 text-accent'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  }

  return [
    'inline-flex items-center font-medium rounded-md',
    variants[props.variant],
    sizes[props.size]
  ]
})

const dotColors = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  default: 'bg-gray-400',
  purple: 'bg-accent'
}
</script>

<template>
  <span :class="classes">
    <span
      v-if="dot"
      :class="['w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant]]"
    />
    <slot />
  </span>
</template>
