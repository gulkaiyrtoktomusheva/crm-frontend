<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { dashboardApi } from '@/api/dashboard'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/dashboard/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import {
  Users,
  Target,
  TrendingUp,
  Wallet,
  AlertTriangle,
  GraduationCap
} from 'lucide-vue-next'

const { t } = useI18n()
const toast = useToast()
const stats = ref(null)
const loading = ref(true)

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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="bg-[var(--bg-secondary)] rounded-2xl border border-white/5 p-6">
          <BaseSkeleton height="1rem" width="40%" class="mb-2" />
          <BaseSkeleton height="2.5rem" width="60%" />
        </div>
      </template>

      <template v-else>
        <StatCard
          :title="t('dashboard.totalLeads')"
          :value="stats?.leadStats?.totalCount || 0"
          :icon="Target"
          iconColor="text-blue-400 bg-blue-400/10"
        />

        <StatCard
          :title="t('dashboard.activeStudents')"
          :value="stats?.activeStudents || 0"
          :icon="GraduationCap"
          iconColor="text-emerald-400 bg-emerald-400/10"
        />

        <StatCard
          :title="t('dashboard.atRiskStudents')"
          :value="stats?.atRiskStudents || 0"
          :icon="AlertTriangle"
          iconColor="text-amber-400 bg-amber-400/10"
        />

        <StatCard
          :title="t('dashboard.totalRevenue')"
          :value="formatCurrency(stats?.totalRevenue)"
          :icon="Wallet"
          iconColor="text-accent bg-accent/10"
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
          v-for="(item, index) in [
            { label: t('leads.statusNew'), value: stats?.leadStats?.newCount || 0, color: 'bg-blue-500' },
            { label: t('leads.statusContacted'), value: stats?.leadStats?.contactedCount || 0, color: 'bg-amber-500' },
            { label: t('leads.statusThinking'), value: stats?.leadStats?.thinkingCount || 0, color: 'bg-purple-500' },
            { label: t('leads.statusPaid'), value: stats?.leadStats?.paidCount || 0, color: 'bg-emerald-500' },
            { label: t('leads.statusRejected'), value: stats?.leadStats?.rejectedCount || 0, color: 'bg-red-500' }
          ]"
          :key="index"
          class="flex items-center gap-4"
        >
          <div class="w-24 text-sm text-[var(--text-secondary)]">{{ item.label }}</div>
          <div class="flex-1 h-10 bg-white/5 rounded-xl overflow-hidden">
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
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BaseCard>
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-emerald-500/10">
            <TrendingUp class="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('dashboard.totalGroups') }}</p>
            <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats?.totalGroups || 0 }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-amber-500/10">
            <Wallet class="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('dashboard.pendingPayments') }}</p>
            <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats?.pendingPayments || 0 }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-xl bg-red-500/10">
            <AlertTriangle class="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p class="text-sm text-[var(--text-secondary)]">{{ t('dashboard.overduePayments') }}</p>
            <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats?.overduePayments || 0 }}</p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
