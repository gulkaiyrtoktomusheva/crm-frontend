<script setup>
import { useI18n } from 'vue-i18n'
import { Users, Calendar, Clock, ExternalLink } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'

const { t } = useI18n()

defineProps({
  group: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const subjectColors = {
  'Математика': 'from-blue-500 to-cyan-500',
  'Химия': 'from-emerald-500 to-teal-500',
  'Биология': 'from-green-500 to-lime-500',
  'Физика': 'from-amber-500 to-orange-500',
  'default': 'from-violet-500 to-purple-500'
}

function getSubjectColor(name) {
  return subjectColors[name] || subjectColors.default
}
</script>

<template>
  <BaseCard hoverable padding="none" @click="$emit('click', group)">
    <!-- Color bar -->
    <div
      :class="['h-1 rounded-t-2xl bg-gradient-to-r', getSubjectColor(group.subjectName)]"
    />

    <div class="p-5">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-xs text-[var(--text-secondary)] mb-1">{{ group.subjectName }}</p>
          <h3 class="font-semibold text-[var(--text-primary)]">{{ group.name }}</h3>
        </div>
        <a
          v-if="group.zoomLink"
          :href="group.zoomLink"
          target="_blank"
          @click.stop
          class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-accent transition-colors"
        >
          <ExternalLink class="w-4 h-4" />
        </a>
      </div>

      <!-- Info -->
      <div class="space-y-2 text-sm">
        <div v-if="group.teacherName" class="flex items-center gap-2 text-[var(--text-secondary)]">
          <Users class="w-4 h-4" />
          <span>{{ group.teacherName }}</span>
        </div>

        <div v-if="group.schedule" class="flex items-center gap-2 text-[var(--text-secondary)]">
          <Clock class="w-4 h-4" />
          <span>{{ group.schedule }}</span>
        </div>

        <div class="flex items-center gap-2 text-[var(--text-secondary)]">
          <Calendar class="w-4 h-4" />
          <span>{{ group.studentCount || 0 }} {{ t('common.students') }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
