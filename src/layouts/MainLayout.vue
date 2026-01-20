<script setup>
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { computed, ref, onMounted } from 'vue'

const router = useRouter()
const route = useRoute()

// 获取当前用户信息
const userInfo = ref({})
const isSuperAdmin = computed(() => {
  return userInfo.value.is_super_admin === 1 || userInfo.value.is_super_admin === true
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      userInfo.value = JSON.parse(stored)
    } else {
      // 如果没有存储的用户信息，尝试从 API 获取
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const { getCurrentUser } = await import('../services/adminApi.js')
          const currentUser = await getCurrentUser()
          userInfo.value = currentUser
          localStorage.setItem('userInfo', JSON.stringify(currentUser))
        } catch (err) {
          console.error('获取用户信息失败:', err)
        }
      }
    }
  } catch (err) {
    console.error('加载用户信息失败:', err)
  }
}

// 菜单项（根据权限动态生成）
const menuItems = computed(() => {
  const items = [
    { label: '首页', path: '/app/home' },
    {
      label: '客户',
      children: [
        { label: '客户列表', path: '/app/customers' },
        { label: '发送邮件', path: '/app/customers/send-email' },
      ],
    },
    {
      label: '工具',
      children: [
        { label: '用户获取', path: '/app/tools/user-acquisition' },
        { label: '邮箱管理', path: '/app/tools/email-management' },
      ],
    },
  ]

  // 仅超级管理员显示管理员管理菜单
  if (isSuperAdmin.value) {
    items[2].children.push({ label: '管理员管理', path: '/app/tools/admin-management' })
  }

  return items
})

onMounted(() => {
  loadUserInfo()
})

const activePath = computed(() => route.path)

const logout = () => {
  localStorage.removeItem('authToken')
  router.push('/login')
}

const isActive = (path) => activePath.value.startsWith(path)
</script>

<template>
  <div class="layout">
    <aside class="sidebar card">
      <div class="brand">
        <div class="brand__logo">AMZ</div>
        <div class="brand__name">晨羿科技AMZ管理系统</div>
      </div>
      <nav class="menu">
        <template v-for="item in menuItems" :key="item.path || item.label">
          <RouterLink
            v-if="!item.children"
            :to="item.path"
            class="menu__item"
            :class="{ 'menu__item--active': isActive(item.path) }"
          >
            {{ item.label }}
          </RouterLink>
          <div v-else class="menu__group">
            <div class="menu__group-title">{{ item.label }}</div>
            <RouterLink
              v-for="child in item.children"
              :key="child.path"
              :to="child.path"
              class="menu__item menu__item--child"
              :class="{ 'menu__item--active': isActive(child.path) }"
            >
              {{ child.label }}
            </RouterLink>
          </div>
        </template>
      </nav>
    </aside>

    <div class="content">
      <header class="topbar card">
        <div class="topbar__title">{{ route.meta?.title || '工作台' }}</div>
        <div class="topbar__actions">
          <span class="topbar__user">已登录</span>
          <button class="btn" type="button" @click="logout">退出登录</button>
        </div>
      </header>
      <main class="main card">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 18px;
  padding: 20px;
}

.sidebar {
  padding: 16px;
  position: sticky;
  top: 20px;
  align-self: flex-start;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.brand__logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.brand__name {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.menu__group {
  padding: 6px 0;
}

.menu__group-title {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 6px;
}

.menu__item {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: #1f2937;
  transition: background 0.2s ease, color 0.2s ease;
}

.menu__item:hover {
  background: #eef2ff;
}

.menu__item--child {
  margin-left: 12px;
}

.menu__item--active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: calc(100vh - 40px);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
}

.topbar__title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__user {
  color: #4b5563;
  font-size: 14px;
}

.main {
  flex: 1;
  padding: 20px;
  background: #fff;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
  }
}
</style>
