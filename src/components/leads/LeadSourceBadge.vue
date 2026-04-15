<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  source: String
})

const { t } = useI18n()

const config = {
  INSTAGRAM: { key: 'INSTAGRAM', class: 'bg-pink-500/10 text-pink-400' },
  TIKTOK: { key: 'TIKTOK', class: 'bg-cyan-500/10 text-cyan-400' },
  FACEBOOK: { key: 'FACEBOOK', class: 'bg-blue-500/10 text-blue-400' },
  WHATSAPP: { key: 'WHATSAPP', class: 'bg-emerald-500/10 text-emerald-400' },
  REFERRAL: { key: 'REFERRAL', class: 'bg-amber-500/10 text-amber-400' },
  OTHER: { key: 'OTHER', class: 'bg-gray-500/10 text-gray-400' }
}

const sourceConfig = computed(() => config[props.source] || config.OTHER)
</script>

<template>
  <span
    :class="['inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium', sourceConfig.class]"
  >
    {{ t(`sources.${sourceConfig.key}`) }}
  </span>
</template>
