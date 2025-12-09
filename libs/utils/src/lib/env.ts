import * as cluster from 'node:cluster';
import * as path from 'path';

/**
 * 是否为主集群实例
 *
 * @description 判断当前进程是否为主集群实例（实例编号为 0 或未设置）
 */
export const isMainCluster =
  process.env.NODE_APP_INSTANCE === undefined ||
  Number.parseInt(process.env.NODE_APP_INSTANCE, 10) === 0;

/**
 * Cluster 模块兼容类型
 *
 * @description 定义 cluster 模块的类型接口，用于兼容不同版本的 Node.js
 * - Node.js 16+: 使用 isPrimary 属性
 * - Node.js < 16: 使用 isMaster 属性（已废弃）
 *
 * @internal 此类型用于解决 TypeScript 类型定义与运行时版本的兼容性问题
 */
interface ClusterModule {
  /** Node.js 16+ 的主进程标识 */
  isPrimary?: boolean;
  /** Node.js < 16 的主进程标识（已废弃，但需要兼容） */
  isMaster?: boolean;
}

/**
 * 是否为主进程
 *
 * @description 判断当前进程是否为主进程（集群主进程或主集群实例）
 *
 * @remarks
 * 此函数需要兼容不同版本的 Node.js：
 * - Node.js 16+ 使用 `cluster.isPrimary`
 * - Node.js < 16 使用 `cluster.isMaster`（已废弃）
 * 由于 TypeScript 类型定义可能不包含 `isMaster`，需要使用类型断言来访问
 *
 * @returns 如果当前进程为主进程则返回 true，否则返回 false
 */
export const isMainProcess =
  ((cluster as unknown as ClusterModule).isPrimary ??
    (cluster as unknown as ClusterModule).isMaster) ||
  isMainCluster;

/**
 * 是否为开发环境
 *
 * @description 判断当前运行环境是否为开发环境
 */
export const isDevEnvironment = process.env.NODE_ENV === 'development';

/**
 * 获取环境变量布尔值
 *
 * @description 从环境变量中获取布尔值，如果不存在则返回默认值
 *
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 返回布尔值
 *
 * @example
 * ```typescript
 * const enabled = getEnvBoolean('FEATURE_ENABLED', false);
 * ```
 */
export const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value !== undefined ? value === 'true' : defaultValue;
};

/**
 * 获取环境变量字符串值
 *
 * @description 从环境变量中获取字符串值，如果不存在则返回默认值
 *
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 返回字符串值
 *
 * @example
 * ```typescript
 * const host = getEnvString('DB_HOST', 'localhost');
 * ```
 */
export const getEnvString = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  return value ?? defaultValue;
};

/**
 * 获取环境变量数字值
 *
 * @description 从环境变量中获取数字值，如果不存在或解析失败则返回默认值
 *
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 返回数字值
 *
 * @example
 * ```typescript
 * const port = getEnvNumber('APP_PORT', 3000);
 * ```
 */
export const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value) {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

/**
 * 获取环境变量数组值
 *
 * @description 从环境变量中获取数组值（以逗号分隔），如果不存在则返回默认值
 *
 * @param key - 环境变量键名
 * @param defaultValue - 默认值数组
 * @returns 返回数组值
 *
 * @example
 * ```typescript
 * const origins = getEnvArray('CORS_ORIGINS', ['http://localhost:3000']);
 * ```
 */
export const getEnvArray = <T = string>(
  key: string,
  defaultValue: T[] = [],
): T[] => {
  const value = process.env[key];
  return value === undefined ? defaultValue : (value.split(',') as T[]);
};

/**
 * 获取应用名称
 *
 * @description 从主模块路径中提取应用名称
 *
 * @returns 返回应用名称，如果无法确定则返回 'base-system'
 *
 * @example
 * 如果主模块路径为 'apps/user-api/src/main.ts'，则返回 'user-api'
 */
export function getAppName(): string {
  if (!require.main) {
    return 'base-system'; // 默认值，以防无法确定
  }

  const mainPath = require.main.filename;
  const match = RegExp(/apps[/\\]([^/\\]+)/).exec(mainPath);
  return match ? match[1] : 'base-system';
}

/**
 * 获取配置文件路径
 *
 * @description 根据应用名称和运行环境获取配置文件的完整路径
 *
 * @param filename - 配置文件名
 * @returns 返回配置文件的完整路径
 *
 * @example
 * ```typescript
 * const configPath = getConfigPath('database.json');
 * // 开发环境: 'apps/base-system/src/resources/database.json'
 * // 生产环境: 'dist/resources/database.json' (从应用目录运行)
 * // 或: 'apps/base-system/dist/resources/database.json' (从根目录运行)
 * ```
 */
export function getConfigPath(filename: string): string {
  const appName = getAppName();
  const basePath = process.cwd();
  const resourcePath = path.join('src', 'resources', filename);

  if (isDevEnvironment) {
    // 开发环境：从源码目录读取
    return path.join(basePath, 'apps', appName, resourcePath);
  } else {
    // 生产环境：资源文件被复制到 dist/resources/
    // 如果从应用目录运行（如 apps/fastify-api），使用 dist/resources
    // 如果从根目录运行，使用 dist/apps/appName/src/resources
    const distResourcePath = path.join(basePath, 'dist', 'resources', filename);
    const distAppResourcePath = path.join(
      basePath,
      'dist',
      'apps',
      appName,
      resourcePath,
    );

    // 检查当前工作目录是否在应用目录内（如 apps/fastify-api）
    // 如果是，优先使用 dist/resources；否则使用 dist/apps/appName/src/resources
    const isInAppDir = basePath.endsWith(path.join('apps', appName));
    return isInAppDir ? distResourcePath : distAppResourcePath;
  }
}
