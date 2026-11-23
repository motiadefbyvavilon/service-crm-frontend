<script setup>
// Карточка клиента: данные, автомобили, история обращений (записи + заказ-наряды).
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getClient, saveClient } from '../api/clients'
import { deleteVehicle, listVehiclesByClient, saveVehicle } from '../api/vehicles'
import { listAppointments } from '../api/appointments'
import { listWorkOrders } from '../api/workOrders'
import { listServices, listEmployees } from '../api/meta'
import { pushToast } from '../utils/toast'
import DataTable from '../components/DataTable.vue'
import ModalBase from '../components/ModalBase.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ClientForm from '../components/ClientForm.vue'
import VehicleForm from '../components/VehicleForm.vue'
import StatusTag from '../components/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const clientId = route.params.id

const loading = ref(true)
const notFound = ref(false)
const client = ref(null)
const vehicles = ref([])
const appointments = ref([])
const workOrders = ref([])
const servicesMap = ref({})
const employeesMap = ref({})

const vehicleColumns = [
  { key: 'vehicle', label: 'Автомобиль' },
  { key: 'plate', label: 'Госномер', width: '140px' },
  { key: 'year', label: 'Год', width: '80px' },
  { key: 'actions', label: '', width: '170px' },
]

const historyColumns = [
  { key: 'when', label: 'Дата', width: '130px' },
  { key: 'kind', label: 'Тип', width: '130px' },
  { key: 'service', label: 'Услуга' },
  { key: 'employee', label: 'Сотрудник' },
  { key: 'status', label: 'Статус', width: '150px' },
]

const showClientForm = ref(false)
const showVehicleForm = ref(false)
const editingVehicle = ref(null)
const deletingVehicle = ref(null)
const saving = ref(false)
const deleting = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const [c, vs, appts, wos, services, employees] = await Promise.all([
      getClient(clientId),
      listVehiclesByClient(clientId),
      listAppointments(),
      listWorkOrders(),
      listServices(),
      listEmployees(),
    ])
    client.value = c
    vehicles.value = vs
    appointments.value = appts.filter((a) => a.clientId === clientId)
    workOrders.value = wos.filter((w) => w.clientId === clientId)
    servicesMap.value = Object.fromEntries(services.map((s) => [s.id, s]))
    employeesMap.value = Object.fromEntries(employees.map((e) => [e.id, e]))
  } catch (e) {
    if (e.code === 'NOT_FOUND') notFound.value = true
    else pushToast(e.message || 'Ошибка загрузки карточки клиента', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const historyRows = computed(() => {
  const fromAppointments = appointments.value.map((a) => ({
    id: `appt-${a.id}`,
    when: a.date,
    kind: 'Запись',
    serviceName: servicesMap.value[a.serviceId]?.name ?? '—',
    employeeName: employeesMap.value[a.employeeId]?.name ?? '—',
    status: a.status,
    sortKey: `${a.date}T${a.time}`,
  }))
  const fromWorkOrders = workOrders.value.map((w) => ({
    id: `wo-${w.id}`,
    when: w.createdAt.slice(0, 10),
    kind: w.number,
    serviceName: servicesMap.value[w.serviceId]?.name ?? '—',
    employeeName: employeesMap.value[w.employeeId]?.name ?? '—',
    status: w.status,
    sortKey: w.createdAt,
  }))
  return [...fromAppointments, ...fromWorkOrders].sort((a, b) => b.sortKey.localeCompare(a.sortKey))
})

function formatDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function onSubmitClient(payload) {
  if (saving.value) return
  saving.value = true
  try {
    await saveClient({ ...payload, id: clientId })
    pushToast('Данные клиента обновлены')
    showClientForm.value = false
    await load()
  } catch (e) {
    pushToast(e.message || 'Ошибка сохранения клиента', 'error')
  } finally {
    saving.value = false
  }
}

function openVehicleForm(vehicle = null) {
  editingVehicle.value = vehicle
  showVehicleForm.value = true
}

async function onSubmitVehicle(payload) {
  if (saving.value) return
  saving.value = true
  try {
    await saveVehicle({ ...payload, clientId })
    pushToast(payload.id ? 'Автомобиль обновлён' : 'Автомобиль добавлен')
    showVehicleForm.value = false
    await load()
  } catch (e) {
    pushToast(e.message || 'Ошибка сохранения автомобиля', 'error')
  } finally {
    saving.value = false
  }
}

async function onConfirmDelete() {
  if (deleting.value || !deletingVehicle.value) return
  deleting.value = true
  try {
    await deleteVehicle(deletingVehicle.value.id)
    pushToast('Автомобиль удалён')
    deletingVehicle.value = null
    await load()
  } catch (e) {
    pushToast(e.message || 'Не удалось удалить автомобиль', 'error')
    deletingVehicle.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section>
    <button class="back-link" type="button" @click="router.push('/clients')">← Все клиенты</button>

    <div v-if="loading" class="card skeleton-card">
      <div class="skeleton-line" style="width: 45%" />
      <div class="skeleton-line" style="width: 70%" />
      <div class="skeleton-line" style="width: 60%" />
    </div>

    <div v-else-if="notFound" class="card empty-card">
      <h2>Клиент не найден</h2>
      <p>Возможно, карточка была удалена.</p>
      <button class="btn btn-primary btn-sm" type="button" @click="router.push('/clients')">К списку клиентов</button>
    </div>

    <template v-else-if="client">
      <header class="page-head">
        <div>
          <h1>{{ client.name }}</h1>
          <p class="subtitle">
            <span class="mono">{{ client.phone }}</span>
            <template v-if="client.email"> · {{ client.email }}</template>
          </p>
          <p v-if="client.comment" class="comment">{{ client.comment }}</p>
        </div>
        <button class="btn btn-ghost" type="button" @click="showClientForm = true">Редактировать</button>
      </header>

      <div class="card section-card">
        <header class="section-head">
          <h2>Автомобили</h2>
          <button class="btn btn-ghost btn-sm" type="button" @click="openVehicleForm()">+ Добавить</button>
        </header>
        <DataTable
          :columns="vehicleColumns"
          :rows="vehicles"
          empty-text="У клиента пока нет автомобилей"
        >
          <template #vehicle="{ row }">
            <span class="cell-main">{{ row.brand }} {{ row.model }}</span>
          </template>
          <template #plate="{ row }">
            <span class="mono">{{ row.plate }}</span>
          </template>
          <template #year="{ row }">{{ row.year || '—' }}</template>
          <template #actions="{ row }">
            <div class="row-actions" @click.stop>
              <button class="btn btn-ghost btn-sm" type="button" @click="openVehicleForm(row)">Изменить</button>
              <button class="btn btn-danger btn-sm" type="button" @click="deletingVehicle = row">Удалить</button>
            </div>
          </template>
        </DataTable>
      </div>

      <div class="card section-card">
        <header class="section-head">
          <h2>История обращений</h2>
        </header>
        <DataTable :columns="historyColumns" :rows="historyRows" empty-text="Обращений пока не было">
          <template #when="{ row }">{{ formatDate(row.when) }}</template>
          <template #kind="{ row }">
            <span :class="{ mono: row.kind.startsWith('ЗН') }">{{ row.kind }}</span>
          </template>
          <template #service="{ row }">{{ row.serviceName }}</template>
          <template #employee="{ row }">{{ row.employeeName }}</template>
          <template #status="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </DataTable>
      </div>
    </template>

    <ModalBase v-if="showClientForm" title="Редактировать клиента" @close="showClientForm = false">
      <ClientForm :initial="client" :busy="saving" @submit="onSubmitClient" @cancel="showClientForm = false" />
    </ModalBase>

    <ModalBase
      v-if="showVehicleForm"
      :title="editingVehicle ? 'Редактировать автомобиль' : 'Новый автомобиль'"
      @close="showVehicleForm = false"
    >
      <VehicleForm
        :initial="editingVehicle"
        :busy="saving"
        @submit="onSubmitVehicle"
        @cancel="showVehicleForm = false"
      />
    </ModalBase>

    <ConfirmDialog
      v-if="deletingVehicle"
      title="Удалить автомобиль?"
      :text="`${deletingVehicle.brand} ${deletingVehicle.model} · ${deletingVehicle.plate}. Автомобиль нельзя удалить, если по нему есть активные записи.`"
      confirm-label="Удалить"
      :busy="deleting"
      @confirm="onConfirmDelete"
      @close="deletingVehicle = null"
    />
  </section>
</template>

<style scoped>
.back-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  padding: 0;
  margin-bottom: 14px;
}

.back-link:hover {
  color: var(--accent);
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 14.5px;
}

.comment {
  margin: 6px 0 0;
  font-size: 13.5px;
  color: var(--text-faint);
}

.section-card {
  padding: 18px 18px 10px;
  margin-bottom: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.section-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.cell-main {
  font-weight: 600;
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.empty-card {
  padding: 40px 24px;
  text-align: center;
}

.empty-card h2 {
  margin: 0 0 6px;
}

.empty-card p {
  margin: 0 0 16px;
  color: var(--text-secondary);
}

.skeleton-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  border-radius: 6px;
  background: var(--surface-2);
  animation: pulse 1.1s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
</style>
