import { loadDb, saveDb, delay, nextId, ApiError } from './db'

export async function listClients() {
  await delay()
  return [...loadDb().clients].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export async function searchClients(query) {
  await delay()
  const q = query.trim().toLowerCase()
  const all = loadDb().clients
  if (!q) return all
  const qDigits = q.replace(/\D/g, '')
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && c.phone.replace(/\D/g, '').includes(qDigits)) ||
      (c.email || '').toLowerCase().includes(q),
  )
}

export async function getClient(id) {
  await delay()
  const client = loadDb().clients.find((c) => c.id === id)
  if (!client) throw new ApiError('Клиент не найден', 'NOT_FOUND')
  return client
}

export async function saveClient(payload) {
  await delay()
  if (!payload.name?.trim()) throw new ApiError('Имя клиента обязательно', 'VALIDATION')
  if (!payload.phone?.trim()) throw new ApiError('Телефон клиента обязателен', 'VALIDATION')

  const db = loadDb()
  const phoneDigits = payload.phone.replace(/\D/g, '')
  const dup = db.clients.find(
    (c) => c.id !== payload.id && c.phone.replace(/\D/g, '') === phoneDigits,
  )
  if (dup) throw new ApiError(`Клиент с телефоном ${payload.phone} уже существует: ${dup.name}`, 'CONFLICT')

  if (payload.id) {
    const idx = db.clients.findIndex((c) => c.id === payload.id)
    if (idx === -1) throw new ApiError('Клиент не найден', 'NOT_FOUND')
    db.clients[idx] = { ...db.clients[idx], ...payload, name: payload.name.trim(), phone: payload.phone.trim() }
    saveDb(db)
    return db.clients[idx]
  }

  const client = {
    id: nextId(db.clients, 'cl'),
    email: '',
    comment: '',
    ...payload,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    createdAt: new Date().toISOString(),
  }
  db.clients.push(client)
  saveDb(db)
  return client
}
