<script setup>
defineProps({
  hoverable: {
    type: Boolean,
    default: false
  },
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v)
  }
})

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}
</script>

<template>
  <div
    :class="[
      'bg-[var(--bg-secondary)] rounded-2xl border border-white/5',
      paddingClasses[padding],
      hoverable ? 'card-hover cursor-pointer' : ''
    ]"
  >
    <slot />
  </div>
</template>
