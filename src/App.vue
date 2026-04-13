<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import BaseToast from '@/components/ui/BaseToast.vue'

const appStore = useAppStore()

onMounted(() => {
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark'
  appStore.setTheme(savedTheme)
})
</script>

<template>
  <div :class="appStore.theme">
    <div class="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <!-- Toast notifications -->
      <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <TransitionGroup name="toast">
          <BaseToast
            v-for="toast in appStore.toasts"
            :key="toast.id"
            :toast="toast"
            @close="appStore.removeToast(toast.id)"
          />
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>
