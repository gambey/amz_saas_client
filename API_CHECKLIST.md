# 邮箱管理接口对接检查清单

## 当前代码中使用的接口

### 1. 获取邮箱列表
- **接口路径**: `GET http://localhost:3000/api/emails`
- **请求头**: 
  - `Authorization: Bearer {token}`
- **响应格式**: 
  - 期望: `{ list: [...] }` 或 `{ data: [...] }`
  - 每个项包含: `{ id, email, authCode }`
- **代码位置**: `EmailManagementView.vue:19`

### 2. 新增邮箱
- **接口路径**: `POST http://localhost:3000/api/emails`
- **请求头**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- **请求体**: 
  ```json
  {
    "email": "string",
    "authCode": "string"
  }
  ```
- **代码位置**: `EmailManagementView.vue:57`

### 3. 更新邮箱
- **接口路径**: `PUT http://localhost:3000/api/emails/:id`
- **请求头**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- **请求体**: 
  ```json
  {
    "email": "string",
    "authCode": "string"
  }
  ```
- **代码位置**: `EmailManagementView.vue:56`

### 4. 删除邮箱
- **接口路径**: `DELETE http://localhost:3000/api/emails/:id`
- **请求头**: 
  - `Authorization: Bearer {token}`
- **代码位置**: `EmailManagementView.vue:106`

## 需要检查的项

请对照 `http://localhost:3000/api-docs/#/` 中的邮箱管理相关接口，检查以下内容：

1. ✅ **接口路径是否正确**
   - 当前使用: `/api/emails`
   - 请确认 API 文档中的实际路径

2. ✅ **HTTP 方法是否正确**
   - GET, POST, PUT, DELETE

3. ✅ **请求参数是否正确**
   - 字段名: `email`, `authCode`
   - 是否还有其他必需字段

4. ✅ **响应格式是否匹配**
   - 当前代码期望: `data.list` 或 `data.data`
   - 请确认实际响应格式

5. ✅ **认证方式是否正确**
   - 当前使用: `Bearer Token` 在 `Authorization` 头中
   - 请确认 API 文档要求的认证方式

6. ✅ **错误处理**
   - 当前代码只检查 `resp.ok`
   - 可能需要更详细的错误信息处理

## 可能的问题

1. **接口路径不匹配**: API 文档中的路径可能不是 `/api/emails`
2. **字段名不匹配**: 可能使用 `auth_code` 而不是 `authCode`（下划线 vs 驼峰）
3. **响应格式不同**: 可能直接返回数组，而不是包装在对象中
4. **认证方式不同**: 可能使用其他认证方式（如 Cookie、API Key 等）
