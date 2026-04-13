<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseConfirmDialog from '@/components/ui/BaseConfirmDialog.vue'

const appStore = useAppStore()

const mainClass = computed(() => [
  'min-h-screen transition-all duration-300',
  appStore.sidebarCollapsed ? 'ml-16' : 'ml-60'
])
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-primary)]">
    <AppSidebar />

    <div :class="mainClass">
      <AppHeader />

      <main class="p-6">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <BaseConfirmDialog />
  </div>
</template>
