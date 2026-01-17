<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../config/api.js'
import { encryptPasswordWithRSA } from '../utils/security.js'

const router = useRouter()
const route = useRoute()

const form = ref({
  account: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

const submit = async () => {
  error.value = ''

  if (!form.value.account || !form.value.password) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  try {
    // 使用RSA公钥加密密码
    const encryptedPassword = await encryptPasswordWithRSA(form.value.password)
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.value.account,
        password: encryptedPassword,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '登录失败' }))
      throw new Error(errorData.message || '登录失败，请检查账号或密码')
    }

    const data = await response.json().catch(() => ({}))
    
    // 支持多种响应格式：data.token, data.access_token, data.data.token
    const token = data.token || data.access_token || data.data?.token
    if (!token) {
      throw new Error('登录失败：服务器未返回认证令牌')
    }

    localStorage.setItem('authToken', token)
    
    // 保存用户信息
    // 根据返回结构：{ username, password, is_super_admin } 或嵌套在 data 中
    const userInfo = data.user || data.data?.user || {
      username: data.username || form.value.account,
      is_super_admin: data.is_super_admin !== undefined ? data.is_super_admin : (data.data?.is_super_admin !== undefined ? data.data.is_super_admin : 0),
    }
    
    // 确保保存的用户信息包含必要字段
    localStorage.setItem('userInfo', JSON.stringify({
      username: userInfo.username || data.username || form.value.account,
      is_super_admin: userInfo.is_super_admin !== undefined ? userInfo.is_super_admin : (data.is_super_admin !== undefined ? data.is_super_admin : 0),
    }))
    
    const redirect = route.query.redirect || '/app/home'
    router.push(redirect)
  } catch (err) {
    console.error(err)
    error.value = err.message || '登录失败，请检查账号或密码'
  } finally {
    loading.value = false
  }
}

const handleEnter = (event) => {
  if (event.key === 'Enter') {
    submit()
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-card__header">
        <div class="logo">AMZ</div>
        <div>
          <h1>深圳晨羿科技AMZ SaaS 管理系统</h1>
          <p>请输入账号密码登录</p>
        </div>
      </div>

      <div class="form">
        <label class="field">
          <span>账号</span>
          <input
            v-model="form.account"
            type="text"
            placeholder="请输入账号"
            @keyup="handleEnter"
            autocomplete="username"
          />
        </label>

        <label class="field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            @keyup="handleEnter"
            autocomplete="current-password"
          />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn" type="button" :disabled="loading" @click="submit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  padding: 24px;
}

.login-card {
  width: min(440px, 100%);
  padding: 28px;
  border-radius: 16px;
}

.login-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.5px;
}

h1 {
  font-size: 20px;
  margin: 0;
  color: #0f172a;
}

p {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #111827;
  font-weight: 600;
}

.field input {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #fff;
}

.error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}
</style>
