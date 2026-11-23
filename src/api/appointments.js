import { loadDb, saveDb, delay, nextId, ApiError } from './db'

export const APPOINTMENT_STATUSES = ['Новая', 'Подтверждена', 'Клиент прибыл', 'Отменена']

// Допустимые переходы статусов записи
const TRANSITIONS = {
  'Новая': ['Подтверждена', 'Отменена'],
  'Подтверждена': ['Клиент прибыл', 'Отменена'],
  'Клиент прибыл': [],
  'Отменена': [],
}

function toMin(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export async function listAppointments(date = null) {
  await delay()
  const all = loadDb().appointments
  const list = date ? all.filter((a) => a.date === date) : all
  return [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

/** Свободен ли интервал у сотрудника (проверка на стороне «сервера») */
function findConflict(db, { employeeId, date, time, durationMin }, excludeId = null) {
  const start = toMin(time)
  const end = start + durationMin
  return db.appointments.find((a) => {
    if (a.id === excludeId || a.status === 'Отменена') return false
    if (a.employeeId !== employeeId || a.date !== date) return false
    const s = toMin(a.time)
    const e = s + (a.durationMin || 60)
    return start < e && s < end
  })
}

export async function createAppointment(payload) {
  await delay()
  for (const [key, label] of [
    ['clientId', 'клиента'],
    ['vehicleId', 'автомобиль'],
    ['serviceId', 'услугу'],
    ['employeeId', 'сотрудника'],
  ]) {
    if (!payload[key]) throw new ApiError(`Необходимо выбрать ${key === 'clientId' ? 'клиента' : label}`, 'VALIDATION')
  }
  if (!payload.date) throw new ApiError('Укажите дату записи', 'VALIDATION')
  if (!payload.time) throw new ApiError('Укажите время записи', 'VALIDATION')

  const db = loadDb()
  const service = db.services.find((s) => s.id === payload.serviceId)
  const durationMin = service?.durationMin || 60
  // Окончательное решение о доступности принимает сервер
  const conflict = findConflict(db, { ...payload, durationMin })
  if (conflict) {
    const conflictService = db.services.find((s) => s.id === conflict.serviceId)
    throw new ApiError(
      `Конфликт записи: у сотрудника в ${conflict.time} уже есть запись «${conflictService?.name || 'услуга'}». Выберите другое время или сотрудника.`,
      'CONFLICT',
    )
  }

  const appointment = {
    id: nextId(db.appointments, 'a'),
    comment: '',
    durationMin,
    ...payload,
    status: 'Новая',
    createdAt: new Date().toISOString(),
  }
  db.appointments.push(appointment)
  saveDb(db)
  return appointment
}

export async function setAppointmentStatus(id, status) {
  await delay()
  const db = loadDb()
  const appt = db.appointments.find((a) => a.id === id)
  if (!appt) throw new ApiError('Запись не найдена', 'NOT_FOUND')
  if (!TRANSITIONS[appt.status]?.includes(status)) {
    throw new ApiError(`Переход «${appt.status}» → «${status}» недоступен`, 'CONFLICT')
  }
  appt.status = status
  saveDb(db)
  return appt
}

export function allowedTransitions(status) {
  return TRANSITIONS[status] || []
}
