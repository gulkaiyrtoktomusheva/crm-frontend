<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  Target,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Users,
  Wallet,
  Shield,
  UserRoundCog,
  Moon,
  Sun,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Globe
} from 'lucide-vue-next'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const menuItems = computed(() => [
  { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/' },
  { icon: Target, label: t('sidebar.leads'), path: '/leads', permission: 'LEAD_VIEW' },
  { icon: GraduationCap, label: t('sidebar.students'), path: '/students', permission: 'STUDENT_VIEW' },
  { icon: BookOpen, label: t('sidebar.courses'), path: '/courses', permission: 'COURSE_VIEW' },
  { icon: Users, label: t('sidebar.groups'), path: '/groups', permission: 'GROUP_VIEW' },
  { icon: ClipboardList, label: t('sidebar.enrollments'), path: '/enrollments', permission: 'STUDENT_VIEW' },
  { icon: Wallet, label: t('sidebar.payments'), path: '/payments', permission: 'PAYMENT_VIEW' },
  { icon: Shield, label: t('sidebar.roles'), path: '/roles', permission: 'ROLE_VIEW' },
  { icon: UserRoundCog, label: t('sidebar.users'), path: '/users', permission: 'USER_VIEW' }
].filter((item) => authStore.hasPermission(item.permission)))

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const isDark = computed(() => appStore.theme === 'dark')

const languages = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'ky', label: 'KY' }
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigateTo(path) {
  router.push(path)
}

function handleLogout() {
  authStore.logout()
}

function switchLanguage() {
  const codes = languages.map(l => l.code)
  const currentIndex = codes.indexOf(locale.value)
  const nextIndex = (currentIndex + 1) % codes.length
  locale.value = codes[nextIndex]
  localStorage.setItem('locale', codes[nextIndex])
}

const currentLangLabel = computed(() => {
  const lang = languages.find(l => l.code === locale.value)
  return lang ? lang.label : 'RU'
})
</script>

<template>
  <aside
    :class=" [
      'fixed left-0 top-0 h-screen bg-[#0d0d14] border-r border-white/5 flex flex-col transition-all duration-300 z-40',
      isCollapsed ? 'w-16' : 'w-60'
    ]"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-4 border-b border-white/5">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
          <span class="text-white font-bold text-sm">O</span>
        </div>
        <span
          v-if="!isCollapsed"
          class="font-bold text-lg text-white transition-opacity duration-200"
        >
          ORT CRM
        </span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
      <button
        v-for="item in menuItems"
        :key="item.path"
        @click="navigateTo(item.path)"
        :class=" [
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
          isActive(item.path)
            ? 'bg-white/5 text-white sidebar-active'
            : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span
          v-if="!isCollapsed"
          class="text-sm font-medium transition-opacity duration-200"
        >
          {{ item.label }}
        </span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-secondary)] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap border border-white/10"
        >
          {{ item.label }}
        </div>
      </button>
    </nav>

    <!-- Bottom section -->
    <div class="py-4 px-2 border-t border-white/5 space-y-1">
      <!-- Language switcher -->
      <button
        @click="switchLanguage"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white group relative"
      >
        <Globe class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">{{ currentLangLabel }}</span>

        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-secondary)] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap border border-white/10"
        >
          {{ currentLangLabel }}
        </div>
      </button>

      <!-- Theme toggle -->
      <button
        @click="appStore.toggleTheme"
        :class=" [
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white group relative'
        ]"
      >
        <Moon v-if="isDark" class="w-5 h-5 flex-shrink-0" />
        <Sun v-else class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">
          {{ isDark ? t('common.darkMode') : t('common.lightMode') }}
        </span>

        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-secondary)] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap border border-white/10"
        >
          {{ isDark ? t('common.darkMode') : t('common.lightMode') }}
        </div>
      </button>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 group relative"
      >
        <LogOut class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">{{ t('common.logout') }}</span>

        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-secondary)] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap border border-white/10"
        >
          {{ t('common.logout') }}
        </div>
      </button>

      <!-- Collapse toggle -->
      <button
        @click="appStore.toggleSidebar"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
      >
        <PanelLeftClose v-if="!isCollapsed" class="w-5 h-5 flex-shrink-0" />
        <PanelLeft v-else class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">{{ t('common.collapse') }}</span>
      </button>
    </div>
  </aside>
</template>
