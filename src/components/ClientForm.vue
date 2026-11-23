<script setup>
// Переиспользуемая форма клиента: создание и редактирование.
// Пока идёт сохранение (busy), кнопка заблокирована — повторная отправка невозможна.
import { reactive } from 'vue'

const props = defineProps({
  initial: { type: Object, default: null },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  id: props.initial?.id ?? null,
  name: props.initial?.name ?? '',
  phone: props.initial?.phone ?? '',
  email: props.initial?.email ?? '',
  comment: props.initial?.comment ?? '',
})

const errors = reactive({ name: '', phone: '', email: '' })

function validate() {
  errors.name = form.name.trim() ? '' : 'Укажите имя клиента'
  errors.phone = form.phone.trim() ? '' : 'Укажите телефон'
  errors.email =
    form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? 'Некорректный адрес почты'
      : ''
  return !errors.name && !errors.phone && !errors.email
}

function onSubmit() {
  if (props.busy) return
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="cf-name">Имя *</label>
      <input id="cf-name" v-model="form.name" type="text" placeholder="Иван Петров" autocomplete="off" />
      <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
    </div>

    <div class="field">
      <label for="cf-phone">Телефон *</label>
      <input id="cf-phone" v-model="form.phone" type="tel" placeholder="+7 900 000-00-00" autocomplete="off" />
      <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
    </div>

    <div class="field">
      <label for="cf-email">Email</label>
      <input id="cf-email" v-model="form.email" type="email" placeholder="client@mail.ru" autocomplete="off" />
      <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
    </div>

    <div class="field">
      <label for="cf-comment">Комментарий</label>
      <textarea id="cf-comment" v-model="form.comment" rows="3" placeholder="Пожелания, скидки, особенности" />
    </div>

    <footer class="form-foot">
      <button class="btn btn-ghost" type="button" :disabled="busy" @click="emit('cancel')">Отмена</button>
      <button class="btn btn-primary" type="submit" :disabled="busy">
        {{ busy ? 'Сохраняю…' : 'Сохранить' }}
      </button>
    </footer>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
