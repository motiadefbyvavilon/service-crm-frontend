import { loadDb, saveDb, delay, nextId, ApiError } from './db'

export async function listVehiclesByClient(clientId) {
  await delay()
  return loadDb().vehicles.filter((v) => v.clientId === clientId)
}

export async function listVehicles() {
  await delay()
  return loadDb().vehicles
}

export async function saveVehicle(payload) {
  await delay()
  if (!payload.brand?.trim()) throw new ApiError('Укажите марку автомобиля', 'VALIDATION')
  if (!payload.model?.trim()) throw new ApiError('Укажите модель автомобиля', 'VALIDATION')
  if (!payload.plate?.trim()) throw new ApiError('Укажите государственный номер', 'VALIDATION')

  const db = loadDb()
  const plate = payload.plate.trim().toUpperCase()
  const dup = db.vehicles.find((v) => v.id !== payload.id && v.plate.toUpperCase() === plate)
  if (dup) throw new ApiError(`Автомобиль с номером ${plate} уже зарегистрирован`, 'CONFLICT')

  if (payload.id) {
    const idx = db.vehicles.findIndex((v) => v.id === payload.id)
    if (idx === -1) throw new ApiError('Автомобиль не найден', 'NOT_FOUND')
    db.vehicles[idx] = { ...db.vehicles[idx], ...payload, brand: payload.brand.trim(), model: payload.model.trim(), plate }
    saveDb(db)
    return db.vehicles[idx]
  }

  const vehicle = {
    id: nextId(db.vehicles, 'v'),
    year: null,
    ...payload,
    brand: payload.brand.trim(),
    model: payload.model.trim(),
    plate,
  }
  db.vehicles.push(vehicle)
  saveDb(db)
  return vehicle
}

export async function deleteVehicle(id) {
  await delay()
  const db = loadDb()
  const hasAppt = db.appointments.some((a) => a.vehicleId === id && a.status !== 'Отменена')
  if (hasAppt) throw new ApiError('Нельзя удалить автомобиль: по нему есть активные записи', 'CONFLICT')
  db.vehicles = db.vehicles.filter((v) => v.id !== id)
  saveDb(db)
}
