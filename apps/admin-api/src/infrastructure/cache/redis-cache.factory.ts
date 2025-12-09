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
