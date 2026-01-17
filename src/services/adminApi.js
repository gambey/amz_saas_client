/**
 * 管理员 API 服务
 * 根据 http://localhost:3000/api-docs/ 中的实际接口定义进行调整
 */

import { API_BASE_URL, getAuthHeaders } from '../config/api.js'

/**
 * 获取RSA公钥
 * @returns {Promise<string>} RSA公钥（PEM格式）
 */
export const getRSAPublicKey = async () => {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/public-key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '获取失败' }))
      throw new Error(error.message || '获取RSA公钥失败')
    }
    const response = await resp.json()
    // 根据实际 API 响应格式：{ success, message, data: { publicKey, algorithm, keySize, hash } }
    return response.data?.publicKey || response.data?.public_key || response.publicKey || response.public_key || response.key || response
  } catch (err) {
    console.error('getRSAPublicKey error:', err)
    throw err
  }
}

/**
 * 获取当前登录用户信息
 * @returns {Promise<Object>} 当前用户信息
 */
export const getCurrentUser = async () => {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '获取失败' }))
      throw new Error(error.message || '获取用户信息失败')
    }
    const response = await resp.json()
    // 根据实际 API 响应格式调整
    return response.data || response.user || response
  } catch (err) {
    console.error('getCurrentUser error:', err)
    throw err
  }
}

/**
 * 新增管理员账号
 * @param {Object} adminData - { username, password, is_super_admin }
 * @returns {Promise<Object>} 创建的管理员对象
 */
export const createAdmin = async (adminData) => {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username: adminData.username,
        password: adminData.password,
        is_super_admin: adminData.is_super_admin || 0, // 0=否，1=是
      }),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '创建失败' }))
      throw new Error(error.message || '创建管理员账号失败')
    }
    return await resp.json()
  } catch (err) {
    console.error('createAdmin error:', err)
    throw err
  }
}

/**
 * 修改管理员密码
 * @param {Object} passwordData - { admin_id, username, new_password }
 * @returns {Promise<Object>} 更新结果
 */
export const changePassword = async (passwordData) => {
  try {
    const url = `${API_BASE_URL}/api/auth/password`
    
    const resp = await fetch(url, {
      method: 'PUT', // 或 PATCH，根据 API 文档调整
      headers: getAuthHeaders(),
      body: JSON.stringify({
        admin_id: passwordData.admin_id,
        username: passwordData.username,
        new_password: passwordData.new_password,
      }),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '修改失败' }))
      throw new Error(error.message || '修改密码失败')
    }
    // PUT 请求可能返回 204 No Content
    if (resp.status === 204) {
      return { success: true }
    }
    return await resp.json()
  } catch (err) {
    console.error('changePassword error:', err)
    throw err
  }
}

/**
 * 获取管理员列表
 * @returns {Promise<Array>} 管理员列表
 */
export const getAdmins = async () => {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/admins`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '获取失败' }))
      throw new Error(error.message || '获取管理员列表失败')
    }
    const response = await resp.json()
    console.log('管理员列表原始数据:', response)
    
    // 根据实际 API 响应格式解析：{ success, message, data: { admins: [...], count: ... } }
    let list = []
    if (response && response.data && Array.isArray(response.data.admins)) {
      // 标准格式：{ success, message, data: { admins: [...], count: ... } }
      list = response.data.admins
    } else if (Array.isArray(response)) {
      // 兼容直接返回数组的情况
      list = response
    } else if (response && Array.isArray(response.list)) {
      // 兼容 { list: [...] } 格式
      list = response.list
    } else if (response && response.data && Array.isArray(response.data)) {
      // 兼容 { data: [...] } 格式
      list = response.data
    }
    
    console.log('解析后的管理员列表:', list)
    if (!Array.isArray(list)) {
      console.warn('解析后的数据不是数组:', list)
      list = []
    }
    
    return list
  } catch (err) {
    console.error('getAdmins error:', err)
    throw err
  }
}

/**
 * 删除管理员账号
 * @param {Object} adminData - { admin_id, username }
 * @returns {Promise<void>}
 */
export const deleteAdmin = async (adminData) => {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/admin/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        admin_id: adminData.admin_id,
        username: adminData.username,
      }),
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: '删除失败' }))
      throw new Error(error.message || '删除管理员账号失败')
    }
    // DELETE 请求可能返回 204 No Content
    if (resp.status !== 204) {
      await resp.json()
    }
  } catch (err) {
    console.error('deleteAdmin error:', err)
    throw err
  }
}
