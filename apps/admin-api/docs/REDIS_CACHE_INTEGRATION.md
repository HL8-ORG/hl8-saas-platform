# Redis 缓存集成方案

**文档日期**: 2024年  
**项目**: apps/admin-api  
**目标**: 使用 `@hl8/redis` 实现 Redis 缓存，替换内存缓存

---

## 📋 概述

本文档说明如何使用 `@hl8/redis` 库将 `admin-api` 的内存缓存迁移到 Redis 缓存，实现分布式缓存和缓存持久化。

---

## ✅ 可行性分析

### 当前状态

- ✅ `@hl8/redis` 库已存在且质量优秀（评分 9.2/10）
- ✅ `admin-api` 已安装 `ioredis`（`@hl8/redis` 的依赖）
- ✅ `admin-api` 已使用 `@nestjs/cache-manager`，支持 Redis store
- ✅ `PermissionsService` 已使用 `CACHE_MANAGER`，代码结构支持迁移

### 技术可行性

**完全可行** ✅

`cache-manager` 支持 Redis store，可以通过 `cache-manager-ioredis-yet` 或直接使用 `@hl8/redis` 提供的 Redis 客户端来配置。

---

## 🎯 集成方案

### 方案对比

| 方案                                  | 优点                 | 缺点                            | 推荐度     |
| ------------------------------------- | -------------------- | ------------------------------- | ---------- |
| **方案一：cache-manager-ioredis-yet** | 配置简单，完美集成   | 需要额外包，不能复用 @hl8/redis | ⭐⭐⭐     |
| **方案二：@hl8/redis 自定义 Store**   | 复用内部库，架构一致 | 需要实现 Store                  | ⭐⭐⭐⭐⭐ |

### 推荐方案：使用 @hl8/redis 自定义 Cache Store

**理由**:

- ✅ 直接使用项目内部的 `@hl8/redis` 库，保持架构一致性
- ✅ 复用已有的 Redis 连接，避免重复连接
- ✅ 更好的控制和定制能力
- ✅ 符合项目"使用内部库"的原则
- ✅ `@hl8/redis` 库质量优秀（评分 9.2/10），生产就绪

---

## 🚀 实施方案（方案二：使用 @hl8/redis）

### 步骤 1: 安装依赖

```bash
cd apps/admin-api
pnpm add @hl8/redis
```

### 步骤 2: 创建 Redis Cache Store

创建 `src/infrastructure/cache/redis-cache.store.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { RedisUtility } from '@hl8/redis';
import type { Store } from 'cache-manager';

/**
 * Redis Cache Store 实现
 *
 * 使用 @hl8/redis 库实现 cache-manager 的 Redis store。
 * 支持所有 cache-manager 的标准操作。
 *
 * **特性**:
 * - 自动序列化/反序列化 JSON 对象
 * - 支持 TTL（过期时间）
 * - 支持批量操作（mget、mset）
 * - 支持键模式匹配
 *
 * @class RedisCacheStore
 * @implements {Store}
 * @description Redis 缓存存储实现
 */
@Injectable()
export class RedisCacheStore implements Store {
  private readonly logger = new Logger(RedisCacheStore.name);

  /**
   * 构造函数
   *
   * 初始化 Redis 客户端。
   * 注意：确保在应用启动时已调用 RedisUtility.client() 完成初始化。
   */
  constructor() {
    if (!RedisUtility.isConnected()) {
      this.logger.warn(
        'Redis 未初始化，请确保在应用启动时调用 RedisUtility.client()',
      );
    }
  }

  /**
   * 获取缓存值
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在返回 undefined
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const redis = RedisUtility.instance;
      const value = await redis.get(key);
      if (value === null) {
        return undefined;
      }
      try {
        return JSON.parse(value) as T;
      } catch {
        // 如果不是 JSON，直接返回字符串
        return value as T;
      }
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      return undefined;
    }
  }

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（秒，cache-manager v7 使用秒）
   * @returns 设置结果
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const redis = RedisUtility.instance;
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl && ttl > 0) {
        // cache-manager v7 的 ttl 已经是秒
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 删除缓存
   *
   * @param key - 缓存键
   * @returns 删除结果
   */
  async del(key: string): Promise<void> {
    try {
      const redis = RedisUtility.instance;
      await redis.del(key);
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 清空所有缓存
   *
   * **警告**: 此操作会清空当前数据库的所有数据，请谨慎使用。
   *
   * @returns 清空结果
   */
  async reset(): Promise<void> {
    try {
      const redis = RedisUtility.instance;
      await redis.flushdb();
      this.logger.warn('Redis 缓存已清空');
    } catch (error) {
      this.logger.error('清空缓存失败', error);
      throw error;
    }
  }

  /**
   * 获取多个缓存值
   *
   * @param keys - 缓存键数组
   * @returns 缓存值数组
   */
  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    try {
      const redis = RedisUtility.instance;
      const values = await redis.mget(...keys);
      return values.map((value) => {
        if (value === null) {
          return undefined;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      });
    } catch (error) {
      this.logger.error(`批量获取缓存失败`, error);
      return keys.map(() => undefined);
    }
  }

  /**
   * 设置多个缓存值
   *
   * @param keyValuePairs - 键值对数组
   * @param ttl - 过期时间（秒）
   * @returns 设置结果
   */
  async mset<T>(
    keyValuePairs: Array<[string, T]>,
    ttl?: number,
  ): Promise<void> {
    try {
      const redis = RedisUtility.instance;
      const pipeline = redis.pipeline();

      for (const [key, value] of keyValuePairs) {
        const serialized =
          typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error(`批量设置缓存失败`, error);
      throw error;
    }
  }

  /**
   * 获取缓存键列表
   *
   * **性能警告**: 在生产环境中，避免使用 `keys` 命令，考虑使用 `scan`。
   *
   * @param pattern - 匹配模式（可选，默认 '*'）
   * @returns 缓存键数组
   */
  async keys(pattern?: string): Promise<string[]> {
    try {
      const redis = RedisUtility.instance;
      return await redis.keys(pattern || '*');
    } catch (error) {
      this.logger.error(`获取缓存键列表失败`, error);
      return [];
    }
  }

  /**
   * 获取缓存 TTL
   *
   * @param key - 缓存键
   * @returns TTL（秒），-1 表示永不过期，-2 表示不存在
   */
  async ttl(key: string): Promise<number> {
    try {
      const redis = RedisUtility.instance;
      return await redis.ttl(key);
    } catch (error) {
      this.logger.error(`获取缓存 TTL 失败: ${key}`, error);
      return -2; // 表示不存在
    }
  }
}
```

### 步骤 3: 创建 Cache Store Factory

创建 `src/infrastructure/cache/redis-cache.factory.ts`:

````typescript
import { RedisCacheStore } from './redis-cache.store';

/**
 * Redis Cache Store Factory
 *
 * 创建 Redis Cache Store 实例的工厂函数。
 * 用于 cache-manager 的 store 配置。
 *
 * @function createRedisCacheStore
 * @returns Redis Cache Store 实例
 *
 * @example
 * ```typescript
 * CacheModule.registerAsync({
 *   useFactory: async () => ({
 *     store: createRedisCacheStore(),
 *     ttl: 60,
 *   }),
 * })
 * ```
 */
export function createRedisCacheStore() {
  return new RedisCacheStore();
}
````

### 步骤 4: 更新 AppModule

更新 `src/app.module.ts`:

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { RedisUtility } from '@hl8/redis';
import { createRedisCacheStore } from './infrastructure/cache/redis-cache.factory';

@Module({
  imports: [
    // ... 其他导入
    // 缓存模块：使用 Redis 缓存，全局可用
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        // 确保 Redis 已初始化
        await RedisUtility.client();

        return {
          store: createRedisCacheStore(),
          ttl: 60, // 默认缓存时间 60 秒（cache-manager v7 使用秒）
          // 注意：max 选项在 Redis store 中无效，Redis 本身没有条目数限制
        };
      },
    }),
    // ... 其他模块
  ],
})
export class AppModule {}
```

**重要变更**:

- `ttl` 从毫秒改为秒（cache-manager v7 使用秒）
- 移除了 `max` 选项（Redis 不支持）

### 步骤 5: 在应用启动时初始化 Redis

更新 `src/main.ts`:

```typescript
import { RedisUtility } from '@hl8/redis';

async function bootstrap() {
  // 初始化 Redis 连接（在创建应用之前）
  try {
    await RedisUtility.client();
    logger.log('Redis 连接已初始化', 'Bootstrap');
  } catch (error) {
    logger.error('Redis 初始化失败', error);
    // 根据业务需求决定是否继续启动
    // throw error; // 如果 Redis 是必需的，取消注释此行
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  // ... 其他初始化代码
}

// 在应用关闭时清理 Redis 连接
async function shutdown() {
  try {
    await RedisUtility.close();
    logger.log('Redis 连接已关闭', 'Shutdown');
  } catch (error) {
    logger.error('关闭 Redis 连接失败', error);
  }
}

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});
```

### 步骤 6: 修复 TTL 单位（重要）

**cache-manager v7 使用秒作为 TTL 单位**，需要更新所有缓存设置代码。

查找并替换所有使用毫秒的 TTL：

```typescript
// ❌ 错误：使用毫秒（旧代码）
await this.cacheManager.set(key, value, 5 * 60 * 1000); // 5 分钟

// ✅ 正确：使用秒（新代码）
await this.cacheManager.set(key, value, 5 * 60); // 5 分钟
```

**需要更新的文件**:

1. **`src/infrastructure/services/permissions.service.ts`** (6 处)
   - `createOrGet()`: `5 * 60 * 1000` → `5 * 60` (2 处)
   - `findAll()`: `2 * 60 * 1000` → `2 * 60` (1 处)
   - `findById()`: `5 * 60 * 1000` → `5 * 60` (1 处)
   - `findByResourceAndAction()`: `5 * 60 * 1000` → `5 * 60` (1 处)
   - `getRolePermissions()`: `2 * 60 * 1000` → `2 * 60` (1 处)

2. **`src/infrastructure/persistence/typeorm/repositories/user-read.repository.ts`** (1 处)
   - 查找所有 `cacheManager.set(..., ..., * 1000)` 并修复

**快速修复脚本**（仅供参考，建议手动检查）:

```bash
# 查找所有需要修复的文件
grep -r "cacheManager\.set.*\*.*1000" src/
```

---

## 🔧 配置说明

### 环境变量配置

在 `.env` 文件中添加 Redis 配置：

```env
# Redis 模式（standalone/cluster），默认 standalone
REDIS_MODE=standalone

# 单机模式配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# 集群模式配置（如果使用集群）
# REDIS_MODE=cluster
# REDIS_CLUSTER_NODES=localhost:7000,localhost:7001,localhost:7002
# REDIS_CLUSTER_PASSWORD=cluster-password
```

### 缓存配置选项

| 选项  | 说明               | 默认值      | 注意                    |
| ----- | ------------------ | ----------- | ----------------------- |
| `ttl` | 默认缓存时间（秒） | 60 (1 分钟) | cache-manager v7 使用秒 |
| `max` | 最大缓存条目数     | -           | Redis 不支持此选项      |

### TTL 转换说明

**重要**: cache-manager v7 的 TTL 使用**秒**为单位，而不是毫秒。

如果代码中使用了毫秒，需要转换：

```typescript
// ❌ 错误：使用毫秒
await this.cacheManager.set(key, value, 5 * 60 * 1000); // 5 分钟

// ✅ 正确：使用秒
await this.cacheManager.set(key, value, 5 * 60); // 5 分钟
```

---

## 📊 性能优势

### 内存缓存 vs Redis 缓存

| 特性         | 内存缓存       | Redis 缓存   |
| ------------ | -------------- | ------------ |
| 分布式支持   | ❌             | ✅           |
| 持久化       | ❌             | ✅           |
| 多实例共享   | ❌             | ✅           |
| 内存限制     | 受应用内存限制 | 独立内存空间 |
| 重启数据丢失 | ✅             | ❌（可配置） |

### 预期性能提升

1. **分布式缓存**: 多个应用实例共享缓存，减少重复查询
2. **缓存持久化**: 应用重启后缓存数据保留
3. **更好的扩展性**: Redis 可以独立扩展，不受应用内存限制

---

## ⚠️ 注意事项

### 1. 序列化/反序列化

- Redis 只能存储字符串，需要序列化对象
- 当前实现使用 JSON 序列化
- 复杂对象可能需要自定义序列化器

### 2. 错误处理

- Redis 连接失败时的降级策略
- 缓存操作失败时的处理
- 建议添加重试机制

### 3. 缓存键命名

- 使用有意义的缓存键前缀
- 避免键冲突
- 建议格式：`{module}:{tenantId}:{key}`

### 4. TTL 管理

- Redis 的 TTL 以秒为单位
- cache-manager 的 TTL 以毫秒为单位
- 需要正确转换

---

## 🧪 测试建议

### 1. 单元测试

- 测试 RedisCacheStore 的所有方法
- 测试序列化/反序列化
- 测试错误处理

### 2. 集成测试

- 测试缓存读写操作
- 测试 TTL 过期
- 测试并发访问

### 3. 性能测试

- 对比内存缓存和 Redis 缓存的性能
- 测试高并发场景
- 测试缓存命中率

---

## 📝 迁移检查清单

### 准备阶段

- [ ] 安装 `@hl8/redis` 依赖：`pnpm add @hl8/redis`
- [ ] 配置 Redis 环境变量（`.env` 文件）
- [ ] 确保 Redis 服务运行正常

### 实现阶段

- [ ] 创建 `src/infrastructure/cache/redis-cache.store.ts`
- [ ] 创建 `src/infrastructure/cache/redis-cache.factory.ts`
- [ ] 更新 `src/app.module.ts` 配置
- [ ] 在 `src/main.ts` 中初始化 Redis
- [ ] 添加应用关闭时的清理逻辑

### 代码修复阶段

- [ ] **修复 TTL 单位**（重要！）
  - [ ] `permissions.service.ts`: 所有 `* 1000` 改为秒
  - [ ] `user-read.repository.ts`: 修复 TTL 单位
  - [ ] 检查其他使用缓存的地方

### 测试验证阶段

- [ ] 运行单元测试
- [ ] 运行集成测试
- [ ] 验证缓存读写功能
- [ ] 验证 TTL 过期功能
- [ ] 性能测试和监控

### 部署阶段

- [ ] 更新生产环境配置
- [ ] 监控 Redis 连接状态
- [ ] 监控缓存命中率
- [ ] 准备回滚方案

---

## 🎉 总结

### 可行性结论

**✅ 完全可行** - 可以使用 `@hl8/redis` 实现 Redis 缓存集成

### 核心优势

1. ✅ **复用现有库**: 使用项目内部的 `@hl8/redis` 库（评分 9.2/10，生产就绪）
2. ✅ **架构一致**: 符合项目架构设计，保持技术栈统一
3. ✅ **功能完整**: 支持所有 cache-manager 功能
4. ✅ **易于维护**: 统一的 Redis 连接管理
5. ✅ **性能提升**: 分布式缓存和持久化支持
6. ✅ **代码质量**: `@hl8/redis` 库有完整的测试和文档

### 实施要点

1. ⚠️ **TTL 单位转换**: cache-manager v7 使用秒，需要修复所有缓存设置代码（7 处）
2. ⚠️ **Redis 初始化**: 确保在应用启动时初始化 Redis
3. ⚠️ **错误处理**: 添加 Redis 连接失败时的降级策略
4. ⚠️ **序列化**: 复杂对象需要正确序列化/反序列化

### 推荐方案

**✅ 强烈推荐使用 `@hl8/redis` 自定义 Cache Store**

**理由**:

- 符合项目架构原则（使用内部库）
- `@hl8/redis` 库质量优秀，生产就绪
- 统一的 Redis 连接管理
- 更好的控制和定制能力

### 预期收益

- **分布式缓存**: 多个应用实例共享缓存
- **缓存持久化**: 应用重启后缓存数据保留
- **更好的扩展性**: Redis 可以独立扩展
- **性能提升**: 减少数据库查询，提升响应速度

---

**文档维护**: 开发团队  
**最后更新**: 2024年  
**相关文档**:

- `@hl8/redis` 库评价报告: `libs/redis/EVALUATION_REPORT.md`
- 性能优化文档: `docs/PERFORMANCE_OPTIMIZATION.md`
