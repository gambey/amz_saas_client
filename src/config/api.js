/**
 * API 配置
 * 使用环境变量配置 API 基础地址
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
//export const API_BASE_URL = 'http://www.bestswitch2dock.xyz'
/**
 * 获取认证请求头
 * @returns {Object} 包含 Content-Type 和 Authorization 的请求头
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}
