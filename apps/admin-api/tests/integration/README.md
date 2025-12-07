# 集成测试说明

## 概述

集成测试用于测试完整的 API 流程，包括数据库交互、中间件、守卫、拦截器等组件的协同工作。

## 目录结构

```
tests/integration/
├── jest.config.json          # Jest 配置文件
├── jest.setup.ts             # 测试全局设置
├── helpers/                  # 测试辅助工具
│   ├── test-app.factory.ts   # 测试应用工厂
│   ├── test-data.factory.ts  # 测试数据工厂
│   └── index.ts              # 导出文件
├── auth.integration.spec.ts  # 认证模块集成测试
└── users.integration.spec.ts # 用户管理模块集成测试
```

## 运行测试

### 前置条件

集成测试需要真实的数据库连接。请确保：

1. **PostgreSQL 数据库已启动**
2. **测试数据库已创建**

### 快速设置（推荐）

使用提供的设置脚本快速配置测试数据库：

```bash
# 运行设置脚本
./tests/integration/setup-test-db.sh

# 脚本会自动：
# - 检测是否使用 Docker Compose
# - 启动数据库容器（如需要）
# - 创建测试数据库
# - 显示需要设置的环境变量
```

然后按照脚本输出的提示设置环境变量并运行测试。

### 配置测试数据库

#### 方式 1: 使用 Docker Compose（推荐）

如果项目使用 Docker Compose，可以直接使用其中的数据库：

```bash
# 启动 PostgreSQL 数据库
docker-compose up -d postgres

# 创建测试数据库
docker-compose exec postgres psql -U aiofix -d postgres -c "CREATE DATABASE fastify_api_test;"
```

然后设置环境变量：

```bash
export TEST_DATABASE_URL="postgresql://aiofix:aiofix@localhost:5432/fastify_api_test"
```

#### 方式 2: 使用环境变量

```bash
# 设置测试数据库 URL
export TEST_DATABASE_URL="postgresql://username:password@localhost:5432/fastify_api_test"

# 或者使用 DATABASE_URL
export DATABASE_URL="postgresql://username:password@localhost:5432/fastify_api_test"
```

#### 方式 3: 在 .env.test 文件中配置

创建 `apps/fastify-api/.env.test` 文件：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/fastify_api_test
DB_TYPE=postgres
NODE_ENV=test
```

### 创建测试数据库

```bash
# 使用 psql 创建测试数据库
createdb fastify_api_test

# 或者使用 SQL
psql -U postgres -c "CREATE DATABASE fastify_api_test;"

# 如果使用 Docker Compose
docker-compose exec postgres psql -U aiofix -d postgres -c "CREATE DATABASE fastify_api_test;"
```

### 运行测试

```bash
# 运行所有集成测试
pnpm test:integration

# 运行特定测试文件
pnpm test:integration -- auth.integration.spec.ts

# 监听模式
pnpm test:integration -- --watch
```

## 测试覆盖

### 认证模块 (`auth.integration.spec.ts`)

- ✅ 用户注册 (`POST /api/v1/auth/signup`)
  - 成功注册
  - 邮箱冲突处理
  - 密码验证
- ✅ 用户登录 (`POST /api/v1/auth/login`)
  - 成功登录
  - 密码错误处理
  - 用户不存在处理
  - 未激活用户处理
- ✅ 令牌刷新 (`POST /api/v1/auth/refresh`)
  - 成功刷新令牌
  - 无效令牌处理
- ✅ 用户登出 (`POST /api/v1/auth/logout`)
  - 成功登出
- ✅ 获取当前用户 (`GET /api/v1/auth/me`)
  - 成功获取用户信息
  - 未认证处理

### 用户管理模块 (`users.integration.spec.ts`)

- ✅ 个人资料管理
  - 获取个人资料 (`GET /api/v1/users/profile`)
  - 更新个人资料 (`PATCH /api/v1/users/profile`)
- ✅ 管理员操作
  - 获取所有用户 (`GET /api/v1/users`)
  - 根据 ID 获取用户 (`GET /api/v1/users/:id`)
  - 更新用户 (`PATCH /api/v1/users/:id`)
  - 删除用户 (`DELETE /api/v1/users/:id`)
- ✅ 权限控制
  - 管理员权限验证
  - 普通用户权限限制

## 测试工具

### TestAppFactory

用于创建和管理测试应用实例：

```typescript
const testAppFactory = new TestAppFactory();
const app = await testAppFactory.createApp();
// ... 测试代码 ...
await testAppFactory.cleanupDatabase();
await testAppFactory.closeApp();
```

### TestDataFactory

用于创建测试数据：

```typescript
const testDataFactory = new TestDataFactory(dataSource);

// 创建用户
const user = await testDataFactory.createUser({
  email: 'test@example.com',
  fullName: 'Test User',
});

// 创建管理员
const admin = await testDataFactory.createAdminUser();

// 创建刷新令牌
const token = await testDataFactory.createRefreshToken(user.id);
```

## 注意事项

1. **数据库隔离**: 每个测试套件运行前会清理数据库，确保测试之间的隔离
2. **测试超时**: 默认测试超时为 30 秒，可以通过 `jest.config.json` 调整
3. **并发执行**: 集成测试默认串行执行（`maxWorkers: 1`），避免数据库冲突
4. **环境变量**: 测试使用独立的环境变量配置，不会影响开发环境

## 故障排查

### 数据库连接失败

如果遇到数据库连接错误（如 "password authentication failed"）：

1. **检查 PostgreSQL 是否运行**：

   ```bash
   # 检查本地 PostgreSQL
   pg_isready

   # 或检查 Docker 容器
   docker-compose ps postgres
   ```

2. **使用 Docker Compose 启动数据库**（如果项目使用 Docker）：

   ```bash
   docker-compose up -d postgres
   ```

3. **检查数据库 URL 是否正确**：

   ```bash
   # 查看当前配置
   echo $TEST_DATABASE_URL
   echo $DATABASE_URL
   ```

4. **检查数据库用户权限**：

   ```bash
   # 测试连接
   psql $TEST_DATABASE_URL -c "SELECT 1;"
   ```

5. **确保测试数据库已创建**：

   ```bash
   # 创建测试数据库
   createdb -U postgres fastify_api_test
   # 或使用 Docker
   docker-compose exec postgres psql -U aiofix -d postgres -c "CREATE DATABASE fastify_api_test;"
   ```

6. **使用 Docker Compose 数据库配置**：
   如果项目使用 Docker Compose，默认配置为：
   - 用户: `aiofix`
   - 密码: `aiofix`
   - 主机: `localhost`
   - 端口: `5432`

   设置环境变量：

   ```bash
   export TEST_DATABASE_URL="postgresql://aiofix:aiofix@localhost:5432/fastify_api_test"
   ```

### 测试超时

如果测试超时：

1. 检查数据库连接是否正常
2. 增加测试超时时间（在 `jest.config.json` 中）
3. 检查是否有未关闭的数据库连接

### 数据清理失败

如果数据清理失败：

1. 检查数据库事务是否正确提交/回滚
2. 检查外键约束
3. 手动清理测试数据：`TRUNCATE TABLE refresh_tokens, users CASCADE;`

### 调试测试配置

如果需要查看测试配置信息：

```bash
DEBUG_TEST_CONFIG=true pnpm test:integration
```
