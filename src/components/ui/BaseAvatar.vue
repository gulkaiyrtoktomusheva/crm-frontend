<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v)
  },
  src: String
})

const initials = computed(() => {
  return props.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
}

const bgColors = [
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500'
]

const bgColor = computed(() => {
  const index = props.name.charCodeAt(0) % bgColors.length
  return bgColors[index]
})
</script>

<template>
  <div
    :class="[
      'rounded-full flex items-center justify-center font-medium text-white bg-gradient-to-br',
      sizeClasses[size],
      bgColor
    ]"
  >
    <img v-if="src" :src="src" :alt="name" class="w-full h-full rounded-full object-cover" />
    <span v-else>{{ initials }}</span>
  </div>
</template>
