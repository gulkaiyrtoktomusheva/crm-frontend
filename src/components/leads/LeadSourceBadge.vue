<script setup>
import { computed } from 'vue'

const props = defineProps({
  source: String
})

const config = {
  INSTAGRAM: { label: 'Instagram', class: 'bg-pink-500/10 text-pink-400' },
  TIKTOK: { label: 'TikTok', class: 'bg-cyan-500/10 text-cyan-400' },
  FACEBOOK: { label: 'Facebook', class: 'bg-blue-500/10 text-blue-400' },
  WHATSAPP: { label: 'WhatsApp', class: 'bg-emerald-500/10 text-emerald-400' },
  REFERRAL: { label: 'Referral', class: 'bg-amber-500/10 text-amber-400' },
  OTHER: { label: 'Other', class: 'bg-gray-500/10 text-gray-400' }
}

const sourceConfig = computed(() => config[props.source] || config.OTHER)
</script>

<template>
  <span
    :class="['inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium', sourceConfig.class]"
  >
    {{ sourceConfig.label }}
  </span>
</template>
