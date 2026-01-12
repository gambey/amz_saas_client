<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEmails } from '../services/emailApi.js'
import { API_BASE_URL, getAuthHeaders } from '../config/api.js'

// 获取今日日期字符串 (YYYY-MM-DD)
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = ref({
  email: '',
  keyword: '',
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  tag: '',
  brand: '',
})

const loading = ref(false)
const saving = ref(false)
const message = ref('')
const error = ref('')

const rows = ref([])
const emailList = ref([])
const loadingEmails = ref(false)

const hasRows = computed(() => rows.value.length > 0)

// 获取选中邮箱的授权码
const selectedAuthCode = computed(() => {
  const selected = emailList.value.find((item) => item.email === form.value.email)
  return selected?.auth_code || selected?.authCode || ''
})

// 加载邮箱列表
const loadEmailList = async () => {
  loadingEmails.value = true
  try {
    const data = await getEmails()
    emailList.value = data.map((item) => ({
      email: item.email,
      auth_code: item.auth_code || item.authCode || '',
    }))
  } catch (err) {
    console.error('加载邮箱列表失败:', err)
    error.value = '加载邮箱列表失败，请稍后重试'
  } finally {
    loadingEmails.value = false
  }
}

onMounted(() => {
  loadEmailList()
})

const dedupAndSet = (list) => {
  const unique = new Map()
  list.forEach((item, idx) => {
    // item 可能是字符串（邮箱地址）或对象（包含 email、brand、tag 等字段）
    const email = (typeof item === 'string' ? item : item.email || item.email_address || '').trim().toLowerCase()
    if (!email) return
    if (!unique.has(email)) {
      unique.set(email, {
        id: unique.size + 1,
        email,
        // 优先使用返回数据中的 brand 和 tag，如果没有则使用表单中的值
        brand: (typeof item === 'object' ? (item.brand || item.brand_name) : null) || form.value.brand || '',
        tag: (typeof item === 'object' ? (item.tag || item.tag_name) : null) || form.value.tag || '',
      })
    }
  })
  rows.value = Array.from(unique.values())
  console.log('去重后的数据列表:', rows.value)
}

const executeCrawl = async () => {
  message.value = ''
  error.value = ''
  rows.value = []

  if (!form.value.email) {
    error.value = '请选择邮箱地址'
    return
  }
  if (!selectedAuthCode.value) {
    error.value = '所选邮箱没有授权码，请先在邮箱管理中配置'
    return
  }
  if (!form.value.keyword) {
    error.value = '请填写关键词'
    return
  }

  if (!form.value.brand) {
    error.value = '请填写品牌'
    return
  }

  if (!form.value.tag) {
    error.value = '请填写标签'
    return
  }
  if (!form.value.startDate) {
    error.value = '请填写起始日期'
    return
  }
  loading.value = true
  try {
    // 调用服务端抓取接口
    const resp = await fetch(`${API_BASE_URL}/api/email/crawl`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: form.value.email,
        auth_code: selectedAuthCode.value,
        start_date: form.value.startDate,
        end_date: form.value.endDate,
        keyword: form.value.keyword,
      }),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      throw new Error(errorData.message || '抓取失败')
    }
    
    const data = await resp.json().catch(() => ({}))
    // 支持多种响应格式：data.list, data.data, data.data.list, 或直接返回数组
    let list = []
    if(data.data && data.data.emailList && Array.isArray(data.data.emailList)) {
      list = data.data.emailList
    }

    console.log('抓取返回数据:', data)
    console.log('解析后的列表:', list)
    console.log('列表长度:', list.length)

    if (list.length > 0) {
      dedupAndSet(list)
      message.value = `成功抓取 ${list.length} 条数据`
    } else {
      message.value = '未抓取到符合条件的数据'
      rows.value = []
    }
  } catch (err) {
    console.error(err)
    error.value = '抓取失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const removeRow = (email) => {
  rows.value = rows.value.filter((r) => r.email !== email).map((r, idx) => ({ ...r, id: idx + 1 }))
}

const confirmSave = async () => {
  error.value = ''
  message.value = ''

  if (!rows.value.length) {
    error.value = '没有可入库的数据'
    return
  }

  saving.value = true
  try {
    const customersData = rows.value.map((r) => ({
      email: r.email,
      brand: r.brand || '',
      tag: r.tag || '',
      add_date: getTodayDate(),
      remarks: '',
    }))

    console.log('准备入库的数据:', customersData)
    console.log('数据条数:', customersData.length)

    const resp = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customersData),
    })

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}))
      console.error('入库失败响应:', errorData)
      throw new Error(errorData.message || errorData.error || '入库失败')
    }

    const result = await resp.json().catch(() => ({}))
    console.log('入库成功响应:', result)
    
    // 根据接口返回的数据显示成功信息
    const successCount = result.count || result.success_count || customersData.length
    //message.value = `成功入库 ${successCount} 条客户数据`
    message.value = result.message || ''
    // 如果接口返回了失败的数据，显示警告
    if (result.failed && result.failed.length > 0) {
      message.value += `，${result.failed.length} 条失败`
      console.warn('部分数据入库失败:', result.failed)
    }
    
    // 清空列表（可选，根据业务需求决定）
    // rows.value = []
  } catch (err) {
    console.error('入库错误:', err)
    error.value = err.message || '入库失败，请检查接口或重试'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <h2>用户获取</h2>
    <div class="form card">
      <div class="form-grid">
        <div class="form-col">
          <label class="field">
            <span>邮箱地址：</span>
            <select v-model="form.email" :disabled="loadingEmails">
              <option value="">请选择邮箱</option>
              <option v-for="item in emailList" :key="item.email" :value="item.email">
                {{ item.email }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>关键词：</span>
            <input v-model="form.keyword" type="text" placeholder="如：订单、物流、投诉" />
          </label>
          <label class="field">
            <span>标签：</span>
            <input v-model="form.tag" type="text" placeholder="可选，如 NS 3in1" />
          </label>
        </div>
        <div class="form-col">
          <label class="field">
            <span>起始日期：</span>
            <input v-model="form.startDate" type="date" />
          </label>
          <label class="field">
            <span>截止日期：</span>
            <input v-model="form.endDate" type="date" />
          </label>
          <label class="field">
            <span>品牌：</span>
            <input v-model="form.brand" type="text" placeholder="可选，如 velolink" />
          </label>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="button" :disabled="loading" @click="executeCrawl">
            {{ loading ? '抓取中...' : '执行抓取' }}
          </button>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="message" class="message">{{ message }}</p>
    </div>

    <div class="table card">
      <div v-if="hasRows" class="table__actions">
        <button class="btn ghost" type="button" @click="rows = []">清空</button>
        <button class="btn primary" type="button" :disabled="saving || loading" @click="confirmSave">
          {{ saving ? '入库中...' : '确认入库' }}
        </button>
      </div>
      <div class="table__head">
        <div>序号</div>
        <div>客户邮箱</div>
        <div>品牌</div>
        <div>标签</div>
        <div>操作</div>
      </div>
      <div v-if="hasRows">
        <div v-for="item in rows" :key="item.email" class="table__row">
          <div>{{ item.id }}</div>
          <div>{{ item.email }}</div>
          <div>{{ item.brand || '-' }}</div>
          <div>{{ item.tag || '-' }}</div>
          <div class="danger" role="button" tabindex="0" @click="removeRow(item.email)">删除</div>
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: start;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-actions {
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.field {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: 8px;
  color: #111827;
}

.field input,
.field select {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.field select {
  cursor: pointer;
}

.field select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


.btn.ghost {
  background: #fff;
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn.primary {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border-color: #0284c7;
}

.error {
  margin-top: 8px;
  color: #b91c1c;
}

.message {
  margin-top: 8px;
  color: #0f766e;
}

.table {
  overflow: hidden;
}

.table__actions {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 80px 1.6fr 1fr 1fr 120px;
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

.table__empty {
  padding: 16px;
  color: #94a3b8;
  text-align: center;
}

.danger {
  color: #e11d48;
  cursor: pointer;
}

.tip {
  padding: 10px 12px;
  background: #fff3cd;
  color: #7c6f2a;
  border: 1px solid #ffe69c;
}
</style>
