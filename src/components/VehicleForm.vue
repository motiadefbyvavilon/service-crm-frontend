<script setup>
// Переиспользуемая форма автомобиля клиента
import { reactive } from 'vue'

const props = defineProps({
  initial: { type: Object, default: null },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  id: props.initial?.id ?? null,
  clientId: props.initial?.clientId ?? null,
  brand: props.initial?.brand ?? '',
  model: props.initial?.model ?? '',
  plate: props.initial?.plate ?? '',
  year: props.initial?.year ?? '',
})

const errors = reactive({ brand: '', model: '', plate: '', year: '' })

function validate() {
  errors.brand = form.brand.trim() ? '' : 'Укажите марку'
  errors.model = form.model.trim() ? '' : 'Укажите модель'
  errors.plate = form.plate.trim() ? '' : 'Укажите госномер'
  const y = Number(form.year)
  errors.year =
    form.year === '' || form.year === null
      ? ''
      : !Number.isInteger(y) || y < 1950 || y > new Date().getFullYear() + 1
        ? 'Некорректный год'
        : ''
  return !errors.brand && !errors.model && !errors.plate && !errors.year
}

function onSubmit() {
  if (props.busy) return
  if (!validate()) return
  emit('submit', { ...form, year: form.year === '' ? null : Number(form.year) })
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="onSubmit">
    <div class="row">
      <div class="field">
        <label for="vf-brand">Марка *</label>
        <input id="vf-brand" v-model="form.brand" type="text" placeholder="Kia" autocomplete="off" />
        <span v-if="errors.brand" class="field-error">{{ errors.brand }}</span>
      </div>
      <div class="field">
        <label for="vf-model">Модель *</label>
        <input id="vf-model" v-model="form.model" type="text" placeholder="Rio" autocomplete="off" />
        <span v-if="errors.model" class="field-error">{{ errors.model }}</span>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="vf-plate">Госномер *</label>
        <input id="vf-plate" v-model="form.plate" type="text" placeholder="А123ВС77" autocomplete="off" />
        <span v-if="errors.plate" class="field-error">{{ errors.plate }}</span>
      </div>
      <div class="field">
        <label for="vf-year">Год выпуска</label>
        <input id="vf-year" v-model="form.year" type="number" min="1950" max="2030" placeholder="2020" />
        <span v-if="errors.year" class="field-error">{{ errors.year }}</span>
      </div>
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

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
