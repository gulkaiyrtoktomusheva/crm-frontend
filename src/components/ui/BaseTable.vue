<script setup>
defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: 'No data available'
  }
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full table-fixed">
      <thead>
        <tr class="bg-[var(--bg-tertiary)]">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider first:rounded-tl-xl last:rounded-tr-xl"
            :style="col.width ? { width: col.width } : {}"
          >
            <slot :name="`header-${col.key}`" :column="col">
              {{ col.label }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <!-- Loading state -->
        <template v-if="loading">
          <tr v-for="i in 5" :key="i">
            <td v-for="col in columns" :key="col.key" class="px-4 py-4">
              <div class="h-4 skeleton rounded" />
            </td>
          </tr>
        </template>

        <!-- Empty state -->
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length" class="px-4 py-12 text-center">
            <p class="text-[var(--text-secondary)]">{{ emptyText }}</p>
          </td>
        </tr>

        <!-- Data rows -->
        <template v-else>
          <tr
            v-for="(row, index) in data"
            :key="row.id || index"
            class="table-row"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-4 text-sm"
            >
              <slot :name="col.key" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
