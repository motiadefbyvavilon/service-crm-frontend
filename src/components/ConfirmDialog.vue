<script setup>
import ModalBase from './ModalBase.vue'

defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true },
  confirmLabel: { type: String, default: 'Подтвердить' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <ModalBase :title="title" @close="emit('close')">
    <p class="text">{{ text }}</p>
    <footer class="foot">
      <button class="btn btn-ghost" type="button" @click="emit('close')">Отмена</button>
      <button class="btn btn-danger" type="button" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Выполняю…' : confirmLabel }}
      </button>
    </footer>
  </ModalBase>
</template>

<style scoped>
.text {
  margin: 0 0 18px;
  color: var(--text-secondary);
  font-size: 14.5px;
}

.foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
