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
  FileText,
  ClipboardList,
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
  { icon: ClipboardList, label: t('sidebar.enrollments'), path: '/enrollments', permission: 'STUDENT_VIEW' },
  { icon: FileText, label: t('sidebar.mockExams'), path: '/mock-exams', permission: 'MOCK_EXAM_VIEW' },
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
      'fixed left-0 top-0 h-screen border-r flex flex-col transition-all duration-300 z-40 backdrop-blur-sm',
      isCollapsed ? 'w-16' : 'w-60'
    ]"
    :style="{
      backgroundColor: 'var(--sidebar-bg)',
      borderColor: 'var(--sidebar-border)'
    }"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-4 border-b" :style="{ borderColor: 'var(--sidebar-border)' }">
        <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-md flex items-center justify-center shadow-sm"
          :style="{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)' }"
        >
          <span class="text-white font-bold text-sm">O</span>
        </div>
        <span
          v-if="!isCollapsed"
          class="font-semibold text-lg transition-opacity duration-200"
          :style="{ color: 'var(--sidebar-text-active)' }"
        >
          ETALON KG
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
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
          isActive(item.path)
            ? 'sidebar-active shadow-sm'
            : ''
        ]"
        :style="isActive(item.path)
          ? { backgroundColor: 'var(--accent-soft)', color: 'var(--sidebar-text-active)' }
          : { color: 'var(--sidebar-text)' }"
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
          class="absolute left-full ml-2 rounded-md border px-2 py-1 text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap"
          :style="{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }"
        >
          {{ item.label }}
        </div>
      </button>
    </nav>

    <!-- Bottom section -->
    <div class="py-4 px-2 border-t space-y-1" :style="{ borderColor: 'var(--sidebar-border)' }">
      <!-- Language switcher -->
      <button
        @click="switchLanguage"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative hover:bg-[var(--accent-soft)]"
        :style="{ color: 'var(--sidebar-text)' }"
      >
        <Globe class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">{{ currentLangLabel }}</span>

        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap border"
          
          :style="{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }"
        >
          {{ currentLangLabel }}
        </div>
      </button>

      <!-- Theme toggle -->
      <button
        @click="appStore.toggleTheme"
        :class=" [
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative hover:bg-[var(--accent-soft)]'
        ]"
        :style="{ color: 'var(--sidebar-text)' }"
      >
        <Moon v-if="isDark" class="w-5 h-5 flex-shrink-0" />
        <Sun v-else class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">
          {{ isDark ? t('common.darkMode') : t('common.lightMode') }}
        </span>

        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 rounded-md border px-2 py-1 text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap"
          :style="{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }"
        >
          {{ isDark ? t('common.darkMode') : t('common.lightMode') }}
        </div>
      </button>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative hover:bg-red-500/10 hover:text-red-400"
        :style="{ color: 'var(--sidebar-text)' }"
      >
        <LogOut class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">{{ t('common.logout') }}</span>

        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 rounded-md border px-2 py-1 text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap"
          :style="{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }"
        >
          {{ t('common.logout') }}
        </div>
      </button>

      <!-- Collapse toggle -->
      <button
        @click="appStore.toggleSidebar"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-[var(--accent-soft)]"
        :style="{ color: 'var(--sidebar-text)' }"
      >
        <PanelLeftClose v-if="!isCollapsed" class="w-5 h-5 flex-shrink-0" />
        <PanelLeft v-else class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed" class="text-sm font-medium">{{ t('common.collapse') }}</span>
      </button>
    </div>
  </aside>
</template>
