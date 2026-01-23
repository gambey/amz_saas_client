#!/bin/bash

# 安全部署脚本 - 使用环境变量存储敏感信息
# 使用方法: 
#   export DEPLOY_SERVER_IP="47.252.8.184"
#   export DEPLOY_SERVER_USER="root"
#   export DEPLOY_SERVER_PASSWORD="made95-Dare-"
#   export DEPLOY_SERVER_PATH="/www/wwwroot/www.bestswitch2dock.xyz/dist"
#   ./deploy-secure.sh
# 
# 或者创建 .env.deploy 文件（已添加到 .gitignore）

set -e  # 遇到错误立即退出

# 从环境变量或 .env.deploy 文件读取配置
if [ -f ".env.deploy" ]; then
    source .env.deploy
fi

# 配置信息（从环境变量读取，如果没有则使用默认值）
SERVER_IP="${DEPLOY_SERVER_IP:-47.252.8.184}"
SERVER_USER="${DEPLOY_SERVER_USER:-root}"
SERVER_PASSWORD="${DEPLOY_SERVER_PASSWORD:-made95-Dare-}"
SERVER_PATH="${DEPLOY_SERVER_PATH:-/www/wwwroot/www.bestswitch2dock.xyz/dist}"
LOCAL_DIST="./dist"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始部署到服务器${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 步骤1: 构建项目
echo -e "${YELLOW}[1/3] 正在构建项目...${NC}"
if ! npm run build; then
    echo -e "${RED}构建失败，请检查错误信息${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 构建完成${NC}"

# 检查 dist 目录是否存在
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}错误: dist 目录不存在，构建可能失败${NC}"
    exit 1
fi

# 步骤2: 检查必要的工具
echo -e "${YELLOW}[2/3] 检查部署工具...${NC}"

# 检查是否安装了 sshpass
if command -v sshpass &> /dev/null; then
    USE_SSHPASS=true
    echo -e "${GREEN}✓ 检测到 sshpass，将使用密码认证${NC}"
else
    USE_SSHPASS=false
    echo -e "${YELLOW}⚠ 未检测到 sshpass，将尝试使用 SSH 密钥认证${NC}"
    echo -e "${YELLOW}  如果密钥认证失败，请安装 sshpass:${NC}"
    echo -e "${YELLOW}    macOS: brew install hudochenkov/sshpass/sshpass${NC}"
    echo -e "${YELLOW}    Linux: sudo apt-get install sshpass${NC}"
fi

# 步骤3: 部署到服务器
echo -e "${YELLOW}[3/3] 正在部署到服务器...${NC}"

# 创建服务器上的备份目录
BACKUP_DIR="${SERVER_PATH}_backup_$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}创建备份目录: ${BACKUP_DIR}${NC}"

if [ "$USE_SSHPASS" = true ]; then
    # 使用 sshpass 进行密码认证
    # 先备份现有文件
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
        "mkdir -p ${BACKUP_DIR} && [ -d ${SERVER_PATH} ] && cp -r ${SERVER_PATH}/* ${BACKUP_DIR}/ 2>/dev/null || true"
    
    # 清空目标目录
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
        "rm -rf ${SERVER_PATH}/* 2>/dev/null || true"
    
    # 上传文件
    echo -e "${YELLOW}正在上传文件...${NC}"
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r ${LOCAL_DIST}/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
else
    # 使用 SSH 密钥认证（需要预先配置 SSH 密钥）
    # 先备份现有文件
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
        "mkdir -p ${BACKUP_DIR} && [ -d ${SERVER_PATH} ] && cp -r ${SERVER_PATH}/* ${BACKUP_DIR}/ 2>/dev/null || true"
    
    # 清空目标目录
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
        "rm -rf ${SERVER_PATH}/* 2>/dev/null || true"
    
    # 上传文件
    echo -e "${YELLOW}正在上传文件...${NC}"
    scp -o StrictHostKeyChecking=no -r ${LOCAL_DIST}/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}部署信息:${NC}"
    echo -e "  服务器: ${SERVER_USER}@${SERVER_IP}"
    echo -e "  路径: ${SERVER_PATH}"
    echo -e "  备份: ${BACKUP_DIR}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}✗ 部署失败，请检查错误信息${NC}"
    exit 1
fi
