<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEmails } from '../services/emailApi.js'
import { API_BASE_URL, getAuthHeaders } from '../config/api.js'

const filters = ref({
  email: '',
  brand: '',
  tag: '',
})

const customers = ref([])
const filteredCustomers = ref([])
const selectedCustomers = ref(new Set())
const loading = ref(false)
const error = ref('')
const showEmailModal = ref(false)
const emailForm = ref({
  senderEmail: '',
  subject: '',
  content: '',
})

const showEditModal = ref(false)
const editForm = ref({
  id: null,
  email: '',
  brand: '',
  tag: '',
  add_date: '',
  remarks: '',
})

const showAddModal = ref(false)
const addForm = ref({
  email: '',
  brand: '',
  tag: '',
  remarks: '',
})

const emailList = ref([])
const emailListWithAuth = ref([]) // 包含授权码的邮箱列表

// 获取今日日期字符串 (YYYY-MM-DD)
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 加载邮箱列表（用于发送邮件时选择发件邮箱）
const loadEmailList = async () => {
  try {
    const data = await getEmails()
    emailList.value = data.map((item) => item.email)
    emailListWithAuth.value = data.map((item) => ({
      email: item.email,
      auth_code: item.auth_code || item.authCode || '',
    }))
    if (emailList.value.length > 0) {
      emailForm.value.senderEmail = emailList.value[0]
    }
  } catch (err) {
    console.error('加载邮箱列表失败:', err)
  }
}

// 获取选中发件邮箱的授权码
const getSenderAuthCode = computed(() => {
  const selected = emailListWithAuth.value.find((item) => item.email === emailForm.value.senderEmail)
  return selected?.auth_code || ''
})

// 加载客户列表
const loadCustomers = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.message || '获取客户列表失败')
    }

    const data = await resp.json()
    // 支持多种响应格式，确保 list 始终是数组
    let list = []
    if (Array.isArray(data)) {
      list = data
    } else if (data && Array.isArray(data.list)) {
      list = data.list
    } else if (data && data.data) {
      if (Array.isArray(data.data)) {
        list = data.data
      } else if (data.data.list && Array.isArray(data.data.list)) {
        list = data.data.list
      }
    }

    console.log('客户列表原始数据:', data)
    console.log('解析后的列表:', list)

    if (!Array.isArray(list)) {
      console.warn('解析后的数据不是数组:', list)
      list = []
    }

    customers.value = list.map((item, idx) => ({
      id:  idx + 1,
      email: item.email || '',
      brand: item.brand || '',
      tag: item.tag || '',
      add_date: item.add_date || item.addDate || '',
      remarks: item.remarks || item.remark || '',
    }))
    applyFilters()
  } catch (err) {
    console.error('加载客户列表失败:', err)
    error.value = err.message || '加载客户列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 应用筛选条件（模糊查询）
const applyFilters = () => {
  filteredCustomers.value = customers.value.filter((item) => {
    const emailMatch = !filters.value.email || 
      item.email.toLowerCase().includes(filters.value.email.toLowerCase())
    const brandMatch = !filters.value.brand || 
      item.brand.toLowerCase().includes(filters.value.brand.toLowerCase())
    const tagMatch = !filters.value.tag || 
      item.tag.toLowerCase().includes(filters.value.tag.toLowerCase())
    return emailMatch && brandMatch && tagMatch
  })
}

// 查询
const handleSearch = () => {
  applyFilters()
  selectedCustomers.value.clear()
}

// 清空筛选
const handleClear = () => {
  filters.value = { email: '', brand: '', tag: '' }
  applyFilters()
  selectedCustomers.value.clear()
}

// 全选/取消全选
const allSelected = computed(() => {
  return filteredCustomers.value.length > 0 && 
    filteredCustomers.value.every((item) => selectedCustomers.value.has(item.id))
})

const toggleSelectAll = () => {
  if (allSelected.value) {
    filteredCustomers.value.forEach((item) => selectedCustomers.value.delete(item.id))
  } else {
    filteredCustomers.value.forEach((item) => selectedCustomers.value.add(item.id))
  }
}

// 切换单个选择
const toggleSelect = (id) => {
  if (selectedCustomers.value.has(id)) {
    selectedCustomers.value.delete(id)
  } else {
    selectedCustomers.value.add(id)
  }
}

// 获取选中客户信息
const selectedCustomersInfo = computed(() => {
  return filteredCustomers.value.filter((item) => selectedCustomers.value.has(item.id))
})

// 获取选中客户的品牌和标签（用于显示在弹窗中）
const selectedBrand = computed(() => {
  const brands = [...new Set(selectedCustomersInfo.value.map((item) => item.brand).filter(Boolean))]
  return brands.length > 0 ? brands.join(', ') : '-'
})

const selectedTag = computed(() => {
  const tags = [...new Set(selectedCustomersInfo.value.map((item) => item.tag).filter(Boolean))]
  return tags.length > 0 ? tags.join(', ') : '-'
})

// 打开新增客户弹窗
const openAddModal = () => {
  addForm.value = {
    email: '',
    brand: '',
    tag: '',
    remarks: '',
  }
  showAddModal.value = true
  error.value = ''
}

// 关闭新增客户弹窗
const closeAddModal = () => {
  showAddModal.value = false
  addForm.value = {
    email: '',
    brand: '',
    tag: '',
    remarks: '',
  }
}

// 创建新客户
const createCustomer = async () => {
  if (!addForm.value.email) {
    error.value = '请填写客户邮箱'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const resp = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify([{
        email: addForm.value.email,
        brand: addForm.value.brand || '',
        tag: addForm.value.tag || '',
        add_date: getTodayDate(),
        remarks: addForm.value.remarks || '',
      }]),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.message || '创建失败')
    }

    await loadCustomers()
    closeAddModal()
    error.value = ''
  } catch (err) {
    console.error('创建客户失败:', err)
    error.value = err.message || '创建失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 新增客户（打开弹窗）
const addNewCustomer = () => {
  openAddModal()
}

// 打开发送邮件弹窗
const openEmailModal = () => {
  if (selectedCustomers.value.size === 0) {
    error.value = '请先选择要发送邮件的客户'
    return
  }
  showEmailModal.value = true
  loadEmailList()
}

// 关闭发送邮件弹窗
const closeEmailModal = () => {
  showEmailModal.value = false
  emailForm.value = { senderEmail: '', subject: '', content: '' }
}

// 发送邮件（根据选中客户数量选择单个或批量发送）
const sendEmail = async () => {
  if (!emailForm.value.senderEmail || !emailForm.value.subject || !emailForm.value.content) {
    error.value = '请填写完整的邮件信息'
    return
  }

  const authCode = getSenderAuthCode.value
  if (!authCode) {
    error.value = '所选发件邮箱没有授权码，请先在邮箱管理中配置'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('authToken')
    const recipientEmails = selectedCustomersInfo.value.map((item) => item.email)
    
    // 根据接口文档，发送使用 send
    const apiUrl = `${API_BASE_URL}/api/email/send`
    
    // 根据接口文档构建请求体，email_list 始终是数组格式
    const requestBody = {
      sender_email: emailForm.value.senderEmail,
      auth_code: authCode,
      email_list: recipientEmails, // 始终是数组，即使是单个也要是数组
      subject: emailForm.value.subject,
      content: emailForm.value.content,
    }

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || '发送邮件失败')
    }

    const result = await resp.json().catch(() => ({}))
    console.log('发送邮件成功响应:', result)

    error.value = ''
    const successMessage = `成功发送邮件给 ${recipientEmails.length} 个客户`
  
    alert(successMessage)
    closeEmailModal()
  } catch (err) {
    console.error('发送邮件失败:', err)
    error.value = err.message || '发送邮件失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 删除客户
const deleteCustomer = async (id) => {
  if (!confirm('确定要删除该客户吗？')) return

  loading.value = true
  try {
    const resp = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.message || '删除失败')
    }

    await loadCustomers()
    selectedCustomers.value.delete(id)
  } catch (err) {
    console.error('删除客户失败:', err)
    error.value = err.message || '删除失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 格式化日期为 YYYY-MM-DD 格式（input type="date" 需要的格式）
const formatDateForInput = (dateStr) => {
  if (!dateStr) return ''
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  // 如果是其他格式，尝试解析
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (err) {
    console.warn('日期格式转换失败:', dateStr, err)
    return ''
  }
}

// 打开编辑弹窗
const openEditModal = (customer) => {
  editForm.value = {
    id: customer.id,
    email: customer.email || '',
    brand: customer.brand || '',
    tag: customer.tag || '',
    add_date: formatDateForInput(customer.add_date),
    remarks: customer.remarks || '',
  }
  showEditModal.value = true
  error.value = ''
  console.log('打开编辑弹窗，客户数据:', customer)
  console.log('格式化后的日期:', editForm.value.add_date)
}

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = {
    id: null,
    email: '',
    brand: '',
    tag: '',
    add_date: '',
    remarks: '',
  }
}

// 更新客户
const updateCustomer = async () => {
  if (!editForm.value.email) {
    error.value = '请填写客户邮箱'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const resp = await fetch(`${API_BASE_URL}/api/customers/${editForm.value.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: editForm.value.email,
        brand: editForm.value.brand || '',
        tag: editForm.value.tag || '',
        add_date: editForm.value.add_date || '',
        remarks: editForm.value.remarks || '',
      }),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.message || '更新失败')
    }

    await loadCustomers()
    closeEditModal()
    error.value = ''
  } catch (err) {
    console.error('更新客户失败:', err)
    error.value = err.message || '更新失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 单个客户发送邮件
const sendEmailToCustomer = (customer) => {
  selectedCustomers.value.clear()
  selectedCustomers.value.add(customer.id)
  openEmailModal()
}

onMounted(() => {
  loadCustomers()
})
</script>

<template>
  <div class="page">
    <h2>客户列表</h2>

    <!-- 搜索筛选栏 -->
    <div class="search-bar card">
      <div class="search-fields">
        <label class="search-field">
          <span>邮箱：</span>
          <input v-model="filters.email" type="text" placeholder="输入邮箱" @keyup.enter="handleSearch" />
        </label>
        <label class="search-field">
          <span>品牌：</span>
          <input v-model="filters.brand" type="text" placeholder="输入品牌" @keyup.enter="handleSearch" />
        </label>
        <label class="search-field">
          <span>标签：</span>
          <input v-model="filters.tag" type="text" placeholder="输入标签" @keyup.enter="handleSearch" />
        </label>
      </div>
      <div class="search-actions">
        <button class="btn primary" type="button" @click="handleSearch">查询</button>
        <button class="btn ghost" type="button" @click="handleClear">清空</button>
      </div>
    </div>

    <!-- 操作按钮栏 -->
    <div class="action-bar">
      <button class="btn ghost" type="button" @click="addNewCustomer">新增客户</button>
      <button class="btn primary" type="button" @click="openEmailModal">发送邮件</button>
    </div>


    <p v-if="error" class="error">{{ error }}</p>

    <!-- 数据表格 -->
    <div class="table card">
      <div class="table__head">
        <div class="checkbox-cell">
          <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
        </div>
        <div>序号</div>
        <div>客户邮箱</div>
        <div>品牌</div>
        <div>标签</div>
        <div>添加日期</div>
        <div>备注</div>
        <div>操作</div>
      </div>
      <div v-if="loading" class="table__loading">加载中...</div>
      <div v-else-if="filteredCustomers.length === 0" class="table__empty">暂无数据</div>
      <div v-else>
        <div v-for="item in filteredCustomers" :key="item.id" class="table__row">
          <div class="checkbox-cell">
            <input type="checkbox" :checked="selectedCustomers.has(item.id)" @change="toggleSelect(item.id)" />
          </div>
          <div>{{ item.id }}</div>
          <div>{{ item.email }}</div>
          <div>{{ item.brand || '-' }}</div>
          <div>{{ item.tag || '-' }}</div>
          <div>{{ item.add_date || '-' }}</div>
          <div>{{ item.remarks || '-' }}</div>
          <div class="table__actions">
            <span class="action-link" @click="deleteCustomer(item.id)">删除</span>
            <span class="action-link" @click="openEditModal(item)">编辑</span>
            <span class="action-link" @click="sendEmailToCustomer(item)">发送邮件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 发送邮件弹窗 -->
    <div v-if="showEmailModal" class="modal-overlay" @click.self="closeEmailModal">
      <div class="modal card">
        <div class="modal__header">
          <div class="modal__info">
            <span>当前选中: {{ selectedCustomers.size }} 个客户</span>
            <span>品牌: {{ selectedBrand }}</span>
            <span>标签: {{ selectedTag }}</span>
          </div>
          <div class="modal__actions">
            <button class="btn primary" type="button" @click="sendEmail" :disabled="loading">
              {{ loading ? '发送中...' : '发送邮件' }}
            </button>
            <button class="btn-close" type="button" @click="closeEmailModal">×</button>
          </div>
        </div>
        <div class="modal__body">
          <label class="field">
            <span>发件邮箱：</span>
            <select v-model="emailForm.senderEmail">
              <option v-for="email in emailList" :key="email" :value="email">{{ email }}</option>
            </select>
          </label>
          <label class="field">
            <span>邮件标题：</span>
            <input v-model="emailForm.subject" type="text" placeholder="输入邮件标题" />
          </label>
          <label class="field">
            <span>邮件内容：</span>
            <textarea v-model="emailForm.content" rows="6" placeholder="输入邮件内容"></textarea>
          </label>
        </div>
      </div>
    </div>

    <!-- 编辑客户弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal card">
        <div class="modal__header">
          <div class="modal__title">编辑客户</div>
          <button class="btn-close" type="button" @click="closeEditModal">×</button>
        </div>
        <div class="modal__body">
          <label class="field">
            <span>客户邮箱：</span>
            <input v-model="editForm.email" type="email" placeholder="输入客户邮箱" required />
          </label>
          <label class="field">
            <span>品牌：</span>
            <input v-model="editForm.brand" type="text" placeholder="输入品牌" />
          </label>
          <label class="field">
            <span>标签：</span>
            <input v-model="editForm.tag" type="text" placeholder="输入标签" />
          </label>
          <label class="field">
            <span>添加日期：</span>
            <input v-model="editForm.add_date" type="date" />
          </label>
          <label class="field">
            <span>备注：</span>
            <textarea v-model="editForm.remarks" rows="3" placeholder="输入备注"></textarea>
          </label>
          <div class="modal__footer">
            <button class="btn ghost" type="button" @click="closeEditModal" :disabled="loading">取消</button>
            <button class="btn primary" type="button" @click="updateCustomer" :disabled="loading">
              {{ loading ? '更新中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增客户弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal card">
        <div class="modal__header">
          <div class="modal__title">新增客户</div>
          <button class="btn-close" type="button" @click="closeAddModal">×</button>
        </div>
        <div class="modal__body">
          <label class="field">
            <span>客户邮箱：</span>
            <input v-model="addForm.email" type="email" placeholder="输入客户邮箱" required />
          </label>
          <label class="field">
            <span>品牌：</span>
            <input v-model="addForm.brand" type="text" placeholder="输入品牌" />
          </label>
          <label class="field">
            <span>标签：</span>
            <input v-model="addForm.tag" type="text" placeholder="输入标签" />
          </label>
          <label class="field">
            <span>备注：</span>
            <textarea v-model="addForm.remarks" rows="3" placeholder="输入备注"></textarea>
          </label>
          <div class="modal__footer">
            <button class="btn ghost" type="button" @click="closeAddModal" :disabled="loading">取消</button>
            <button class="btn primary" type="button" @click="createCustomer" :disabled="loading">
              {{ loading ? '创建中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-bar {
  padding: 12px 16px;
}

.search-fields {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.search-field span {
  white-space: nowrap;
  color: #111827;
  font-weight: 600;
}

.search-field input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.search-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #b91c1c;
  background: #fef2f2;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.table {
  overflow: hidden;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 50px 60px 1.8fr 1fr 1fr 120px 1fr 180px;
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

.checkbox-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.checkbox-cell input[type="checkbox"] {
  cursor: pointer;
}

.table__loading,
.table__empty {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
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

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
  color: #111827;
}

.modal__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #6b7280;
}

.modal__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
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

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #111827;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-family: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 120px;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
