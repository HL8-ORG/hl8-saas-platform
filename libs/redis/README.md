# @hl8/redis

Redis 客户端的工具类封装库，提供简单易用的 API 进行 Redis 操作，支持单机模式和集群模式。

## 功能特性

- ✅ 支持单机模式（standalone）
- ✅ 支持集群模式（cluster）
- ✅ 并发安全的单例模式，防止重复创建连接
- ✅ 完整的 TypeScript 类型支持
- ✅ 连接状态监听和日志记录
- ✅ 配置验证和友好的错误处理
- ✅ 资源管理和连接清理
- ✅ 完整的 TSDoc 中文注释

## 安装

```bash
pnpm add @hl8/redis
```

## 配置

### 环境变量配置

Redis 配置通过环境变量进行设置。在项目根目录的 `.env` 文件中添加以下配置：

#### 单机模式（默认）

```env
# Redis 模式（standalone/cluster/sentinel），默认 standalone
REDIS_MODE=standalone

# 单机模式配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

#### 集群模式

```env
# Redis 模式
REDIS_MODE=cluster

# 集群节点列表（逗号分隔，格式：host:port）
REDIS_CLUSTER_NODES=localhost:7000,localhost:7001,localhost:7002

# 集群密码
REDIS_CLUSTER_PASSWORD=cluster-password

# 数据库编号（可选，默认使用 standalone 的 db）
REDIS_DB=0
```

#### 哨兵模式

```env
# Redis 模式
REDIS_MODE=sentinel

# 哨兵节点列表（逗号分隔，格式：host:port）
REDIS_SENTINELS=localhost:26379,localhost:26380,localhost:26381

# 哨兵主节点名称
REDIS_SENTINEL_MASTER_NAME=master

# 哨兵密码
REDIS_SENTINEL_PASSWORD=sentinel-password

# 哨兵数据库编号
REDIS_SENTINEL_DB=0
```

### 配置说明

| 环境变量                     | 说明                                    | 默认值       | 必需         |
| ---------------------------- | --------------------------------------- | ------------ | ------------ |
| `REDIS_MODE`                 | Redis 模式：standalone/cluster/sentinel | `standalone` | 否           |
| `REDIS_HOST`                 | 单机模式主机地址                        | `localhost`  | 否           |
| `REDIS_PORT`                 | 单机模式端口                            | `26379`      | 否           |
| `REDIS_PASSWORD`             | Redis 密码                              | `123456`     | 否           |
| `REDIS_DB`                   | 数据库编号（0-15）                      | `5`          | 否           |
| `REDIS_CLUSTER_NODES`        | 集群节点列表                            | -            | 集群模式必需 |
| `REDIS_CLUSTER_PASSWORD`     | 集群密码                                | -            | 否           |
| `REDIS_SENTINELS`            | 哨兵节点列表                            | -            | 哨兵模式必需 |
| `REDIS_SENTINEL_MASTER_NAME` | 哨兵主节点名称                          | `master`     | 否           |
| `REDIS_SENTINEL_PASSWORD`    | 哨兵密码                                | -            | 否           |
| `REDIS_SENTINEL_DB`          | 哨兵数据库编号                          | `5`          | 否           |

## 使用示例

### 基本使用

#### 推荐方式：异步初始化

```typescript
import { RedisUtility } from '@hl8/redis';

// 在应用启动时初始化
async function bootstrap() {
  // 初始化 Redis 连接
  await RedisUtility.client();

  // ... 其他初始化代码
}

// 在服务中使用
async function someService() {
  // 确保已初始化
  const redis = await RedisUtility.client();

  // 使用 Redis 操作
  await redis.set('key', 'value');
  const value = await redis.get('key');
  console.log(value); // 输出: value
}
```

#### 同步访问（需要确保已初始化）

```typescript
import { RedisUtility } from '@hl8/redis';

// 在应用启动时初始化
async function bootstrap() {
  await RedisUtility.client();
  // ... 其他初始化代码
}

// 在服务中使用（确保已初始化）
class MyService {
  private readonly redis = RedisUtility.instance;

  async getValue(key: string) {
    return await this.redis.get(key);
  }

  async setValue(key: string, value: string) {
    return await this.redis.set(key, value);
  }
}
```

### 在 NestJS 应用中使用

#### 在应用启动时初始化

```typescript
// apps/fastify-api/src/main.ts
import { RedisUtility } from '@hl8/redis';

async function bootstrap() {
  // 初始化 Redis 连接
  await RedisUtility.client();

  const app = await NestFactory.create(AppModule);
  // ... 其他初始化代码
  await app.listen(3000);
}
```

#### 在服务中使用

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisUtility } from '@hl8/redis';
import type { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private redis: Redis;

  async onModuleInit() {
    // 确保 Redis 已初始化
    this.redis = (await RedisUtility.client()) as Redis;
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

#### 使用同步访问（需要确保已初始化）

```typescript
import { Injectable } from '@nestjs/common';
import { RedisUtility } from '@hl8/redis';

@Injectable()
export class ApiKeyService {
  private readonly redis = RedisUtility.instance;

  async validateKey(apiKey: string): Promise<boolean> {
    const secret = await this.redis.hget('api-keys', apiKey);
    return secret !== null;
  }
}
```

### 连接状态检查

```typescript
import { RedisUtility } from '@hl8/redis';

// 检查连接状态
if (RedisUtility.isConnected()) {
  const redis = RedisUtility.instance;
  await redis.ping();
} else {
  // 初始化连接
  await RedisUtility.client();
}
```

### 资源清理

```typescript
import { RedisUtility } from '@hl8/redis';

// 在应用关闭时清理资源
async function shutdown() {
  await RedisUtility.close();
  // ... 其他清理代码
}
```

## API 文档

### RedisUtility

Redis 工具类，提供静态方法访问 Redis 客户端。

#### `client(): Promise<Redis | Cluster>`

获取 Redis 客户端实例，如果不存在则创建，支持并发安全。

**返回：** `Promise<Redis | Cluster>` - Redis 客户端实例

**异常：**

- 如果配置无效或创建失败，抛出 `Error`

**示例：**

```typescript
const redis = await RedisUtility.client();
await redis.set('key', 'value');
```

#### `instance: Redis | Cluster`

获取当前 Redis 客户端实例（同步访问）。

**返回：** `Redis | Cluster` - Redis 客户端实例

**异常：**

- 如果实例未初始化，抛出 `Error`：`"Redis 实例未初始化。请先调用 RedisUtility.client() 方法完成初始化。"`

**注意：** 使用此访问器前，必须确保已调用 `client()` 方法完成初始化。

**示例：**

```typescript
// 确保已初始化
await RedisUtility.client();
const redis = RedisUtility.instance;
await redis.get('key');
```

#### `close(): Promise<void>`

关闭 Redis 连接并清理资源。

**返回：** `Promise<void>`

**注意：** 在应用关闭时调用此方法可以确保资源正确释放。

**示例：**

```typescript
await RedisUtility.close();
```

#### `isConnected(): boolean`

检查 Redis 客户端是否已初始化且连接正常。

**返回：** `boolean` - 如果连接正常返回 `true`，否则返回 `false`

**示例：**

```typescript
if (RedisUtility.isConnected()) {
  const redis = RedisUtility.instance;
  await redis.ping();
}
```

## 错误处理

### 配置错误

如果配置无效，会抛出友好的中文错误消息：

```typescript
try {
  await RedisUtility.client();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    // 可能的错误消息：
    // - "Redis 配置不能为空"
    // - "Redis 主机地址不能为空"
    // - "Redis 端口无效: 70000"
    // - "Redis 数据库编号无效: 20（有效范围：0-15）"
    // - "集群模式需要配置至少一个集群节点"
    // - "集群节点主机地址不能为空"
    // - "集群节点端口无效: 0"
  }
}
```

### 连接错误

连接错误会自动记录到日志，并触发 `error` 事件：

```typescript
const redis = await RedisUtility.client();
redis.on('error', (error) => {
  console.error('Redis 连接错误:', error);
});
```

## 连接事件

Redis 客户端支持以下事件监听：

- `connect` - 连接已建立
- `ready` - 客户端已就绪
- `error` - 连接错误
- `close` - 连接已关闭
- `reconnecting` - 正在重连
- `end` - 连接已结束

所有事件都会自动记录到日志中。

## 注意事项

### 1. 初始化顺序

**重要：** 使用 `instance` 访问器前，必须确保已调用 `client()` 方法完成初始化。

```typescript
// ✅ 正确：先初始化
await RedisUtility.client();
const redis = RedisUtility.instance;

// ❌ 错误：未初始化就使用
const redis = RedisUtility.instance; // 会抛出错误
```

### 2. 并发安全

`client()` 方法支持并发调用，多个地方同时调用时会共享同一个连接实例：

```typescript
// 并发调用是安全的
const [client1, client2] = await Promise.all([
  RedisUtility.client(),
  RedisUtility.client(),
]);
// client1 === client2
```

### 3. 资源清理

在应用关闭时，建议调用 `close()` 方法清理资源：

```typescript
process.on('SIGTERM', async () => {
  await RedisUtility.close();
  process.exit(0);
});
```

### 4. 连接状态

使用 `isConnected()` 方法检查连接状态，避免在未初始化时访问：

```typescript
if (RedisUtility.isConnected()) {
  const redis = RedisUtility.instance;
  // 安全使用
}
```

### 5. 集群模式配置

集群模式下，所有节点使用相同的密码。如果节点密码不同，需要在配置中单独处理。

### 6. 数据库编号

- 单机模式：使用 `REDIS_DB` 环境变量（默认 5）
- 集群模式：使用 `REDIS_DB` 环境变量（默认 0）
- 哨兵模式：使用 `REDIS_SENTINEL_DB` 环境变量（默认 5）

## 类型支持

库提供完整的 TypeScript 类型支持：

```typescript
import { RedisUtility } from '@hl8/redis';
import type { Redis, Cluster } from 'ioredis';

// 类型推断
const redis = await RedisUtility.client(); // Redis | Cluster

// 类型断言（如果确定是单机模式）
const standaloneRedis = (await RedisUtility.client()) as Redis;
```

## 测试

运行测试：

```bash
pnpm test
```

运行测试并生成覆盖率报告：

```bash
pnpm test:cov
```

## 许可证

MIT
