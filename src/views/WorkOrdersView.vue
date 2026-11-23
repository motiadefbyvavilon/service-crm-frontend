<script setup>
// Заказ-наряды: список, фильтр по статусу, детали и смена статуса по допустимым переходам.
import { computed, onMounted, ref } from 'vue'
import {
  WORK_ORDER_STATUSES,
  allowedWorkOrderTransitions,
  listWorkOrders,
  setWorkOrderStatus,
} from '../api/workOrders'
import { listClients } from '../api/clients'
import { listVehicles } from '../api/vehicles'
import { listServices, listEmployees } from '../api/meta'
import { pushToast } from '../utils/toast'
import DataTable from '../components/DataTable.vue'
import ModalBase from '../components/ModalBase.vue'
import StatusTag from '../components/StatusTag.vue'

const columns = [
  { key: 'number', label: 'Номер', width: '130px' },
  { key: 'client', label: 'Клиент' },
  { key: 'vehicle', label: 'Автомобиль' },
  { key: 'service', label: 'Услуга' },
  { key: 'total', label: 'Сумма', width: '110px' },
  { key: 'status', label: 'Статус', width: '170px' },
]

const workOrders = ref([])
const clientsMap = ref({})
const vehiclesMap = ref({})
const servicesMap = ref({})
const employeesMap = ref({})
const statusFilter = ref('')
const loading = ref(true)
const loadError = ref('')

const selected = ref(null)
const busyStatus = ref(false)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [wos, clients, vehicles, services, employees] = await Promise.all([
      listWorkOrders(),
      listClients(),
      listVehicles(),
      listServices(),
      listEmployees(),
    ])
    workOrders.value = wos
    clientsMap.value = Object.fromEntries(clients.map((c) => [c.id, c]))
    vehiclesMap.value = Object.fromEntries(vehicles.map((v) => [v.id, v]))
    servicesMap.value = Object.fromEntries(services.map((s) => [s.id, s]))
    employeesMap.value = Object.fromEntries(employees.map((e) => [e.id, e]))
    if (selected.value) {
      selected.value = wos.find((w) => w.id === selected.value.id) ?? null
    }
  } catch {
    loadError.value = 'Не удалось загрузить заказ-наряды. Повторите попытку.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const rows = computed(() =>
  workOrders.value
    .filter((w) => !statusFilter.value || w.status === statusFilter.value)
    .map((w) => ({
      ...w,
      clientName: clientsMap.value[w.clientId]?.name ?? '—',
      vehicleLabel: vehiclesMap.value[w.vehicleId]
        ? `${vehiclesMap.value[w.vehicleId].brand} ${vehiclesMap.value[w.vehicleId].model} · ${vehiclesMap.value[w.vehicleId].plate}`
        : '—',
      serviceName: servicesMap.value[w.serviceId]?.name ?? '—',
      employeeName: employeesMap.value[w.employeeId]?.name ?? '—',
    })),
)

const selectedDetails = computed(() => {
  if (!selected.value) return null
  return rows.value.find((r) => r.id === selected.value.id) ?? selected.value
})

function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

async function onSetStatus(wo, status) {
  if (busyStatus.value) return
  busyStatus.value = true
  try {
    await setWorkOrderStatus(wo.id, status)
    pushToast(`${wo.number}: статус «${status}»`)
    await load()
  } catch (e) {
    pushToast(e.message || 'Не удалось изменить статус', 'error')
    await load()
  } finally {
    busyStatus.value = false
  }
}
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Заказ-наряды</h1>
        <p class="subtitle">Работы по прибывшим автомобилям</p>
      </div>
      <select v-model="statusFilter" class="status-filter" aria-label="Фильтр по статусу">
        <option value="">Все статусы</option>
        <option v-for="s in WORK_ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </header>

    <div v-if="loadError" class="card error-card">
      <p>{{ loadError }}</p>
      <button class="btn btn-primary btn-sm" type="button" @click="load">Повторить</button>
    </div>

    <DataTable
      v-else
      :columns="columns"
      :rows="rows"
      :loading="loading"
      empty-text="Заказ-нарядов пока нет — они создаются из расписания после отметки «Клиент прибыл»"
      @row-click="(row) => (selected = row)"
    >
      <template #number="{ row }">
        <span class="mono cell-main">{{ row.number }}</span>
      </template>
      <template #client="{ row }">{{ row.clientName }}</template>
      <template #vehicle="{ row }">{{ row.vehicleLabel }}</template>
      <template #service="{ row }">{{ row.serviceName }}</template>
      <template #total="{ row }">
        <span class="mono">{{ formatPrice(row.totalPrice) }}</span>
      </template>
      <template #status="{ row }">
        <StatusTag :status="row.status" />
      </template>
    </DataTable>

    <ModalBase
      v-if="selectedDetails"
      :title="`Заказ-наряд ${selectedDetails.number}`"
      @close="selected = null"
    >
      <dl class="details">
        <div><dt>Статус</dt><dd><StatusTag :status="selectedDetails.status" /></dd></div>
        <div><dt>Клиент</dt><dd>{{ selectedDetails.clientName }}</dd></div>
        <div><dt>Автомобиль</dt><dd>{{ selectedDetails.vehicleLabel }}</dd></div>
        <div><dt>Услуга</dt><dd>{{ selectedDetails.serviceName }}</dd></div>
        <div><dt>Сотрудник</dt><dd>{{ selectedDetails.employeeName }}</dd></div>
        <div><dt>Сумма</dt><dd class="mono">{{ formatPrice(selectedDetails.totalPrice) }}</dd></div>
        <div><dt>Создан</dt><dd>{{ formatDateTime(selectedDetails.createdAt) }}</dd></div>
      </dl>

      <footer v-if="allowedWorkOrderTransitions(selectedDetails.status).length" class="foot">
        <button
          v-for="next in allowedWorkOrderTransitions(selectedDetails.status)"
          :key="next"
          class="btn btn-primary btn-sm"
          type="button"
          :disabled="busyStatus"
          @click="onSetStatus(selectedDetails, next)"
        >
          → {{ next }}
        </button>
      </footer>
      <p v-else class="done-hint">Заказ-наряд закрыт.</p>
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
}

.status-filter {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 8px 10px;
  font-size: 14px;
}

.cell-main {
  font-weight: 600;
}

.error-card {
  padding: 24px;
  text-align: center;
  color: var(--danger);
}

.error-card p {
  margin: 0 0 12px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 16px;
}

.details > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 14.5px;
}

.details dt {
  color: var(--text-faint);
  font-size: 13px;
}

.details dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.done-hint {
  margin: 0;
  color: var(--text-faint);
  font-size: 13.5px;
  text-align: right;
}
</style>
