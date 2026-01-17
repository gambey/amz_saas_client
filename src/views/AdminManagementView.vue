<script setup>
import { ref, onMounted } from 'vue'
import { getAdmins, createAdmin, changePassword, deleteAdmin } from '../services/adminApi.js'

// 管理员列表
const admins = ref([])
const loading = ref(false)
const error = ref('')
const message = ref('')
const showToast = ref(false)
const toastMessage = ref('')

// 新增管理员表单
const showAddModal = ref(false)
const addForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  is_super_admin: 0, // 0=否，1=是
})

// 修改密码表单
const showPasswordModal = ref(false)
const passwordForm = ref({
  adminId: null,
  adminUsername: '',
  newPassword: '',
  confirmPassword: '',
})

// 格式化日期显示
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (err) {
    return dateStr
  }
}

// 加载管理员列表
const loadAdmins = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await getAdmins()
    // 确保 data 是数组
    if (!Array.isArray(data)) {
      console.warn('getAdmins 返回的数据不是数组:', data)
      admins.value = []
      return
    }
    admins.value = data.map((item, idx) => ({
      id: item.id || idx + 1,
      username: item.username || item.user_name || '',
      is_super_admin: item.is_super_admin || 0,
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      // 根据实际 API 响应格式调整
    }))
  } catch (err) {
    error.value = err.message || '加载管理员列表失败'
    console.error(err)
    admins.value = []
  } finally {
    loading.value = false
  }
}

// 打开新增账号弹窗
const openAddModal = () => {
  addForm.value = {
    username: '',
    password: '',
    confirmPassword: '',
  }
  error.value = ''
  message.value = ''
  showAddModal.value = true
}

// 关闭新增账号弹窗
const closeAddModal = () => {
  showAddModal.value = false
  addForm.value = {
    username: '',
    password: '',
    confirmPassword: '',
    is_super_admin: 0,
  }
  error.value = ''
  message.value = ''
}

// 新增管理员账号
const handleAddAdmin = async () => {
  error.value = ''
  message.value = ''

  if (!addForm.value.username) {
    error.value = '请填写用户名'
    return
  }
  if (!addForm.value.password) {
    error.value = '请填写密码'
    return
  }
  if (addForm.value.password !== addForm.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (addForm.value.password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }

  loading.value = true
  try {
    await createAdmin({
      username: addForm.value.username,
      password: addForm.value.password,
      is_super_admin: addForm.value.is_super_admin,
    })
    message.value = '新增管理员账号成功'
    closeAddModal()
    await loadAdmins()
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (err) {
    error.value = err.message || '新增管理员账号失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 打开修改密码弹窗
const openPasswordModal = (admin = null) => {
  passwordForm.value = {
    adminId: admin ? admin.id : null,
    adminUsername: admin ? admin.username : '当前用户',
    newPassword: '',
    confirmPassword: '',
  }
  error.value = ''
  message.value = ''
  showPasswordModal.value = true
}

// 关闭修改密码弹窗
const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.value = {
    adminId: null,
    adminUsername: '',
    newPassword: '',
    confirmPassword: '',
  }
  error.value = ''
  message.value = ''
}

// 修改密码
const handleChangePassword = async () => {
  error.value = ''
  message.value = ''

  if (!passwordForm.value.newPassword) {
    error.value = '请填写新密码'
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error.value = '两次输入的新密码不一致'
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    error.value = '新密码长度至少为6位'
    return
  }

  loading.value = true
  try {
    await changePassword({
      admin_id: passwordForm.value.adminId,
      username: passwordForm.value.adminUsername,
      new_password: passwordForm.value.newPassword,
    })
    closePasswordModal()
    // 显示 toast 提示
    showToastMessage('密码修改成功')
  } catch (err) {
    error.value = err.message || '修改密码失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 显示 toast 提示
const showToastMessage = (msg) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
    toastMessage.value = ''
  }, 3000)
}

// 删除管理员
const handleDeleteAdmin = async (admin) => {
  if (!confirm(`确定要删除管理员 "${admin.username}" 吗？此操作不可恢复。`)) {
    return
  }

  loading.value = true
  error.value = ''
  try {
    await deleteAdmin({
      admin_id: admin.id,
      username: admin.username,
    })
    showToastMessage('删除管理员成功')
    await loadAdmins()
  } catch (err) {
    error.value = err.message || '删除管理员失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAdmins()
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>管理员管理</h2>
      <button class="btn primary" type="button" @click="openAddModal">新增账号</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="message">{{ message }}</p>

    <!-- 管理员列表 -->
    <div class="table card">
      <div class="table__head">
        <div>序号</div>
        <div>用户名</div>
        <div>创建日期</div>
        <div>更新日期</div>
        <div>操作</div>
      </div>
      <div v-if="admins.length">
        <div v-for="admin in admins" :key="admin.id" class="table__row">
          <div>{{ admin.id }}</div>
          <div>{{ admin.username }}</div>
          <div>{{ formatDate(admin.created_at) }}</div>
          <div>{{ formatDate(admin.updated_at) }}</div>
          <div class="table__actions">
            <span class="action-link" @click="openPasswordModal(admin)">修改密码</span>
            <span class="action-link danger" @click="handleDeleteAdmin(admin)">删除</span>
          </div>
        </div>
      </div>
      <div v-else class="table__empty">
        {{ loading ? '加载中...' : '暂无管理员' }}
      </div>
    </div>

    <!-- 新增账号弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal card">
        <div class="modal__header">
          <div class="modal__title">新增管理员账号</div>
          <button class="btn-close" type="button" @click="closeAddModal">×</button>
        </div>
        <div class="modal__body">
          <label class="field">
            <span>用户名：</span>
            <input
              v-model="addForm.username"
              type="text"
              placeholder="请输入用户名"
              required
            />
          </label>
          <label class="field">
            <span>密码：</span>
            <input
              v-model="addForm.password"
              type="password"
              placeholder="请输入密码（至少6位）"
              required
            />
          </label>
          <label class="field">
            <span>确认密码：</span>
            <input
              v-model="addForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              required
            />
          </label>
          <label class="field checkbox-field">
            <span>是否超级管理员：</span>
            <div class="checkbox-wrapper">
              <input
                v-model="addForm.is_super_admin"
                type="checkbox"
                :true-value="1"
                :false-value="0"
                id="is_super_admin"
              />
              <label for="is_super_admin" class="checkbox-label">设为超级管理员</label>
            </div>
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal__footer">
            <button class="btn ghost" type="button" @click="closeAddModal" :disabled="loading">取消</button>
            <button class="btn primary" type="button" @click="handleAddAdmin" :disabled="loading">
              {{ loading ? '提交中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="closePasswordModal">
      <div class="modal card">
        <div class="modal__header">
          <div class="modal__title">修改密码</div>
          <button class="btn-close" type="button" @click="closePasswordModal">×</button>
        </div>
        <div class="modal__body">
          <div class="info-text">管理员：{{ passwordForm.adminUsername }}</div>
          <label class="field">
            <span>新密码：</span>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              required
            />
          </label>
          <label class="field">
            <span>确认新密码：</span>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              required
            />
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <div class="modal__footer">
            <button class="btn ghost" type="button" @click="closePasswordModal" :disabled="loading">取消</button>
            <button class="btn primary" type="button" @click="handleChangePassword" :disabled="loading">
              {{ loading ? '提交中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="showToast" class="toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  border-color: #2563eb;
}

.btn.ghost {
  background: #fff;
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.error {
  color: #b91c1c;
  background: #fef2f2;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 14px;
}

.message {
  color: #0f766e;
  background: #f0fdfa;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #5eead4;
  font-size: 14px;
}

.table {
  overflow: hidden;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 80px 1fr 180px 180px 200px;
  align-items: center;
  padding: 10px 12px;
}

.table__head {
  background: #00a4e4;
  color: #fff;
  font-weight: 700;
}

.table__row:nth-child(odd) {
  background: #f8fafc;
}

.table__row:hover {
  background: #f1f5f9;
}

.table__empty {
  padding: 16px;
  color: #94a3b8;
  text-align: center;
}

.table__actions {
  display: flex;
  gap: 12px;
}

.action-link {
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s ease;
}

.action-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.modal {
  width: min(500px, 90vw);
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal__title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: grid;
  place-items: center;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-text {
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  color: #4b5563;
  font-size: 14px;
}

.field {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 12px;
  color: #111827;
}

.field span {
  font-weight: 500;
}

.field input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.field input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.checkbox-field {
  align-items: flex-start;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin: 0;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  user-select: none;
  font-weight: normal;
}

.modal__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Toast 提示样式 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  font-size: 14px;
  font-weight: 500;
  min-width: 200px;
  text-align: center;
}

/* Toast 动画 */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
