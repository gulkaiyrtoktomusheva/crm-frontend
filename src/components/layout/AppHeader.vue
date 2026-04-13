<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { ChevronRight, Bell, User, LogOut } from 'lucide-vue-next'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseDropdown from '@/components/ui/BaseDropdown.vue'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  const crumbs = [{ name: t('sidebar.dashboard'), path: '/' }]

  const nameMap = {
    leads: t('sidebar.leads'),
    students: t('sidebar.students'),
    groups: t('sidebar.groups'),
    'mock-exams': t('sidebar.mockExams'),
    payments: t('sidebar.payments')
  }

  let currentPath = ''
  paths.forEach((p, i) => {
    currentPath += `/${p}`
    if (nameMap[p]) {
      crumbs.push({ name: nameMap[p], path: currentPath })
    } else if (i > 0) {
      crumbs.push({ name: route.meta.title || p, path: currentPath })
    }
  })

  return crumbs
})
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 border-b border-white/5">
    <!-- Breadcrumbs -->
    <nav class="flex items-center text-sm">
      <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
        <ChevronRight v-if="i > 0" class="w-4 h-4 mx-2 text-[var(--text-secondary)]" />
        <router-link
          :to="crumb.path"
          :class=" [
            'hover:text-white transition-colors',
            i === breadcrumbs.length - 1 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
          ]"
        >
          {{ crumb.name }}
        </router-link>
      </template>
    </nav>

    <!-- Right side -->
    <div class="flex items-center gap-3">
      <!-- Notifications -->
      <button class="p-2 rounded-xl hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-colors relative">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <!-- User dropdown -->
      <BaseDropdown align="right">
        <template #trigger>
          <button class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors">
            <BaseAvatar :name="authStore.user?.fullName || 'User'" size="sm" />
            <div class="text-left hidden sm:block">
              <p class="text-sm font-medium text-[var(--text-primary)]">
                {{ authStore.user?.fullName }}
              </p>
              <p class="text-xs text-[var(--text-secondary)]">
                {{ authStore.user?.role }}
              </p>
            </div>
          </button>
        </template>

        <template #default="{ close }">
          <div class="py-1">
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-colors"
              @click="close"
            >
              <User class="w-4 h-4" />
              {{ t('common.profile') }}
            </button>
            <button
              class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              @click="() => { close(); authStore.logout() }"
            >
              <LogOut class="w-4 h-4" />
              {{ t('common.logout') }}
            </button>
          </div>
        </template>
      </BaseDropdown>
    </div>
  </header>
</template>
