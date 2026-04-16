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
      'surface-panel rounded-2xl',
      paddingClasses[padding],
      hoverable ? 'card-hover cursor-pointer' : ''
    ]"
  >
    <slot />
  </div>
</template>
