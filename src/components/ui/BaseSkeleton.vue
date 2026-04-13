<script setup>
defineProps({
  width: String,
  height: {
    type: String,
    default: '1rem'
  },
  rounded: {
    type: String,
    default: 'rounded'
  }
})
</script>

<template>
  <div
    class="skeleton"
    :class="rounded"
    :style="{
      width: width || '100%',
      height: height
    }"
  />
</template>
