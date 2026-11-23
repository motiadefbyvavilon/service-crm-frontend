<script setup>
// Переиспользуемый тег статуса с единой палитрой
const props = defineProps({
  status: { type: String, required: true },
})

const TONES = {
  'Новая': 'blue',
  'Подтверждена': 'violet',
  'Клиент прибыл': 'green',
  'Отменена': 'gray',
  'Ожидает диагностики': 'blue',
  'В работе': 'orange',
  'Ожидает запчасти': 'red',
  'Готов': 'green',
  'Выдан': 'gray',
}

function tone() {
  return TONES[props.status] || 'gray'
}
</script>

<template>
  <span class="tag" :class="`tag-${tone()}`">{{ status }}</span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.tag-blue { background: var(--p-blue-100); color: var(--p-blue-600); }
.tag-violet { background: var(--p-violet-100); color: var(--p-violet-700); }
.tag-green { background: var(--p-green-100); color: var(--p-green-600); }
.tag-orange { background: var(--accent-soft); color: var(--accent-strong); }
.tag-red { background: var(--danger-soft); color: var(--danger); }
.tag-gray { background: var(--surface-2); color: var(--text-faint); }
</style>
