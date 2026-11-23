<script setup>
// Переиспользуемая таблица: колонки через props, ячейки через слоты
defineProps({
  columns: { type: Array, required: true }, // [{ key, label, width? }]
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Записей нет' },
  rowKey: { type: String, default: 'id' },
})
</script>

<template>
  <div class="table-wrap card">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : {}">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="loading">
        <tr v-for="i in 3" :key="i">
          <td :colspan="columns.length">
            <div class="skeleton" :style="{ width: `${90 - i * 15}%` }" />
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="rows.length">
        <tr v-for="row in rows" :key="row[rowKey]" @click="$emit('rowClick', row)">
          <td v-for="col in columns" :key="col.key">
            <slot :name="col.key" :row="row">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="columns.length" class="empty">{{ emptyText }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default { emits: ['rowClick'] }
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

th,
td {
  text-align: left;
  padding: 11px 16px;
  font-size: 14px;
}

th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

td {
  border-bottom: 1px solid var(--surface-2);
}

tbody tr:last-child td {
  border-bottom: none;
}

.empty {
  text-align: center;
  color: var(--text-faint);
  padding: 36px 16px;
}

.skeleton {
  height: 14px;
  border-radius: 6px;
  background: var(--surface-2);
  animation: pulse 1.1s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
</style>
