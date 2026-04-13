<script setup>
import { computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps({
  status: String
})

const config = {
  PAID: { label: 'Paid', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  OVERDUE: { label: 'Overdue', variant: 'danger' }
}

const statusConfig = computed(() => config[props.status] || { label: props.status, variant: 'default' })
</script>

<template>
  <BaseBadge :variant="statusConfig.variant" dot>
    {{ statusConfig.label }}
  </BaseBadge>
</template>
