<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  align: {
    type: String,
    default: 'right',
    validator: (v) => ['left', 'right'].includes(v)
  }
})

const isOpen = ref(false)
const dropdownRef = ref(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <div @click="toggle">
      <slot name="trigger" />
    </div>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        :class="[
          'absolute z-50 mt-2 w-48 rounded-md border py-1 shadow-lg',
          align === 'right' ? 'right-0' : 'left-0'
        ]"
        :style="{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)'
        }"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
