#!/bin/bash

# 集成测试数据库设置脚本
#
# 此脚本用于快速设置集成测试所需的数据库环境。
# 支持 Docker Compose 和本地 PostgreSQL 两种方式。

set -e

echo "🔧 设置集成测试数据库环境..."
echo ""

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# 检查是否使用 Docker Compose
USE_DOCKER=false
HAS_DOCKER=false
HAS_DOCKER_COMPOSE=false

# 检查 Docker 命令
if command -v docker &> /dev/null; then
  HAS_DOCKER=true
  # 检查 Docker 是否运行
  if docker info &> /dev/null; then
    # 检查是否有 postgres 容器（运行中或已停止）
    if docker ps -a | grep -q postgres_container; then
      USE_DOCKER=true
    elif [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
      # 即使容器不存在，如果有 docker-compose.yml，也尝试使用 Docker
      USE_DOCKER=true
    fi
  fi
fi

# 检查 docker-compose 命令
if command -v docker-compose &> /dev/null; then
  HAS_DOCKER_COMPOSE=true
  if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    USE_DOCKER=true
  fi
fi

DB_NAME="fastify_api_test"
DB_USER=""
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

if [ "$USE_DOCKER" = true ]; then
  echo "📦 检测到 Docker 环境，使用 Docker 数据库..."
  DB_USER="aiofix"
  DB_PASSWORD="aiofix"
  
  # 切换到项目根目录
  cd "$PROJECT_ROOT"
  
  # 检查 Docker 容器是否运行
  if ! docker ps | grep -q postgres_container; then
    echo "🚀 启动 PostgreSQL 容器..."
    if [ "$HAS_DOCKER_COMPOSE" = true ]; then
      docker-compose up -d postgres
    else
      # 如果没有 docker-compose，尝试使用 docker compose (v2)
      docker compose up -d postgres 2>/dev/null || {
        echo "❌ 错误: 无法启动容器。请确保已安装 docker-compose 或 docker compose (v2)"
        exit 1
      }
    fi
    echo "⏳ 等待数据库启动..."
    sleep 5
  else
    echo "✅ PostgreSQL 容器已在运行"
  fi
  
  # 创建测试数据库
  echo "📝 创建测试数据库: $DB_NAME"
  
  # 优先使用 docker exec（更可靠）
  if docker ps | grep -q postgres_container; then
    # 使用 docker exec 直接操作容器
    docker exec -i postgres_container psql -U "$DB_USER" -d postgres <<EOF 2>/dev/null || true
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOF
    
    # 验证数据库是否创建成功
    DB_EXISTS=$(docker exec postgres_container psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
  elif [ "$HAS_DOCKER_COMPOSE" = true ]; then
    # 如果容器不在运行，尝试使用 docker-compose
    cd "$PROJECT_ROOT"
    docker-compose exec -T postgres psql -U "$DB_USER" -d postgres <<EOF 2>/dev/null || true
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOF
    
    # 验证数据库是否创建成功
    DB_EXISTS=$(docker-compose exec -T postgres psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
  else
    echo "⚠️  警告: 无法找到运行中的 postgres 容器"
    DB_EXISTS=""
  fi
  
  if [ -n "$DB_EXISTS" ]; then
    echo "✅ 测试数据库 '$DB_NAME' 已创建或已存在"
  else
    echo "⚠️  警告: 无法确认数据库是否创建成功，但继续执行..."
  fi
  
  echo ""
  echo "✅ 测试数据库设置完成！"
  echo ""
  echo "请设置以下环境变量："
  echo "  export TEST_DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\""
  echo ""
  echo "或者运行："
  echo "  export TEST_DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\" && pnpm test:integration"
else
  echo "💻 尝试使用本地 PostgreSQL..."
  
  # 检查 PostgreSQL 是否安装
  if ! command -v psql &> /dev/null; then
    echo ""
    echo "❌ 错误: 未找到 psql 命令。"
    echo ""
    echo "请选择以下方式之一："
    echo ""
    echo "方式 1: 使用 Docker（推荐）"
    echo "  1. 确保 Docker 已安装并运行"
    echo "  2. 在项目根目录运行: docker-compose up -d postgres"
    echo "  3. 然后重新运行此脚本"
    echo ""
    echo "方式 2: 安装 PostgreSQL 客户端"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    echo "  CentOS/RHEL: sudo yum install postgresql"
    echo ""
    
    # 如果 Docker 可用但未使用，提示用户
    if [ "$HAS_DOCKER" = true ]; then
      echo "💡 提示: 检测到 Docker 已安装，但未检测到 postgres 容器。"
      echo "  可以运行以下命令启动数据库："
      echo "  cd $PROJECT_ROOT && docker-compose up -d postgres"
      echo ""
    fi
    
    exit 1
  fi
  
  # 尝试检测数据库用户
  if [ -z "$DB_USER" ]; then
    DB_USER="${PGUSER:-postgres}"
  fi
  
  echo "📝 创建测试数据库: $DB_NAME (用户: $DB_USER)"
  
  # 创建数据库（如果不存在）
  createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
    if psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
      echo "✅ 测试数据库已存在"
    else
      echo "❌ 错误: 无法创建测试数据库。请检查："
      echo "  1. PostgreSQL 是否运行"
      echo "  2. 用户 '$DB_USER' 是否有创建数据库的权限"
      echo "  3. 数据库连接配置是否正确"
      echo ""
      echo "💡 提示: 如果使用 Docker，请确保容器已启动："
      echo "  docker-compose up -d postgres"
      exit 1
    fi
  }
  
  echo ""
  echo "✅ 测试数据库设置完成！"
  echo ""
  echo "请设置以下环境变量："
  if [ -n "$DB_PASSWORD" ]; then
    echo "  export TEST_DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\""
  else
    echo "  export TEST_DATABASE_URL=\"postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME\""
  fi
  echo ""
  echo "或者运行："
  if [ -n "$DB_PASSWORD" ]; then
    echo "  export TEST_DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\" && pnpm test:integration"
  else
    echo "  export TEST_DATABASE_URL=\"postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME\" && pnpm test:integration"
  fi
fi

echo ""
echo "💡 提示: 可以将环境变量添加到 .env.test 文件中以持久化配置。"

