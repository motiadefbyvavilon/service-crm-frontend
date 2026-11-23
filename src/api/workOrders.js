import { loadDb, saveDb, delay, nextId, ApiError } from './db'

export const WORK_ORDER_STATUSES = ['Ожидает диагностики', 'В работе', 'Ожидает запчасти', 'Готов', 'Выдан']

const TRANSITIONS = {
  'Ожидает диагностики': ['В работе'],
  'В работе': ['Ожидает запчасти', 'Готов'],
  'Ожидает запчасти': ['В работе'],
  'Готов': ['Выдан'],
  'Выдан': [],
}

export async function listWorkOrders() {
  await delay()
  return [...loadDb().workOrders].sort((a, b) => b.number.localeCompare(a.number))
}

export async function getWorkOrder(id) {
  await delay()
  const wo = loadDb().workOrders.find((w) => w.id === id)
  if (!wo) throw new ApiError('Заказ-наряд не найден', 'NOT_FOUND')
  return wo
}

/** Создать заказ-наряд по записи (при прибытии клиента) */
export async function createFromAppointment(appointmentId) {
  await delay()
  const db = loadDb()
  const appt = db.appointments.find((a) => a.id === appointmentId)
  if (!appt) throw new ApiError('Запись не найдена', 'NOT_FOUND')
  if (appt.status !== 'Клиент прибыл') {
    throw new ApiError('Заказ-наряд создаётся только после отметки «Клиент прибыл»', 'CONFLICT')
  }
  const existing = db.workOrders.find((w) => w.appointmentId === appointmentId)
  if (existing) throw new ApiError(`По этой записи уже создан заказ-наряд ${existing.number}`, 'CONFLICT')

  const service = db.services.find((s) => s.id === appt.serviceId)
  const num = db.counters.wo++
  const wo = {
    id: nextId(db.workOrders, 'wo'),
    number: `ЗН-2026-${String(num).padStart(4, '0')}`,
    appointmentId,
    clientId: appt.clientId,
    vehicleId: appt.vehicleId,
    serviceId: appt.serviceId,
    employeeId: appt.employeeId,
    status: 'Ожидает диагностики',
    totalPrice: service?.price || 0,
    createdAt: new Date().toISOString(),
  }
  db.workOrders.push(wo)
  saveDb(db)
  return wo
}

export async function setWorkOrderStatus(id, status) {
  await delay()
  const db = loadDb()
  const wo = db.workOrders.find((w) => w.id === id)
  if (!wo) throw new ApiError('Заказ-наряд не найден', 'NOT_FOUND')
  if (!TRANSITIONS[wo.status]?.includes(status)) {
    throw new ApiError(`Переход «${wo.status}» → «${status}» недоступен`, 'CONFLICT')
  }
  wo.status = status
  saveDb(db)
  return wo
}

export function allowedWorkOrderTransitions(status) {
  return TRANSITIONS[status] || []
}
