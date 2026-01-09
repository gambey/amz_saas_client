/**
 * 邮箱管理 API 服务
 * 根据 http://localhost:3000/api-docs/#/ 中的实际接口定义进行调整
 */

const API_BASE = 'http://localhost:3000'
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

/**
 * 获取邮箱列表
 * @returns {Promise<Array>} 邮箱列表
 */
export const getEmails = async () => {
  try {
    const resp = await fetch(`${API_BASE}/api/emails`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '获取失败' }))
      throw new Error(error.message || '获取邮箱列表失败')
    }
    const data = await resp.json()
    // 根据实际 API 响应格式调整
    // 可能的情况: data.list, data.data, data, 或直接返回数组
    return data.list || data.data || data || []
  } catch (err) {
    console.error('getEmails error:', err)
    throw err
  } 
}

/**
 * 新增邮箱
 * @param {Object} emailData - { email, authCode }
 * @returns {Promise<Object>} 创建的邮箱对象
 */
export const createEmail = async (emailData) => {
  try {
    const resp = await fetch(`${API_BASE}/api/emails`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        // 根据实际 API 字段名调整（可能是 email, authCode 或 email, auth_code）
        email: emailData.email,
        auth_code: emailData.auth_code,
        // 如果 API 使用下划线命名，取消下面的注释
        // auth_code: emailData.authCode,
      }),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '创建失败' }))
      throw new Error(error.message || '创建邮箱失败')
    }
    return await resp.json()
  } catch (err) {
    console.error('createEmail error:', err)
    throw err
  }
}

/**
 * 更新邮箱
 * @param {number|string} id - 邮箱 ID
 * @param {Object} emailData - { email, auth_code }
 * @returns {Promise<Object>} 更新后的邮箱对象
 */
export const updateEmail = async (id, emailData) => {
  try {
    const resp = await fetch(`${API_BASE}/api/emails/${id}`, {
      method: 'PUT', // 或 PATCH，根据 API 文档调整
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: emailData.email,
        auth_code: emailData.auth_code,
        // 如果 API 使用下划线命名，取消下面的注释
        // auth_code: emailData.auth_code,
      }),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '更新失败' }))
      throw new Error(error.message || '更新邮箱失败')
    }
    return await resp.json()
  } catch (err) {
    console.error('updateEmail error:', err)
    throw err
  }
}

/**
 * 删除邮箱
 * @param {number|string} id - 邮箱 ID
 * @returns {Promise<void>}
 */
export const deleteEmail = async (id) => {
  try {
    const resp = await fetch(`${API_BASE}/api/emails/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '删除失败' }))
      throw new Error(error.message || '删除邮箱失败')
    }
    // DELETE 请求可能不返回内容
    if (resp.status !== 204) {
      await resp.json()
    }
  } catch (err) {
    console.error('deleteEmail error:', err)
    throw err
  }
}
