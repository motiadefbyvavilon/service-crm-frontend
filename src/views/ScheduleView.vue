<script setup>
// Расписание записей: выбор даты, фильтры по статусу и сотруднику,
// создание записи, смена статусов, создание заказ-наряда при прибытии клиента.
import { computed, onMounted, ref } from 'vue'
import {
  APPOINTMENT_STATUSES,
  allowedTransitions,
  createAppointment,
  listAppointments,
  setAppointmentStatus,
} from '../api/appointments'
import { listClients } from '../api/clients'
import { listVehicles } from '../api/vehicles'
import { listServices, listEmployees } from '../api/meta'
import { createFromAppointment, listWorkOrders } from '../api/workOrders'
import { pushToast } from '../utils/toast'
import DataTable from '../components/DataTable.vue'
import ModalBase from '../components/ModalBase.vue'
import AppointmentForm from '../components/AppointmentForm.vue'
import StatusTag from '../components/StatusTag.vue'

const columns = [
  { key: 'time', label: 'Время', width: '76px' },
  { key: 'client', label: 'Клиент' },
  { key: 'vehicle', label: 'Автомобиль' },
  { key: 'service', label: 'Услуга' },
  { key: 'employee', label: 'Сотрудник' },
  { key: 'status', label: 'Статус', width: '140px' },
  { key: 'actions', label: '', width: '250px' },
]

function todayISO() {
  return new Date().toLocaleDateString('sv')
}

const date = ref(todayISO())
const statusFilter = ref('')
const employeeFilter = ref('')

const loading = ref(true)
const loadError = ref('')
const appointments = ref([])
const clientsMap = ref({})
const vehiclesMap = ref({})
const servicesMap = ref({})
const employees = ref([])
const woByAppointment = ref({})

const showForm = ref(false)
const saving = ref(false)
const busyRowId = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [appts, clients, vehicles, services, emps, workOrders] = await Promise.all([
      listAppointments(date.value),
      listClients(),
      listVehicles(),
      listServices(),
      listEmployees(),
      listWorkOrders(),
    ])
    appointments.value = appts
    clientsMap.value = Object.fromEntries(clients.map((c) => [c.id, c]))
    vehiclesMap.value = Object.fromEntries(vehicles.map((v) => [v.id, v]))
    servicesMap.value = Object.fromEntries(services.map((s) => [s.id, s]))
    employees.value = emps
    woByAppointment.value = Object.fromEntries(
      workOrders.filter((w) => w.appointmentId).map((w) => [w.appointmentId, w]),
    )
  } catch {
    loadError.value = 'Не удалось загрузить расписание. Проверьте соединение и повторите.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const rows = computed(() =>
  appointments.value
    .filter((a) => !statusFilter.value || a.status === statusFilter.value)
    .filter((a) => !employeeFilter.value || a.employeeId === employeeFilter.value)
    .map((a) => ({
      ...a,
      clientName: clientsMap.value[a.clientId]?.name ?? '—',
      vehicleLabel: vehiclesMap.value[a.vehicleId]
        ? `${vehiclesMap.value[a.vehicleId].brand} ${vehiclesMap.value[a.vehicleId].model} · ${vehiclesMap.value[a.vehicleId].plate}`
        : '—',
      serviceName: servicesMap.value[a.serviceId]?.name ?? '—',
      employeeName: employees.value.find((e) => e.id === a.employeeId)?.name ?? '—',
    })),
)

const dateLabel = computed(() =>
  new Date(`${date.value}T12:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
)

function shiftDay(delta) {
  const d = new Date(`${date.value}T12:00:00`)
  d.setDate(d.getDate() + delta)
  date.value = d.toLocaleDateString('sv')
  load()
}

function goToday() {
  date.value = todayISO()
  load()
}

async function onSetStatus(appt, status) {
  if (busyRowId.value) return
  busyRowId.value = appt.id
  try {
    await setAppointmentStatus(appt.id, status)
    pushToast(`Запись ${appt.time}: статус «${status}»`)
    await load()
  } catch (e) {
    pushToast(e.message || 'Не удалось изменить статус', 'error')
    await load()
  } finally {
    busyRowId.value = ''
  }
}

async function onCreateWorkOrder(appt) {
  if (busyRowId.value) return
  busyRowId.value = appt.id
  try {
    const wo = await createFromAppointment(appt.id)
    pushToast(`Создан заказ-наряд ${wo.number}`)
    await load()
  } catch (e) {
    pushToast(e.message || 'Не удалось создать заказ-наряд', 'error')
    await load()
  } finally {
    busyRowId.value = ''
  }
}

async function onSubmitAppointment(payload) {
  if (saving.value) return
  saving.value = true
  try {
    await createAppointment(payload)
    pushToast('Запись создана')
    showForm.value = false
    await load()
  } catch (e) {
    // Конфликт слотов отклоняет сервер — показываем причину и перечитываем расписание
    pushToast(e.message || 'Ошибка сохранения записи', 'error')
    await load()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Расписание</h1>
        <p class="subtitle">{{ dateLabel }}</p>
      </div>
      <button class="btn btn-primary" type="button" @click="showForm = true">+ Новая запись</button>
    </header>

    <div class="toolbar">
      <div class="date-nav">
        <button class="btn btn-ghost btn-sm" type="button" aria-label="Предыдущий день" @click="shiftDay(-1)">←</button>
        <input v-model="date" type="date" class="date-input" @change="load" />
        <button class="btn btn-ghost btn-sm" type="button" aria-label="Следующий день" @click="shiftDay(1)">→</button>
        <button class="btn btn-ghost btn-sm" type="button" @click="goToday">Сегодня</button>
      </div>

      <div class="filters">
        <select v-model="statusFilter" aria-label="Фильтр по статусу">
          <option value="">Все статусы</option>
          <option v-for="s in APPOINTMENT_STATUSES" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="employeeFilter" aria-label="Фильтр по сотруднику">
          <option value="">Все сотрудники</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="loadError" class="card error-card">
      <p>{{ loadError }}</p>
      <button class="btn btn-primary btn-sm" type="button" @click="load">Повторить</button>
    </div>

    <DataTable
      v-else
      :columns="columns"
      :rows="rows"
      :loading="loading"
      empty-text="На эту дату записей нет"
    >
      <template #time="{ row }">
        <span class="mono time">{{ row.time }}</span>
      </template>
      <template #client="{ row }">
        <div class="cell-main">{{ row.clientName }}</div>
        <div v-if="row.comment" class="cell-sub">{{ row.comment }}</div>
      </template>
      <template #vehicle="{ row }">{{ row.vehicleLabel }}</template>
      <template #service="{ row }">{{ row.serviceName }}</template>
      <template #employee="{ row }">{{ row.employeeName }}</template>
      <template #status="{ row }">
        <StatusTag :status="row.status" />
      </template>
      <template #actions="{ row }">
        <div class="row-actions" @click.stop>
          <template v-if="woByAppointment[row.id]">
            <span class="wo-ref mono">{{ woByAppointment[row.id].number }}</span>
          </template>
          <template v-else-if="row.status === 'Клиент прибыл'">
            <button
              class="btn btn-primary btn-sm"
              type="button"
              :disabled="busyRowId === row.id"
              @click="onCreateWorkOrder(row)"
            >
              Создать заказ-наряд
            </button>
          </template>
          <template v-else>
            <button
              v-for="next in allowedTransitions(row.status)"
              :key="next"
              class="btn btn-sm"
              :class="next === 'Отменена' ? 'btn-danger' : 'btn-ghost'"
              type="button"
              :disabled="busyRowId === row.id"
              @click="onSetStatus(row, next)"
            >
              {{ next }}
            </button>
          </template>
        </div>
      </template>
    </DataTable>

    <ModalBase v-if="showForm" title="Новая запись" @close="showForm = false">
      <AppointmentForm
        :busy="saving"
        :initial-date="date"
        @submit="onSubmitAppointment"
        @cancel="showForm = false"
      />
    </ModalBase>
  </section>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.subtitle {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  text-transform: capitalize;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input,
.filters select {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 7px 10px;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 8px;
}

.time {
  font-weight: 600;
  font-size: 14px;
}

.cell-main {
  font-weight: 600;
}

.cell-sub {
  font-size: 12.5px;
  color: var(--text-faint);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.wo-ref {
  font-size: 13px;
  color: var(--text-faint);
  align-self: center;
}

.error-card {
  padding: 24px;
  text-align: center;
  color: var(--danger);
}

.error-card p {
  margin: 0 0 12px;
}
</style>
