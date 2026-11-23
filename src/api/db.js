// Учебный «backend»: данные в localStorage, все методы асинхронные с задержкой,
// конфликты отклоняются серверной стороной (см. appointments.create).

const STORAGE_KEY = 'servicecrm-db-v1'
const LATENCY = 250

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR') {
    super(message)
    this.code = code
  }
}

export function delay() {
  return new Promise((r) => setTimeout(r, LATENCY))
}

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function seed() {
  const clients = [
    { id: 'cl-1', name: 'Иван Петров', phone: '+7 900 111-22-33', email: 'ivan.petrov@mail.ru', comment: 'Постоянный клиент, скидка 5%', createdAt: '2026-10-02T10:00:00' },
    { id: 'cl-2', name: 'Мария Сидорова', phone: '+7 900 444-55-66', email: 'msidorova@gmail.com', comment: '', createdAt: '2026-10-15T12:30:00' },
    { id: 'cl-3', name: 'Алексей Ким', phone: '+7 900 777-88-99', email: '', comment: 'Просит перезванивать после 18:00', createdAt: '2026-11-01T09:15:00' },
    { id: 'cl-4', name: 'Ольга Романова', phone: '+7 921 333-44-55', email: 'olga.r@yandex.ru', comment: '', createdAt: '2026-11-05T16:40:00' },
    { id: 'cl-5', name: 'Дмитрий Волков', phone: '+7 921 666-77-88', email: 'dvolkov@bk.ru', comment: 'Корпоративный: ООО «Логистик»', createdAt: '2026-11-10T11:00:00' },
  ]

  const vehicles = [
    { id: 'v-1', clientId: 'cl-1', brand: 'Kia', model: 'Rio', plate: 'А123ВС77', year: 2019 },
    { id: 'v-2', clientId: 'cl-1', brand: 'Toyota', model: 'Camry', plate: 'Е456КХ77', year: 2022 },
    { id: 'v-3', clientId: 'cl-2', brand: 'Hyundai', model: 'Solaris', plate: 'М789ОР77', year: 2020 },
    { id: 'v-4', clientId: 'cl-3', brand: 'Lada', model: 'Vesta', plate: 'Т012УК77', year: 2021 },
    { id: 'v-5', clientId: 'cl-4', brand: 'Škoda', model: 'Octavia', plate: 'Р345СТ77', year: 2018 },
    { id: 'v-6', clientId: 'cl-5', brand: 'Volkswagen', model: 'Transporter', plate: 'Н678ВЕ77', year: 2023 },
  ]

  const services = [
    { id: 's-1', name: 'Диагностика подвески', price: 1500, durationMin: 60 },
    { id: 's-2', name: 'Замена масла и фильтров', price: 2800, durationMin: 60 },
    { id: 's-3', name: 'Шиномонтаж (комплект)', price: 2200, durationMin: 45 },
    { id: 's-4', name: 'Регулировка развал-схождения', price: 3500, durationMin: 90 },
    { id: 's-5', name: 'Ремонт тормозной системы', price: 6000, durationMin: 120 },
    { id: 's-6', name: 'Плановое ТО', price: 9000, durationMin: 180 },
  ]

  const employees = [
    { id: 'e-1', name: 'Сергей Антонов', role: 'Мастер-приёмщик' },
    { id: 'e-2', name: 'Павел Гусев', role: 'Автомеханик' },
    { id: 'e-3', name: 'Никита Орлов', role: 'Автомеханик' },
  ]

  const appointments = [
    { id: 'a-1', clientId: 'cl-1', vehicleId: 'v-1', serviceId: 's-2', employeeId: 'e-2', date: todayISO(0), time: '10:00', durationMin: 60, comment: '', status: 'Подтверждена', createdAt: new Date().toISOString() },
    { id: 'a-2', clientId: 'cl-2', vehicleId: 'v-3', serviceId: 's-3', employeeId: 'e-3', date: todayISO(0), time: '11:30', durationMin: 45, comment: 'Зимняя резина в багажнике', status: 'Новая', createdAt: new Date().toISOString() },
    { id: 'a-3', clientId: 'cl-3', vehicleId: 'v-4', serviceId: 's-1', employeeId: 'e-2', date: todayISO(0), time: '13:00', durationMin: 60, comment: 'Стук справа спереди', status: 'Новая', createdAt: new Date().toISOString() },
    { id: 'a-4', clientId: 'cl-4', vehicleId: 'v-5', serviceId: 's-4', employeeId: 'e-3', date: todayISO(1), time: '09:30', durationMin: 90, comment: '', status: 'Подтверждена', createdAt: new Date().toISOString() },
    { id: 'a-5', clientId: 'cl-5', vehicleId: 'v-6', serviceId: 's-6', employeeId: 'e-2', date: todayISO(1), time: '13:00', durationMin: 180, comment: 'ТО-3 по регламенту', status: 'Новая', createdAt: new Date().toISOString() },
    { id: 'a-6', clientId: 'cl-1', vehicleId: 'v-2', serviceId: 's-5', employeeId: 'e-3', date: todayISO(-1), time: '10:00', durationMin: 120, comment: 'Скрип при торможении', status: 'Клиент прибыл', createdAt: new Date().toISOString() },
  ]

  const workOrders = [
    { id: 'wo-1', number: 'ЗН-2026-0041', appointmentId: 'a-6', clientId: 'cl-1', vehicleId: 'v-2', serviceId: 's-5', employeeId: 'e-3', status: 'В работе', totalPrice: 6000, createdAt: new Date().toISOString() },
    { id: 'wo-2', number: 'ЗН-2026-0040', appointmentId: null, clientId: 'cl-2', vehicleId: 'v-3', serviceId: 's-2', employeeId: 'e-2', status: 'Готов', totalPrice: 2800, createdAt: todayISO(-2) + 'T09:00:00' },
    { id: 'wo-3', number: 'ЗН-2026-0039', appointmentId: null, clientId: 'cl-3', vehicleId: 'v-4', serviceId: 's-1', employeeId: 'e-1', status: 'Выдан', totalPrice: 1500, createdAt: todayISO(-4) + 'T14:00:00' },
  ]

  return { clients, vehicles, services, employees, appointments, workOrders, counters: { wo: 42 } }
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.clients)) return parsed
    }
  } catch {
    /* повреждённое состояние — пересоздаём */
  }
  const db = seed()
  saveDb(db)
  return db
}

export function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function nextId(items, prefix) {
  const nums = items
    .map((i) => Number(String(i.id).replace(`${prefix}-`, '')))
    .filter((n) => Number.isFinite(n))
  return `${prefix}-${(nums.length ? Math.max(...nums) : 0) + 1}`
}
