<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { groupsApi } from '@/api/groups'
import { attendanceApi } from '@/api/attendance'
import { useToast } from '@/composables/useToast'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { ArrowLeft, Users, Calendar, Clock, ExternalLink, Check, X } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const group = ref(null)
const loading = ref(true)
const attendanceDate = ref(new Date().toISOString().split('T')[0])
const attendance = ref([])
const savingAttendance = ref(false)

onMounted(async () => {
  try {
    group.value = await groupsApi.getById(route.params.id)
    await fetchAttendance()
  } catch (e) {
    toast.error(t('groups.failedLoadGroup'))
    router.push('/groups')
  } finally {
    loading.value = false
  }
})

watch(attendanceDate, async () => {
  if (group.value) {
    await fetchAttendance()
  }
})

async function fetchAttendance() {
  const baseRecords = (group.value?.students || []).map((student) => ({
    studentId: student.id,
    studentName: student.fullName,
    present: null
  }))

  try {
    const records = await attendanceApi.getByGroupAndDate(route.params.id, attendanceDate.value)
    const attendanceMap = new Map(records.map((record) => [record.studentId, record.present]))
    attendance.value = baseRecords.map((record) => ({
      ...record,
      present: attendanceMap.has(record.studentId) ? attendanceMap.get(record.studentId) : null
    }))
  } catch (e) {
    attendance.value = baseRecords
  }
}

function toggleAttendance(studentId, present) {
  const record = attendance.value.find(a => a.studentId === studentId)
  if (record) {
    record.present = record.present === present ? null : present
  }
}

async function saveAttendance() {
  const records = attendance.value
    .filter(a => a.present !== null)
    .map(a => ({ studentId: a.studentId, present: a.present }))

  if (records.length === 0) {
    toast.warning(t('groups.noAttendanceMarked'))
    return
  }

  savingAttendance.value = true
  try {
    await attendanceApi.markAttendance(group.value.id, {
      lessonDate: attendanceDate.value,
      records
    })
    toast.success(t('groups.attendanceSaved'))
  } catch (e) {
    toast.error(t('groups.failedSaveAttendance'))
  } finally {
    savingAttendance.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back button -->
    <button
      @click="router.push('/groups')"
      class="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      {{ t('groups.backToGroups') }}
    </button>

    <!-- Loading -->
    <template v-if="loading">
      <BaseCard>
        <BaseSkeleton height="2rem" width="40%" class="mb-4" />
        <BaseSkeleton height="1rem" width="60%" />
      </BaseCard>
    </template>

    <template v-else-if="group">
      <!-- Group info -->
      <BaseCard>
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p class="text-sm text-accent mb-1">{{ group.subjectName }}</p>
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ group.name }}</h1>

            <div class="flex flex-wrap items-center gap-4 mt-4 text-sm text-[var(--text-secondary)]">
              <span v-if="group.teacherName" class="flex items-center gap-1">
                <Users class="w-4 h-4" /> {{ group.teacherName }}
              </span>
              <span class="flex items-center gap-1">
                <Calendar class="w-4 h-4" />
                {{ group.startDate ? new Date(group.startDate).toLocaleDateString('ru-RU') : '-' }}
                -
                {{ group.endDate ? new Date(group.endDate).toLocaleDateString('ru-RU') : '-' }}
              </span>
              <span class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                {{ group.students?.length || 0 }} {{ t('common.students') }}
              </span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Students & Attendance -->
      <BaseCard>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ t('groups.markAttendance') }}</h2>
          <div class="flex items-center gap-3">
            <input
              v-model="attendanceDate"
              type="date"
              class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[var(--text-primary)]"
            />
            <BaseButton :loading="savingAttendance" @click="saveAttendance">
              {{ t('groups.saveAttendance') }}
            </BaseButton>
          </div>
        </div>

        <div v-if="group.students?.length" class="space-y-2">
          <div
            v-for="record in attendance"
            :key="record.studentId"
            class="flex items-center justify-between p-4 bg-white/5 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <BaseAvatar :name="record.studentName" size="sm" />
              <span class="font-medium text-[var(--text-primary)]">{{ record.studentName }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="toggleAttendance(record.studentId, true)"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  record.present === true
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-[var(--text-secondary)] hover:bg-emerald-500/20 hover:text-emerald-400'
                ]"
              >
                <Check class="w-5 h-5" />
              </button>
              <button
                @click="toggleAttendance(record.studentId, false)"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  record.present === false
                    ? 'bg-red-500 text-white'
                    : 'bg-white/5 text-[var(--text-secondary)] hover:bg-red-500/20 hover:text-red-400'
                ]"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <p v-else class="text-[var(--text-secondary)] text-center py-8">
          {{ t('groups.noStudentsInGroup') }}
        </p>
      </BaseCard>
    </template>
  </div>
</template>
