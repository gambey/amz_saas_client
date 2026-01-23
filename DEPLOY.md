# 部署说明

本文档说明如何将项目部署到生产服务器。

## 快速部署

### 方法1: 使用默认脚本（简单快速）

直接运行 `deploy.sh` 脚本：

```bash
cd amz_saas_client
./deploy.sh
```

这个脚本已经包含了服务器配置信息，可以直接使用。

### 方法2: 使用安全脚本（推荐）

使用 `deploy-secure.sh` 脚本，通过环境变量或 `.env.deploy` 文件配置：

#### 方式A: 使用环境变量

```bash
export DEPLOY_SERVER_IP="47.252.8.184"
export DEPLOY_SERVER_USER="root"
export DEPLOY_SERVER_PASSWORD="made95-Dare-"
export DEPLOY_SERVER_PATH="/www/wwwroot/www.bestswitch2dock.xyz/dist"

cd amz_saas_client
./deploy-secure.sh
```

#### 方式B: 使用 .env.deploy 文件（推荐）

1. 创建 `.env.deploy` 文件：

```bash
cat > .env.deploy << EOF
DEPLOY_SERVER_IP=47.252.8.184
DEPLOY_SERVER_USER=root
DEPLOY_SERVER_PASSWORD=made95-Dare-
DEPLOY_SERVER_PATH=/www/wwwroot/www.bestswitch2dock.xyz/dist
EOF
```

2. 运行部署脚本：

```bash
cd amz_saas_client
./deploy-secure.sh
```

**注意**: `.env.deploy` 文件已添加到 `.gitignore`，不会被提交到 Git。

## 部署流程

脚本会自动执行以下步骤：

1. **构建项目**: 运行 `npm run build` 生成生产版本
2. **检查工具**: 检查是否安装了 `sshpass`（用于密码认证）
3. **备份现有文件**: 在服务器上创建备份目录
4. **上传文件**: 将 `dist` 目录内容上传到服务器
5. **完成**: 显示部署信息

## 前置要求

### 必需工具

- `npm` 或 `node` (用于构建项目)
- `ssh` 和 `scp` (通常系统自带)

### 可选工具

- `sshpass` (用于密码认证，推荐安装)

#### 安装 sshpass

**macOS:**
```bash
brew install hudochenkov/sshpass/sshpass
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install sshpass
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install sshpass
```

如果没有安装 `sshpass`，脚本会尝试使用 SSH 密钥认证（需要预先配置 SSH 密钥）。

## 服务器配置

- **IP地址**: 47.252.8.184
- **用户名**: root
- **密码**: made95-Dare-
- **部署路径**: /www/wwwroot/www.bestswitch2dock.xyz/dist

## 故障排除

### 1. 构建失败

确保已安装所有依赖：
```bash
npm install
```

### 2. SSH 连接失败

- 检查服务器 IP 和端口是否正确
- 检查网络连接
- 确认服务器防火墙设置

### 3. 权限错误

确保服务器上的目标目录有写入权限：
```bash
ssh root@47.252.8.184 "chmod -R 755 /www/wwwroot/www.bestswitch2dock.xyz/dist"
```

### 4. sshpass 未找到

安装 `sshpass` 或配置 SSH 密钥认证。

## 安全建议

1. **使用 SSH 密钥认证**（推荐）:
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id root@47.252.8.184
   ```
   配置后，可以使用 `deploy-secure.sh` 而不需要密码。

2. **不要在代码中硬编码密码**: 使用 `.env.deploy` 文件或环境变量。

3. **定期更改密码**: 确保服务器密码安全。

4. **限制 SSH 访问**: 在服务器上配置防火墙，只允许特定 IP 访问。

## 备份

脚本会在部署前自动创建备份，备份目录格式为：
```
/www/wwwroot/www.bestswitch2dock.xyz/dist_backup_YYYYMMDD_HHMMSS
```

如果需要恢复备份：
```bash
ssh root@47.252.8.184 "cp -r /www/wwwroot/www.bestswitch2dock.xyz/dist_backup_YYYYMMDD_HHMMSS/* /www/wwwroot/www.bestswitch2dock.xyz/dist/"
```
