import { loadDb, delay } from './db'

export async function listServices() {
  await delay()
  return loadDb().services
}

export async function listEmployees() {
  await delay()
  return loadDb().employees
}
