import { Logger } from '@nestjs/common';
import { Cluster, Redis } from 'ioredis';

import { RedisConfig } from '@hl8/config';

/**
 * Redis 工具类
 *
 * @description 提供 Redis 客户端的单例访问，支持单机模式和集群模式
 * 实现了并发安全的单例模式，支持连接状态监听和资源清理
 *
 * @example
 * ```typescript
 * // 推荐使用方式：异步初始化
 * const redis = await RedisUtility.client();
 * await redis.set('key', 'value');
 *
 * // 同步访问（需要确保已初始化）
 * const redis = RedisUtility.instance;
 * await redis.get('key');
 * ```
 *
 * @note 使用 `instance` 访问器前，必须确保已调用 `client()` 方法完成初始化
 * @note 在应用关闭时，建议调用 `close()` 方法清理资源
 */
export class RedisUtility {
  /**
   * 获取 Redis 实例
   *
   * @description 获取当前 Redis 客户端实例（单机或集群）
   * 如果实例未初始化，会抛出错误提示需要先调用 `client()` 方法
   *
   * @returns 返回 Redis 或 Cluster 实例
   *
   * @throws {Error} 如果实例未初始化，抛出错误
   *
   * @example
   * ```typescript
   * // 确保已初始化
   * await RedisUtility.client();
   * const redis = RedisUtility.instance;
   * await redis.get('key');
   * ```
   */
  static get instance(): Redis | Cluster {
    if (!this._instance) {
      throw new Error(
        'Redis 实例未初始化。请先调用 RedisUtility.client() 方法完成初始化。',
      );
    }
    return this._instance;
  }

  /** Redis 客户端实例（私有） */
  private static _instance: Redis | Cluster | null = null;

  /** 初始化 Promise（用于防止并发初始化） */
  private static initializing: Promise<Redis | Cluster> | null = null;

  /** 是否已关闭连接 */
  private static isClosed = false;

  /**
   * 验证 Redis 配置
   *
   * @description 验证 Redis 配置的完整性和有效性
   *
   * @param config - Redis 配置对象
   * @throws {Error} 如果配置无效，抛出错误
   *
   * @internal 此方法为私有方法，仅供内部使用
   */
  private static validateConfig(
    config: Awaited<ReturnType<typeof RedisConfig>>,
  ): void {
    if (!config) {
      throw new Error('Redis 配置不能为空');
    }

    if (config.mode === 'cluster') {
      if (!config.cluster || config.cluster.length === 0) {
        throw new Error('集群模式需要配置至少一个集群节点');
      }

      for (const node of config.cluster) {
        if (!node.host) {
          throw new Error('集群节点主机地址不能为空');
        }
        if (!node.port || node.port <= 0 || node.port > 65535) {
          throw new Error(`集群节点端口无效: ${node.port}`);
        }
      }
    } else {
      if (!config.standalone) {
        throw new Error('单机模式需要配置 standalone 配置项');
      }
      if (!config.standalone.host) {
        throw new Error('Redis 主机地址不能为空');
      }
      if (
        !config.standalone.port ||
        config.standalone.port <= 0 ||
        config.standalone.port > 65535
      ) {
        throw new Error(`Redis 端口无效: ${config.standalone.port}`);
      }
      if (
        config.standalone.db !== undefined &&
        (config.standalone.db < 0 || config.standalone.db > 15)
      ) {
        throw new Error(
          `Redis 数据库编号无效: ${config.standalone.db}（有效范围：0-15）`,
        );
      }
    }
  }

  /**
   * 设置连接事件监听
   *
   * @description 为 Redis 客户端设置连接事件监听，记录连接状态变化
   *
   * @param client - Redis 客户端实例
   *
   * @internal 此方法为私有方法，仅供内部使用
   */
  private static setupEventListeners(client: Redis | Cluster): void {
    const logger = new Logger('RedisUtility');

    client.on('connect', () => {
      logger.log('Redis 连接已建立');
    });

    client.on('ready', () => {
      logger.log('Redis 客户端已就绪');
    });

    client.on('error', (error: Error) => {
      logger.error(
        `Redis 连接错误: ${error.message}`,
        error.stack,
        'RedisUtility',
      );
    });

    client.on('close', () => {
      logger.warn('Redis 连接已关闭');
    });

    client.on('reconnecting', (delay: number) => {
      logger.log(`Redis 正在重连，延迟: ${delay}ms`);
    });

    client.on('end', () => {
      logger.log('Redis 连接已结束');
    });
  }

  /**
   * 创建 Redis 实例
   *
   * @description 根据配置创建 Redis 客户端实例，支持单机模式和集群模式
   * 包含配置验证、错误处理和连接事件监听
   *
   * @returns 返回创建的 Redis 或 Cluster 实例
   *
   * @throws {Error} 如果配置无效或创建失败，抛出错误
   *
   * @internal 此方法为私有方法，仅供内部使用
   */
  private static async createInstance(): Promise<Redis | Cluster> {
    try {
      const config = await RedisConfig();

      // 验证配置
      this.validateConfig(config);

      let client: Redis | Cluster;

      if (config.mode === 'cluster') {
        if (config.cluster.length === 0) {
          throw new Error('集群模式需要配置至少一个集群节点');
        }

        client = new Redis.Cluster(
          config.cluster.map((node) => ({
            host: node.host,
            port: node.port,
            password: node.password,
          })),
          {
            redisOptions: {
              password: config.cluster[0]?.password,
              db: config.standalone?.db ?? 0,
            },
          },
        );
      } else {
        client = new Redis({
          host: config.standalone.host,
          port: config.standalone.port,
          password: config.standalone.password,
          db: config.standalone.db ?? 0,
        });
      }

      // 设置事件监听
      this.setupEventListeners(client);

      return client;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`创建 Redis 客户端失败: ${errorMessage}`);
    }
  }

  /**
   * 获取 Redis 客户端
   *
   * @description 获取 Redis 客户端实例，如果不存在则创建，支持并发安全
   * 如果连接已关闭，会重新创建连接
   *
   * @returns 返回 Redis 或 Cluster 实例的 Promise
   *
   * @throws {Error} 如果创建失败，抛出错误
   *
   * @example
   * ```typescript
   * // 基本使用
   * const redis = await RedisUtility.client();
   * await redis.set('key', 'value');
   *
   * // 在应用启动时初始化
   * async function bootstrap() {
   *   await RedisUtility.client();
   *   // ... 其他初始化代码
   * }
   * ```
   */
  public static async client(): Promise<Redis | Cluster> {
    // 如果已关闭，重置状态
    if (this.isClosed) {
      this._instance = null;
      this.isClosed = false;
    }

    if (!this._instance) {
      if (!this.initializing) {
        this.initializing = this.createInstance();
      }
      try {
        this._instance = await this.initializing;
        this.initializing = null;
      } catch (error) {
        this.initializing = null;
        throw error;
      }
    }
    return this._instance;
  }

  /**
   * 关闭 Redis 连接
   *
   * @description 关闭 Redis 客户端连接并清理资源
   * 在应用关闭时调用此方法可以确保资源正确释放
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * // 在应用关闭时调用
   * async function shutdown() {
   *   await RedisUtility.close();
   *   // ... 其他清理代码
   * }
   * ```
   */
  public static async close(): Promise<void> {
    if (this._instance) {
      try {
        await this._instance.quit();
        const logger = new Logger('RedisUtility');
        logger.log('Redis 连接已关闭');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        const logger = new Logger('RedisUtility');
        logger.error(
          `关闭 Redis 连接失败: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
          'RedisUtility',
        );
      } finally {
        this._instance = null;
        this.isClosed = true;
      }
    }
  }

  /**
   * 检查 Redis 连接状态
   *
   * @description 检查 Redis 客户端是否已初始化且连接正常
   *
   * @returns 如果连接正常返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * if (RedisUtility.isConnected()) {
   *   const redis = RedisUtility.instance;
   *   await redis.ping();
   * }
   * ```
   */
  public static isConnected(): boolean {
    return this._instance !== null && !this.isClosed;
  }
}
