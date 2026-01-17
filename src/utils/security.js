/**
 * 前端安全工具
 * 用于密码加密等安全操作
 */

import { API_BASE_URL } from '../config/api.js'

// 缓存RSA公钥
let cachedPublicKey = null
let publicKeyPromise = null

/**
 * 获取RSA公钥（带缓存）
 * @returns {Promise<string>} RSA公钥（PEM格式）
 */
export const getPublicKey = async () => {
  if (cachedPublicKey) {
    return cachedPublicKey
  }
  if (publicKeyPromise) {
    return publicKeyPromise
  }
  
  publicKeyPromise = (async () => {
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
      console.log('RSA公钥API响应:', response)
      
      // 根据实际 API 响应格式：{ success, message, data: { publicKey, algorithm, keySize, hash } }
      let publicKey = response.data?.publicKey || response.data?.public_key || response.publicKey || response.public_key || response.key || response
      
      // 确保返回的是字符串
      if (typeof publicKey !== 'string') {
        console.error('公钥格式错误，不是字符串:', publicKey, '类型:', typeof publicKey)
        throw new Error('获取的公钥格式不正确')
      }
      
      // 确保公钥包含必要的PEM格式标记
      if (!publicKey.includes('BEGIN') && !publicKey.includes('PUBLIC')) {
        // 如果返回的是纯Base64字符串，可能需要添加PEM头部
        console.warn('公钥可能不是标准PEM格式，尝试处理')
      }
      
      cachedPublicKey = publicKey
      return publicKey
    } catch (err) {
      console.error('getPublicKey error:', err)
      publicKeyPromise = null // 重置，允许重试
      throw err
    }
  })()
  
  return publicKeyPromise
}

/**
 * 使用RSA公钥加密文本
 * 使用 Web Crypto API 进行 RSA-OAEP 加密
 * @param {string} text - 要加密的文本
 * @param {string} publicKeyPem - RSA公钥（PEM格式）
 * @returns {Promise<string>} Base64编码的加密结果
 */
export const encryptWithRSA = async (text, publicKeyPem) => {
  try {
    // 将PEM格式的公钥转换为CryptoKey
    const publicKey = await importRSAPublicKey(publicKeyPem)
    
    // 加密数据
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      data
    )
    
    // 转换为Base64字符串
    return arrayBufferToBase64(encrypted)
  } catch (err) {
    console.error('RSA加密失败:', err)
    throw new Error('密码加密失败，请稍后重试')
  }
}

/**
 * 导入RSA公钥（PEM格式转换为CryptoKey）
 * @param {string} pem - PEM格式的公钥
 * @returns {Promise<CryptoKey>} CryptoKey对象
 */
const importRSAPublicKey = async (pem) => {
  // 确保 pem 是字符串类型
  if (typeof pem !== 'string') {
    console.error('公钥类型错误，期望字符串，实际:', typeof pem, pem)
    throw new Error('公钥格式错误：不是字符串类型')
  }
  
  // 移除PEM格式的头部和尾部，以及换行符
  const pemHeader = '-----BEGIN PUBLIC KEY-----'
  const pemFooter = '-----END PUBLIC KEY-----'
  let pemContents = pem.trim()
  
  // 如果包含PEM头部，移除它们
  if (pemContents.includes(pemHeader)) {
    pemContents = pemContents
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '')
  } else {
    // 如果没有PEM头部，假设是纯Base64字符串，直接使用
    pemContents = pemContents.replace(/\s/g, '')
  }
  
  // 将Base64字符串转换为ArrayBuffer
  const binaryDer = base64ToArrayBuffer(pemContents)
  
  // 导入公钥
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  )
}

/**
 * Base64字符串转ArrayBuffer
 * @param {string} base64 - Base64字符串
 * @returns {ArrayBuffer} ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * ArrayBuffer转Base64字符串
 * @param {ArrayBuffer} buffer - ArrayBuffer
 * @returns {string} Base64字符串
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 使用RSA公钥加密密码（自动获取公钥）
 * @param {string} password - 原始密码
 * @returns {Promise<string>} Base64编码的加密密码
 */
export const encryptPasswordWithRSA = async (password) => {
  try {
    const publicKey = await getPublicKey()
    console.log('获取到的公钥类型:', typeof publicKey, '长度:', publicKey?.length)
    
    if (!publicKey || typeof publicKey !== 'string') {
      throw new Error('获取的公钥无效')
    }
    
    return await encryptWithRSA(password, publicKey)
  } catch (err) {
    console.error('encryptPasswordWithRSA 错误:', err)
    throw err
  }
}

/**
 * 使用 Web Crypto API 进行 SHA-256 哈希
 * 注意：这不能完全替代 HTTPS，但可以增加一层保护
 * @param {string} text - 要哈希的文本
 * @returns {Promise<string>} 哈希后的十六进制字符串
 */
export const sha256Hash = async (text) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 生成随机字符串（用于盐值或 nonce）
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export const generateRandomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomArray = new Uint8Array(length)
  crypto.getRandomValues(randomArray)
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length]
  }
  return result
}

/**
 * 使用时间戳和随机数生成签名，防止重放攻击
 * @param {string} username - 用户名
 * @param {string} passwordHash - 密码哈希
 * @returns {Object} 包含时间戳、随机数和签名的对象
 */
export const generateRequestSignature = async (username, passwordHash) => {
  const timestamp = Date.now()
  const nonce = generateRandomString(16)
  const signature = await sha256Hash(`${username}${passwordHash}${timestamp}${nonce}`)
  return { timestamp, nonce, signature }
}

/**
 * 密码加密（使用 SHA-256 + 时间戳 + 随机数）
 * 注意：这不能完全替代 HTTPS，真正的安全需要 HTTPS
 * @param {string} password - 原始密码
 * @param {string} username - 用户名（用于加盐）
 * @returns {Promise<Object>} 加密后的密码和签名信息
 */
export const encryptPassword = async (password, username) => {
  // 使用用户名作为盐值的一部分
  const salt = username.toLowerCase()
  const passwordWithSalt = `${password}${salt}`
  
  // 生成密码哈希
  const passwordHash = await sha256Hash(passwordWithSalt)
  
  // 生成请求签名（防止重放攻击）
  const signature = await generateRequestSignature(username, passwordHash)
  
  return {
    password_hash: passwordHash,
    ...signature,
  }
}

/**
 * 验证响应签名（可选，用于验证服务器响应）
 * @param {Object} responseData - 服务器响应数据
 * @param {string} expectedSignature - 期望的签名
 * @returns {boolean} 是否验证通过
 */
export const verifyResponseSignature = async (responseData, expectedSignature) => {
  const dataString = JSON.stringify(responseData)
  const hash = await sha256Hash(dataString)
  return hash === expectedSignature
}
