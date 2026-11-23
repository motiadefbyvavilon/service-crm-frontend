<script setup>
defineProps({
  title: { type: String, required: true },
})
const emit = defineEmits(['close'])

function onBackdrop(e) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <div class="backdrop" @mousedown="onBackdrop">
    <div class="modal card" role="dialog" aria-modal="true" :aria-label="title">
      <header class="modal-head">
        <h2>{{ title }}</h2>
        <button class="icon-btn" type="button" aria-label="Закрыть" @click="emit('close')">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="m4 4 10 10M14 4 4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </header>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: oklch(26% 0.02 255 / 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: var(--z-modal);
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 0;
}

.modal-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--text-secondary);
}

.icon-btn:hover {
  background: var(--surface-2);
  color: var(--text);
}

.modal-body {
  padding: 14px 22px 22px;
}
</style>
