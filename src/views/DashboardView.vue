<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { dashboardApi } from '@/api/dashboard'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/dashboard/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import {
  Target,
  Wallet,
  GraduationCap
} from 'lucide-vue-next'

const { t } = useI18n()
const toast = useToast()
const stats = ref(null)
const loading = ref(true)

const leadFunnelItems = computed(() => ([
  { label: t('leads.statusNew'), value: stats.value?.leadStats?.newCount || 0, color: 'bg-sky-500' },
  { label: t('leads.statusContacted'), value: stats.value?.leadStats?.contactedCount || 0, color: 'bg-cyan-500' },
  { label: t('leads.statusThinking'), value: stats.value?.leadStats?.thinkingCount || 0, color: 'bg-violet-500' },
  { label: t('leads.statusPaid'), value: stats.value?.leadStats?.paidCount || 0, color: 'bg-emerald-500' },
  { label: t('leads.statusRejected'), value: stats.value?.leadStats?.rejectedCount || 0, color: 'bg-rose-500' }
]))

onMounted(async () => {
  try {
    stats.value = await dashboardApi.getStats()
  } catch (e) {
    toast.error(t('dashboard.failedLoadStats'))
  } finally {
    loading.value = false
  }
})

function formatCurrency(amount) {
  if (!amount) return '0'
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + t('common.currency')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ t('dashboard.title') }}</h1>
      <p class="text-[var(--text-secondary)] mt-1">{{ t('dashboard.subtitle') }}</p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 p-6">
          <BaseSkeleton height="1rem" width="40%" class="mb-2" />
          <BaseSkeleton height="2.5rem" width="60%" />
        </div>
      </template>

      <template v-else>
        <StatCard
          :title="t('dashboard.totalLeads')"
          :value="stats?.leadStats?.totalCount || 0"
          :icon="Target"
          iconColor="text-sky-500 bg-sky-500/10"
        />

        <StatCard
          :title="t('dashboard.activeStudents')"
          :value="stats?.activeStudents || 0"
          :icon="GraduationCap"
          iconColor="text-emerald-500 bg-emerald-500/10"
        />

        <StatCard
          :title="t('dashboard.totalRevenue')"
          :value="formatCurrency(stats?.totalRevenue)"
          :icon="Wallet"
          iconColor="text-[var(--accent)] bg-[var(--accent-soft)]"
        />
      </template>
    </div>

    <!-- Lead funnel -->
    <BaseCard>
      <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-6">{{ t('dashboard.salesFunnel') }}</h3>

      <div v-if="loading" class="space-y-4">
        <BaseSkeleton v-for="i in 5" :key="i" height="3rem" rounded="rounded-xl" />
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(item, index) in leadFunnelItems"
          :key="index"
          class="flex items-center gap-4"
        >
          <div class="w-24 text-sm text-[var(--text-secondary)]">{{ item.label }}</div>
          <div class="flex-1 h-10 overflow-hidden rounded-xl bg-[var(--bg-tertiary)]">
            <div
              :class="[item.color, 'h-full flex items-center px-3 text-white text-sm font-medium transition-all duration-500']"
              :style="{ width: `${Math.max((item.value / (stats?.leadStats?.totalCount || 1)) * 100, 5)}%` }"
            >
              {{ item.value }}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Quick stats -->
  </div>
</template>
