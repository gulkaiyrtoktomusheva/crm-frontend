<script setup>
import { computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps({
  status: String
})

const config = {
  ACTIVE: { label: 'Active', variant: 'success' },
  AT_RISK: { label: 'At Risk', variant: 'warning' },
  DROPPED: { label: 'Dropped', variant: 'danger' },
  COMPLETED: { label: 'Completed', variant: 'info' }
}

const statusConfig = computed(() => config[props.status] || { label: props.status, variant: 'default' })
</script>

<template>
  <BaseBadge :variant="statusConfig.variant" dot>
    {{ statusConfig.label }}
  </BaseBadge>
</template>
