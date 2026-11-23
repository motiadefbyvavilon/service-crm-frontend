import { createRouter, createWebHistory } from 'vue-router'
import ScheduleView from '../views/ScheduleView.vue'
import ClientsView from '../views/ClientsView.vue'
import ClientDetailsView from '../views/ClientDetailsView.vue'
import WorkOrdersView from '../views/WorkOrdersView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'schedule', component: ScheduleView, meta: { title: 'Расписание' } },
    { path: '/clients', name: 'clients', component: ClientsView, meta: { title: 'Клиенты' } },
    { path: '/clients/:id', name: 'client', component: ClientDetailsView, meta: { title: 'Клиент' } },
    { path: '/work-orders', name: 'workOrders', component: WorkOrdersView, meta: { title: 'Заказ-наряды' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  document.title = `${to.meta.title} — СервисCRM`
})
