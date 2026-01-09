import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'
import CustomerListView from '../views/CustomerListView.vue'
import SendEmailView from '../views/SendEmailView.vue'
import UserAcquisitionView from '../views/UserAcquisitionView.vue'
import EmailManagementView from '../views/EmailManagementView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/app',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: 'home', name: 'home', component: HomeView, meta: { title: '首页' } },
        { path: 'customers', name: 'customers', component: CustomerListView, meta: { title: '客户列表' } },
        {
          path: 'customers/send-email',
          name: 'sendEmail',
          component: SendEmailView,
          meta: { title: '发送邮件' },
        },
        {
          path: 'tools/user-acquisition',
          name: 'userAcquisition',
          component: UserAcquisitionView,
          meta: { title: '用户获取' },
        },
        {
          path: 'tools/email-management',
          name: 'emailManagement',
          component: EmailManagementView,
          meta: { title: '邮箱管理' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'login' && token) {
    next({ path: '/app/home' })
    return
  }

  next()
})

export default router
