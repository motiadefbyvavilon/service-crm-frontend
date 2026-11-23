<script setup>
// База клиентов: поиск по имени, телефону и email (debounce 300 мс).
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { saveClient, searchClients } from '../api/clients'
import { pushToast } from '../utils/toast'
import DataTable from '../components/DataTable.vue'
import ModalBase from '../components/ModalBase.vue'
import ClientForm from '../components/ClientForm.vue'

const router = useRouter()

const columns = [
  { key: 'name', label: 'Имя' },
  { key: 'phone', label: 'Телефон', width: '180px' },
  { key: 'email', label: 'Email' },
  { key: 'comment', label: 'Комментарий' },
]

const query = ref('')
const clients = ref([])
const loading = ref(true)
const loadError = ref('')

const showForm = ref(false)
const saving = ref(false)

let debounceTimer = null

async function runSearch() {
  loading.value = true
  loadError.value = ''
  try {
    clients.value = await searchClients(query.value)
  } catch {
    loadError.value = 'Не удалось загрузить клиентов. Повторите попытку.'
  } finally {
    loading.value = false
  }
}

onMounted(runSearch)

watch(query, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSearch, 300)
})

function openClient(row) {
  router.push(`/clients/${row.id}`)
}

async function onSubmitClient(payload) {
  if (saving.value) return
  saving.value = true
  try {
    const client = await saveClient(payload)
    pushToast(`Клиент «${client.name}» сохранён`)
    showForm.value = false
    await runSearch()
  } catch (e) {
    pushToast(e.message || 'Ошибка сохранения клиента', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>Клиенты</h1>
        <p class="subtitle">База клиентов сервисного центра</p>
      </div>
      <button class="btn btn-primary" type="button" @click="showForm = true">+ Новый клиент</button>
    </header>

    <div class="search-row">
      <input
        v-model="query"
        type="search"
        class="search-input"
        placeholder="Поиск по имени, телефону или email…"
        aria-label="Поиск клиентов"
      />
    </div>

    <div v-if="loadError" class="card error-card">
      <p>{{ loadError }}</p>
      <button class="btn btn-primary btn-sm" type="button" @click="runSearch">Повторить</button>
    </div>

    <DataTable
      v-else
      :columns="columns"
      :rows="clients"
      :loading="loading"
      :empty-text="query ? 'По запросу никого не найдено' : 'Клиентов пока нет'"
      @row-click="openClient"
    >
      <template #name="{ row }">
        <span class="cell-main">{{ row.name }}</span>
      </template>
      <template #phone="{ row }">
        <span class="mono">{{ row.phone }}</span>
      </template>
      <template #email="{ row }">{{ row.email || '—' }}</template>
      <template #comment="{ row }">
        <span class="cell-sub">{{ row.comment || '—' }}</span>
      </template>
    </DataTable>

    <ModalBase v-if="showForm" title="Новый клиент" @close="showForm = false">
      <ClientForm :busy="saving" @submit="onSubmitClient" @cancel="showForm = false" />
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

.search-row {
  margin-bottom: 14px;
}

.search-input {
  width: 100%;
  max-width: 460px;
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  background: var(--surface);
  padding: 10px 14px;
  font-size: 14.5px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.cell-main {
  font-weight: 600;
}

.cell-sub {
  color: var(--text-faint);
  font-size: 13.5px;
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
