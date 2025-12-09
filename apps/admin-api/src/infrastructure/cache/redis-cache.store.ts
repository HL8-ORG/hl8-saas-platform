import { RedisUtility } from '@hl8/redis';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Cache Manager Store 接口
 *
 * cache-manager v7 的 Store 接口定义。
 */
type CacheManagerStore = {
  name: string;
  isCacheable?: (value: unknown) => boolean;
  get(key: string): Promise<any>;
  mget(...keys: string[]): Promise<unknown[]>;
  set(key: string, value: any, ttl?: number): Promise<any>;
  mset(data: Record<string, any>, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  mdel(...keys: string[]): Promise<void>;
  ttl(key: string, ttl?: number): Promise<number>;
  keys(): Promise<string[]>;
  reset?(): Promise<void>;
  on?(event: string, listener: (...arguments_: any[]) => void): void;
  disconnect?(): Promise<void>;
};

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
 * @implements {CacheManagerStore}
 * @description Redis 缓存存储实现
 */
@Injectable()
export class RedisCacheStore implements CacheManagerStore {
  private readonly logger = new Logger(RedisCacheStore.name);

  /**
   * Store 名称
   *
   * cache-manager 要求的 store 名称。
   */
  name = 'redis';

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
   * cache-manager v7 的 mset 方法签名：mset(data: Record<string, any>, ttl?: number)
   *
   * @param data - 键值对对象
   * @param ttl - 过期时间（秒）
   * @returns 设置结果
   */
  async mset(data: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const redis = RedisUtility.instance;
      const pipeline = redis.pipeline();

      for (const [key, value] of Object.entries(data)) {
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
   * 批量删除缓存
   *
   * @param keys - 缓存键数组
   * @returns 删除结果
   */
  async mdel(...keys: string[]): Promise<void> {
    try {
      const redis = RedisUtility.instance;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`批量删除缓存失败`, error);
      throw error;
    }
  }

  /**
   * 获取缓存键列表
   *
   * **性能警告**: 在生产环境中，避免使用 `keys` 命令，考虑使用 `scan`。
   *
   * cache-manager v7 的 keys 方法无参数。
   *
   * @returns 缓存键数组
   */
  async keys(): Promise<string[]> {
    try {
      const redis = RedisUtility.instance;
      return await redis.keys('*');
    } catch (error) {
      this.logger.error(`获取缓存键列表失败`, error);
      return [];
    }
  }

  /**
   * 获取或设置缓存 TTL
   *
   * cache-manager v7 的 ttl 方法签名：ttl(key: string, ttl?: number)
   * - 如果只提供 key，返回当前 TTL
   * - 如果提供 key 和 ttl，设置新的 TTL
   *
   * @param key - 缓存键
   * @param ttl - 新的 TTL（秒，可选）
   * @returns TTL（秒），-1 表示永不过期，-2 表示不存在
   */
  async ttl(key: string, ttl?: number): Promise<number> {
    try {
      const redis = RedisUtility.instance;
      if (ttl !== undefined) {
        // 设置新的 TTL
        await redis.expire(key, ttl);
        return ttl;
      } else {
        // 获取当前 TTL
        return await redis.ttl(key);
      }
    } catch (error) {
      this.logger.error(`获取/设置缓存 TTL 失败: ${key}`, error);
      return -2; // 表示不存在
    }
  }

  /**
   * 断开连接
   *
   * 清理 Redis 连接资源。
   *
   * @returns 断开连接结果
   */
  async disconnect(): Promise<void> {
    // Redis 连接由 RedisUtility 统一管理，这里不需要额外操作
    this.logger.log('Redis Cache Store 断开连接');
  }
}
