<script setup>
import { RouterView, RouterLink } from 'vue-router'
import ToastStack from './components/ToastStack.vue'
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <RouterLink to="/" class="brand">
        Сервис<em>CRM</em>
      </RouterLink>
      <nav class="nav">
        <RouterLink to="/" class="nav-item" exact-active-class="active">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <rect x="1.5" y="2.5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.5" />
            <path d="M1.5 6.5h14M5.5 1v3M11.5 1v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Расписание
        </RouterLink>
        <RouterLink to="/clients" class="nav-item" active-class="active">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="5.5" r="3" stroke="currentColor" stroke-width="1.5" />
            <path d="M2.5 15c.8-2.8 3.2-4.5 6-4.5s5.2 1.7 6 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Клиенты
        </RouterLink>
        <RouterLink to="/work-orders" class="nav-item" active-class="active">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <path d="M4 1.5h9a1 1 0 0 1 1 1v13l-2.5-1.5L9 15.5 6.5 14 4 15.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M6 5.5h5M6 8.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Заказ-наряды
        </RouterLink>
      </nav>
      <p class="sidebar-foot">Учебный проект · Vue 3</p>
    </aside>

    <main class="main">
      <RouterView />
    </main>

    <ToastStack />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100dvh;
}

.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: var(--p-side-900);
  color: oklch(92% 0.01 255);
  display: flex;
  flex-direction: column;
  padding: 22px 14px;
  position: sticky;
  top: 0;
  height: 100dvh;
}

.brand {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #fff;
  text-decoration: none;
  padding: 0 10px 20px;
}

.brand em {
  font-style: normal;
  color: var(--accent);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-m);
  color: oklch(78% 0.015 255);
  text-decoration: none;
  font-weight: 600;
  font-size: 14.5px;
  transition: background-color 0.15s ease-out, color 0.15s ease-out;
}

.nav-item:hover {
  background: oklch(100% 0 0 / 0.07);
  color: #fff;
}

.nav-item.active {
  background: var(--accent);
  color: #fff;
}

.sidebar-foot {
  margin-top: auto;
  padding: 0 12px;
  font-size: 12px;
  color: oklch(60% 0.02 255);
}

.main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 48px;
}

@media (max-width: 760px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
  }

  .brand {
    padding: 0 8px 0 0;
    font-size: 17px;
  }

  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .sidebar-foot {
    display: none;
  }

  .main {
    padding: 18px 16px 40px;
  }
}
</style>
