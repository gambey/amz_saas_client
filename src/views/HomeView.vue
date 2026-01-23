<script setup>
import { ref, onMounted } from 'vue'
import { API_BASE_URL, getAuthHeaders } from '../config/api.js'

const quickStats = ref([
  { label: '客户总数', value: '加载中...' },
  { label: '今日新增', value: '加载中...' },
  { label: '邮件发送（数据占位）', value: '0' },
  { label: '活跃用户（数据占位）', value: '73%' },
])

// 格式化数字，添加千位分隔符
const formatNumber = (num) => {
  if (typeof num !== 'number') return '0'
  return num.toLocaleString('zh-CN')
}

// 获取今日日期字符串 (YYYY-MM-DD)
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取客户总数
const loadCustomerTotal = async () => {
  try {
    // 请求第一页，pageSize=1，只为了获取总数
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('pageSize', '1')
    
    const resp = await fetch(`${API_BASE_URL}/api/customers?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!resp.ok) {
      console.error('获取客户总数失败')
      return
    }

    const response = await resp.json()
    
    // 从响应中提取总数
    let total = 0
    if (response && response.data && response.data.pagination) {
      total = response.data.pagination.total || 0
    } else if (response && response.data && Array.isArray(response.data.list)) {
      // 如果没有分页信息，尝试从列表长度获取（不准确，但作为备用）
      total = response.data.list.length
    }
    
    // 更新客户总数
    quickStats.value[0].value = formatNumber(total)
  } catch (err) {
    console.error('加载客户总数失败:', err)
    quickStats.value[0].value = '获取失败'
  }
}

// 获取今日新增客户数量
const loadTodayNewCustomers = async () => {
  try {
    const today = getTodayDate()
    
    // 尝试通过 API 参数筛选今日新增的客户
    // 如果后端不支持，则获取所有数据后在前端筛选
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('pageSize', '1000') // 设置较大的 pageSize 以获取更多数据
    
    // 尝试添加日期筛选参数（如果后端支持）
    // params.append('add_date', today)
    
    const resp = await fetch(`${API_BASE_URL}/api/customers?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!resp.ok) {
      console.error('获取今日新增客户失败')
      return
    }

    const response = await resp.json()
    
    // 解析响应数据
    let list = []
    if (response && response.data) {
      if (Array.isArray(response.data.list)) {
        list = response.data.list
      } else if (Array.isArray(response.data)) {
        list = response.data
      }
    } else if (Array.isArray(response)) {
      list = response
    } else if (response && Array.isArray(response.list)) {
      list = response.list
    }
    
    // 在前端筛选今日新增的客户
    // 比较 add_date 字段（可能是 YYYY-MM-DD 格式或 ISO 日期字符串）
    const todayNewCount = list.filter((item) => {
      const addDate = item.add_date || item.addDate || ''
      if (!addDate) return false
      
      // 处理不同的日期格式
      // 如果是 ISO 格式 (2026-01-20T00:00:00.000Z)，提取日期部分
      const dateStr = addDate.includes('T') ? addDate.split('T')[0] : addDate
      return dateStr === today
    }).length
    
    // 更新今日新增数量
    quickStats.value[1].value = formatNumber(todayNewCount)
  } catch (err) {
    console.error('加载今日新增客户失败:', err)
    quickStats.value[1].value = '获取失败'
  }
}

onMounted(() => {
  loadCustomerTotal()
  loadTodayNewCustomers()
})
</script>

<template>
  <div class="page">
    <h2>首页</h2> 
    <p class="sub">欢迎登陆晨羿科技AMZ管理系统</p>
    <p class="sub">这里是系统概览，可以快速查看关键数据。</p>
    <div class="stats">
      <div v-for="stat in quickStats" :key="stat.label" class="stat card">
        <div class="stat__label">{{ stat.label }}</div>
        <div class="stat__value">{{ stat.value }}</div>
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

.sub {
  color: #6b7280;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.stat {
  padding: 16px;
}

.stat__label {
  color: #6b7280;
  font-size: 13px;
}

.stat__value {
  font-size: 26px;
  font-weight: 800;
  margin-top: 6px;
  color: #1d4ed8;
}
</style>
