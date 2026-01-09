<script setup>
import { ref, onMounted } from 'vue'
import { getEmails, createEmail, updateEmail, deleteEmail as deleteEmailApi } from '../services/emailApi.js'

const form = ref({
  email: '',
  auth_code: '',
})

const editingId = ref(null)
const rows = ref([])
const loading = ref(false)
const error = ref('')
const message = ref('')

// 加载邮箱列表
const loadEmails = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await getEmails()
    rows.value = data.map((item, idx) => ({
      id:  idx + 1,
      email: item.email,
      auth_code: item.auth_code || '',
    }))
  } catch (err) {
    error.value = err.message || '加载邮箱列表失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 新增或更新邮箱
const saveEmail = async () => {
  error.value = ''
  message.value = ''

  if (!form.value.email) {
    error.value = '请填写邮箱地址'
    return
  }
  if (!form.value.auth_code) {
    error.value = '请填写邮箱授权码'
    return
  }

  loading.value = true
  try {
    if (editingId.value) {
      await updateEmail(editingId.value, form.value)
      message.value = '更新成功'
    } else {
      await createEmail(form.value)
      message.value = '新增成功'
    }
    form.value = { email: '', auth_code: '' }
    editingId.value = null
    await loadEmails()
  } catch (err) {
    error.value = err.message || '保存失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 编辑邮箱
const editEmail = (row) => {
  form.value = {
    email: row.email,
    auth_code: row.auth_code,
  }
  editingId.value = row.id
}

// 取消编辑
const cancelEdit = () => {
  form.value = { email: '', auth_code: '' }
  editingId.value = null
}

// 删除邮箱
const deleteEmail = async (id) => {
  if (!confirm('确定要删除该邮箱吗？')) return

  loading.value = true
  error.value = ''
  try {
    await deleteEmailApi(id)
    message.value = '删除成功'
    await loadEmails()
  } catch (err) {
    error.value = err.message || '删除失败，请稍后重试'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 复制授权码
const copyAuthCode = async (auth_code) => {
  try {
    await navigator.clipboard.writeText(auth_code)
    message.value = '授权码已复制到剪贴板'
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (err) {
    error.value = '复制失败，请手动复制'
  }
}

onMounted(() => {
  loadEmails()
})
</script>

<template>
  <div class="page">
    <h2>邮箱管理</h2>

    <div class="form card">
      <div class="form-row">
        <label class="field">
          <span>邮箱地址：</span>
          <input v-model="form.email" type="email" placeholder="输入邮箱地址" />
        </label>
        <label class="field">
          <span>邮箱授权码：</span>
          <input v-model="form.auth_code" type="password" placeholder="输入邮箱授权码" />
        </label>
        <div class="form-actions">
          <button v-if="editingId" class="btn ghost" type="button" @click="cancelEdit">取消</button>
          <button class="btn primary" type="button" :disabled="loading" @click="saveEmail">
            {{ editingId ? '更新' : '新增' }}
          </button>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="message" class="message">{{ message }}</p>
    </div>

    <div class="table card">
      <div class="table__head">
        <div>序号</div>
        <div>邮箱地址</div>
        <div>授权码</div>
        <div>操作</div>
      </div>
      <div v-if="rows.length">
        <div v-for="item in rows" :key="item.id" class="table__row">
          <div>{{ item.id }}</div>
          <div>{{ item.email }}</div>
          <div>{{ item.auth_code ? '******' : '-' }}</div>
          <div class="table__actions">
            <span class="action-link" @click="editEmail(item)">编辑</span>
            <span class="action-link" @click="copyAuthCode(item.auth_code)">复制授权</span>
            <span class="action-link danger" @click="deleteEmail(item.id)">删除</span>
          </div>
        </div>
      </div>
      <div v-else class="table__empty">暂无数据</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form {
  padding: 12px 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.field {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 8px;
  color: #111827;
}

.field input {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn {
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.ghost {
  background: #fff;
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn.primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  border-color: #2563eb;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.error {
  margin-top: 8px;
  color: #b91c1c;
  font-size: 14px;
}

.message {
  margin-top: 8px;
  color: #0f766e;
  font-size: 14px;
}

.table {
  overflow: hidden;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 80px 1.5fr 1fr 2fr;
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

.action-link.danger {
  color: #e11d48;
}

.action-link.danger:hover {
  color: #be123c;
}
</style>
