<script setup>
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: String,
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v)
  },
  bodyOverflowVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-950/38 backdrop-blur-sm"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div
          :class="[
            'my-auto flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-lg border shadow-2xl',
            props.bodyOverflowVisible ? 'overflow-visible' : 'overflow-hidden',
            sizeClasses[size]
          ]"
          :style="{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }"
        >
          <!-- Header -->
          <div class="flex shrink-0 items-center justify-between px-6 py-4 border-b" :style="{ borderColor: 'var(--border-color)' }">
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ title }}</h3>
            <button
              @click="$emit('close')"
              class="rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div
            :class="[
              'min-h-0 flex-1 px-6 py-4',
              props.bodyOverflowVisible ? 'overflow-visible' : 'overflow-y-auto'
            ]"
          >
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="flex shrink-0 justify-end gap-3 border-t px-6 py-4"
            :style="{ borderColor: 'var(--border-color)' }"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
