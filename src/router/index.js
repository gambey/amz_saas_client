import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'
import CustomerListView from '../views/CustomerListView.vue'
import SendEmailView from '../views/SendEmailView.vue'
import UserAcquisitionView from '../views/UserAcquisitionView.vue'
import EmailManagementView from '../views/EmailManagementView.vue'
import AdminManagementView from '../views/AdminManagementView.vue'

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
        {
          path: 'tools/admin-management',
          name: 'adminManagement',
          component: AdminManagementView,
          meta: { title: '管理员管理' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('authToken')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'login' && token) {
    next({ path: '/app/home' })
    return
  }

  // 检查管理员管理页面的权限（仅超级管理员可访问）
  if (to.name === 'adminManagement' && token) {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const isSuperAdmin = userInfo.is_super_admin === 1 || userInfo.is_super_admin === true
      
      if (!isSuperAdmin) {
        // 如果不是超级管理员，重定向到首页并显示提示
        next({ path: '/app/home' })
        return
      }
    } catch (err) {
      console.error('权限检查失败:', err)
      // 如果无法获取用户信息，也阻止访问
      next({ path: '/app/home' })
      return
    }
  }

  next()
})

export default router
