import { ConfigType, registerAs } from '@nestjs/config';

import { getEnvNumber, getEnvString } from '@hl8/utils';

/**
 * Redis 配置注册令牌
 *
 * @description 用于标识 Redis 配置的注册令牌
 */
export const redisRegToken = 'redis';

/**
 * Redis 节点信息
 *
 * @description 定义 Redis 节点的基础信息结构
 *
 * @internal 此接口用于内部类型安全，不对外导出
 */
type RedisNodeInfo = {
  /** 节点主机地址 */
  host: string;
  /** 节点端口号 */
  port: number;
};

/**
 * Redis 集群节点信息
 *
 * @description 定义 Redis 集群节点的完整信息结构
 *
 * @internal 此接口用于内部类型安全，不对外导出
 */
type RedisClusterNodeInfo = RedisNodeInfo & {
  /** 节点密码 */
  password: string;
};

/**
 * 解析 Redis 节点字符串
 *
 * @description 将 "host:port" 格式的字符串解析为节点信息对象
 * 提供类型安全的节点解析，避免 parseInt 返回 NaN 的问题
 *
 * @param nodeString - 节点字符串，格式为 "host:port"
 * @param defaultPort - 默认端口号（当端口解析失败时使用）
 * @returns 返回节点信息对象，如果解析失败则返回 null
 *
 * @example
 * ```typescript
 * const node = parseRedisNode('localhost:6379', 6379);
 * // 返回: { host: 'localhost', port: 6379 }
 * ```
 */
function parseRedisNode(
  nodeString: string,
  defaultPort: number = 6379,
): RedisNodeInfo | null {
  const parts = nodeString.split(':');
  if (parts.length < 1 || !parts[0]) {
    return null;
  }

  const host = parts[0].trim();
  let port = defaultPort;

  if (parts.length >= 2 && parts[1]) {
    const parsedPort = parseInt(parts[1].trim(), 10);
    // 类型安全检查：确保解析的端口是有效数字
    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
      port = parsedPort;
    }
  }

  return { host, port };
}

/**
 * Redis 配置
 *
 * @description 注册 Redis 配置，支持单机模式、集群模式和哨兵模式
 *
 * @returns 返回 Redis 配置对象，包含模式、单机配置、集群配置和哨兵配置
 *
 * @remarks
 * 使用类型安全的节点解析函数，避免 parseInt 返回 NaN 的问题。
 * 所有节点解析都经过验证，确保端口号在有效范围内（1-65535）。
 *
 * @example
 * 环境变量配置：
 * - REDIS_MODE: 模式（standalone/cluster/sentinel），默认 standalone
 * - REDIS_HOST: 单机模式主机地址，默认 localhost
 * - REDIS_PORT: 单机模式端口，默认 26379
 * - REDIS_PASSWORD: Redis 密码，默认 123456
 * - REDIS_DB: 数据库编号，默认 5
 * - REDIS_CLUSTER_NODES: 集群节点列表（逗号分隔，格式：host:port）
 * - REDIS_CLUSTER_PASSWORD: 集群密码
 * - REDIS_SENTINELS: 哨兵节点列表（逗号分隔，格式：host:port）
 * - REDIS_SENTINEL_MASTER_NAME: 哨兵主节点名称，默认 master
 * - REDIS_SENTINEL_PASSWORD: 哨兵密码
 * - REDIS_SENTINEL_DB: 哨兵数据库编号，默认 5
 */
export const RedisConfig = registerAs(redisRegToken, () => {
  // 解析集群节点列表
  const clusterNodes: RedisClusterNodeInfo[] = process.env.REDIS_CLUSTER_NODES
    ? process.env.REDIS_CLUSTER_NODES.split(',')
        .map((nodeString) => {
          const node = parseRedisNode(nodeString.trim());
          if (!node) {
            console.error(
              `Invalid cluster node format: ${nodeString}. Expected format: host:port`,
            );
            return null;
          }
          return {
            ...node,
            password: getEnvString('REDIS_CLUSTER_PASSWORD', ''),
          };
        })
        .filter((node): node is RedisClusterNodeInfo => node !== null)
    : [];

  // 解析哨兵节点列表
  const sentinelNodes: RedisNodeInfo[] = process.env.REDIS_SENTINELS
    ? process.env.REDIS_SENTINELS.split(',')
        .map((nodeString) => parseRedisNode(nodeString.trim()))
        .filter((node): node is RedisNodeInfo => node !== null)
    : [];

  return {
    mode: process.env.REDIS_MODE ?? 'standalone', // 'standalone', 'cluster', 'sentinel'
    standalone: {
      host: getEnvString('REDIS_HOST', 'localhost'),
      port: getEnvNumber('REDIS_PORT', 26379),
      password: getEnvString('REDIS_PASSWORD', '123456'),
      db: getEnvNumber('REDIS_DB', 5),
    },
    cluster: clusterNodes,
    sentinel: {
      sentinels: sentinelNodes,
      name: getEnvString('REDIS_SENTINEL_MASTER_NAME', 'master'),
      password: getEnvString('REDIS_SENTINEL_PASSWORD', ''),
      db: getEnvNumber('REDIS_SENTINEL_DB', 5),
    },
  };
});

/**
 * Redis 配置类型
 *
 * @description Redis 配置对象的类型定义
 */
export type IRedisConfig = ConfigType<typeof RedisConfig>;
