<script setup>
import { AlertTriangle } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { useConfirm } from '@/composables/useConfirm'

const {
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant,
  handleConfirm,
  handleCancel
} = useConfirm()
</script>

<template>
  <BaseModal :show="isOpen" :title="title" size="sm" @close="handleCancel">
    <div class="flex flex-col items-center text-center">
      <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle class="w-6 h-6 text-red-400" />
      </div>
      <p class="text-[var(--text-secondary)]">{{ message }}</p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="handleCancel">
        {{ cancelText }}
      </BaseButton>
      <BaseButton :variant="variant" @click="handleConfirm">
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
