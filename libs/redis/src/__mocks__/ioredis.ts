// Mock ioredis for testing
import { jest } from '@jest/globals';

/**
 * Mock Redis 客户端方法
 */
const mockRedisClient = {
  on: jest.fn<any>(),
  quit: jest.fn<any>(),
  set: jest.fn<any>(),
  get: jest.fn<any>(),
  smembers: jest.fn<any>(),
  hgetall: jest.fn<any>(),
  hset: jest.fn<any>(),
  hdel: jest.fn<any>(),
  ping: jest.fn<any>(),
};

/**
 * Mock Redis 类
 */
const MockRedis = jest.fn<any>().mockImplementation((options?: any) => {
  return mockRedisClient;
});

/**
 * Mock Redis.Cluster 类
 */
const MockCluster = jest
  .fn<any>()
  .mockImplementation((nodes: any[], options?: any) => {
    return mockRedisClient;
  });

// 将 Cluster 附加到 Redis 类
MockRedis.Cluster = MockCluster;

export default MockRedis;
export { MockCluster, mockRedisClient };
