<script setup>
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

defineProps({
  toast: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const colors = {
  success: 'text-emerald-400 bg-emerald-400/10',
  error: 'text-red-400 bg-red-400/10',
  warning: 'text-amber-400 bg-amber-400/10',
  info: 'text-blue-400 bg-blue-400/10'
}
</script>

<template>
  <div
    class="flex items-start gap-3 w-80 p-4 bg-[var(--bg-secondary)] border border-white/10 rounded-xl shadow-lg animate-slide-in"
  >
    <div :class="['p-2 rounded-lg', colors[toast.type]]">
      <component :is="icons[toast.type]" class="w-5 h-5" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-[var(--text-primary)]">{{ toast.title }}</p>
      <p class="text-sm text-[var(--text-secondary)] mt-0.5">{{ toast.message }}</p>
    </div>
    <button
      @click="$emit('close')"
      class="p-1 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
