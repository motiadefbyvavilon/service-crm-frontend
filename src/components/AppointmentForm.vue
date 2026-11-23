<script setup>
// Форма новой записи. Автомобили подгружаются по выбранному клиенту.
// Доступность слота окончательно проверяет «сервер» (api/appointments).
import { onMounted, reactive, ref, watch } from 'vue'
import { listClients } from '../api/clients'
import { listVehiclesByClient } from '../api/vehicles'
import { listServices, listEmployees } from '../api/meta'

const props = defineProps({
  busy: { type: Boolean, default: false },
  initialDate: { type: String, default: '' },
})
const emit = defineEmits(['submit', 'cancel'])

const clients = ref([])
const vehicles = ref([])
const services = ref([])
const employees = ref([])
const loadingRefs = ref(true)
const refsError = ref('')

const form = reactive({
  clientId: '',
  vehicleId: '',
  serviceId: '',
  employeeId: '',
  date: props.initialDate || new Date().toLocaleDateString('sv'),
  time: '',
  comment: '',
})

const errors = reactive({ clientId: '', vehicleId: '', serviceId: '', employeeId: '', date: '', time: '' })

onMounted(async () => {
  loadingRefs.value = true
  refsError.value = ''
  try {
    ;[clients.value, services.value, employees.value] = await Promise.all([
      listClients(),
      listServices(),
      listEmployees(),
    ])
  } catch {
    refsError.value = 'Не удалось загрузить справочники. Закройте окно и попробуйте снова.'
  } finally {
    loadingRefs.value = false
  }
})

watch(
  () => form.clientId,
  async (clientId) => {
    form.vehicleId = ''
    vehicles.value = []
    if (clientId) vehicles.value = await listVehiclesByClient(clientId)
  },
)

function validate() {
  errors.clientId = form.clientId ? '' : 'Выберите клиента'
  errors.vehicleId = form.vehicleId ? '' : 'Выберите автомобиль'
  errors.serviceId = form.serviceId ? '' : 'Выберите услугу'
  errors.employeeId = form.employeeId ? '' : 'Выберите сотрудника'
  errors.date = form.date ? '' : 'Укажите дату'
  errors.time = form.time ? '' : 'Укажите время'
  return Object.values(errors).every((e) => !e)
}

function onSubmit() {
  if (props.busy) return
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="onSubmit">
    <p v-if="loadingRefs" class="hint">Загружаю справочники…</p>
    <p v-else-if="refsError" class="field-error">{{ refsError }}</p>

    <template v-else>
      <div class="field">
        <label for="af-client">Клиент *</label>
        <select id="af-client" v-model="form.clientId">
          <option value="" disabled>Выберите клиента</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }} — {{ c.phone }}</option>
        </select>
        <span v-if="errors.clientId" class="field-error">{{ errors.clientId }}</span>
      </div>

      <div class="field">
        <label for="af-vehicle">Автомобиль *</label>
        <select id="af-vehicle" v-model="form.vehicleId" :disabled="!form.clientId">
          <option value="" disabled>
            {{ form.clientId ? (vehicles.length ? 'Выберите автомобиль' : 'У клиента нет автомобилей') : 'Сначала выберите клиента' }}
          </option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">
            {{ v.brand }} {{ v.model }} · {{ v.plate }}
          </option>
        </select>
        <span v-if="errors.vehicleId" class="field-error">{{ errors.vehicleId }}</span>
      </div>

      <div class="row">
        <div class="field">
          <label for="af-service">Услуга *</label>
          <select id="af-service" v-model="form.serviceId">
            <option value="" disabled>Выберите услугу</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <span v-if="errors.serviceId" class="field-error">{{ errors.serviceId }}</span>
        </div>
        <div class="field">
          <label for="af-employee">Сотрудник *</label>
          <select id="af-employee" v-model="form.employeeId">
            <option value="" disabled>Выберите сотрудника</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
          <span v-if="errors.employeeId" class="field-error">{{ errors.employeeId }}</span>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="af-date">Дата *</label>
          <input id="af-date" v-model="form.date" type="date" />
          <span v-if="errors.date" class="field-error">{{ errors.date }}</span>
        </div>
        <div class="field">
          <label for="af-time">Время *</label>
          <input id="af-time" v-model="form.time" type="time" step="900" />
          <span v-if="errors.time" class="field-error">{{ errors.time }}</span>
        </div>
      </div>

      <div class="field">
        <label for="af-comment">Комментарий</label>
        <textarea id="af-comment" v-model="form.comment" rows="2" placeholder="Описание проблемы, пожелания" />
      </div>

      <footer class="form-foot">
        <button class="btn btn-ghost" type="button" :disabled="busy" @click="emit('cancel')">Отмена</button>
        <button class="btn btn-primary" type="submit" :disabled="busy">
          {{ busy ? 'Сохраняю…' : 'Создать запись' }}
        </button>
      </footer>
    </template>
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

.hint {
  margin: 0;
  color: var(--text-faint);
  font-size: 14px;
}

.form-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
