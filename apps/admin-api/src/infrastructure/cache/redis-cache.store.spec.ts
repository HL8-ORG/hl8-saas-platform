import { RedisUtility } from '@hl8/redis';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheStore } from './redis-cache.store';

// Mock RedisUtility
jest.mock('@hl8/redis', () => ({
  RedisUtility: {
    instance: {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
      expire: jest.fn(),
      flushdb: jest.fn(),
      pipeline: jest.fn(() => ({
        setex: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      })),
    },
    isConnected: jest.fn(() => true),
  },
}));

/**
 * Redis Cache Store 单元测试
 *
 * 测试 Redis Cache Store 的所有功能。
 *
 * @describe RedisCacheStore
 */
describe('RedisCacheStore', () => {
  let store: RedisCacheStore;
  let redisInstance: jest.Mocked<typeof RedisUtility.instance>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisCacheStore],
    }).compile();

    store = module.get<RedisCacheStore>(RedisCacheStore);
    redisInstance = RedisUtility.instance as jest.Mocked<
      typeof RedisUtility.instance
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(store).toBeDefined();
  });

  it('应该有正确的名称', () => {
    expect(store.name).toBe('redis');
  });

  describe('get', () => {
    it('应该获取缓存值', async () => {
      const key = 'test-key';
      const value = JSON.stringify({ data: 'test' });

      redisInstance.get.mockResolvedValue(value);

      const result = await store.get(key);

      expect(redisInstance.get).toHaveBeenCalledWith(key);
      expect(result).toEqual({ data: 'test' });
    });

    it('应该返回 undefined 当键不存在时', async () => {
      const key = 'non-existent-key';

      redisInstance.get.mockResolvedValue(null);

      const result = await store.get(key);

      expect(result).toBeUndefined();
    });

    it('应该处理非 JSON 字符串值', async () => {
      const key = 'string-key';
      const value = 'plain-string';

      redisInstance.get.mockResolvedValue(value);

      const result = await store.get(key);

      expect(result).toBe(value);
    });

    it('应该处理错误并返回 undefined', async () => {
      const key = 'error-key';

      redisInstance.get.mockRejectedValue(new Error('Redis error'));

      const result = await store.get(key);

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('应该设置缓存值（无 TTL）', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      redisInstance.set.mockResolvedValue('OK');

      await store.set(key, value);

      expect(redisInstance.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
      );
    });

    it('应该设置缓存值（有 TTL）', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 60;

      redisInstance.setex.mockResolvedValue('OK');

      await store.set(key, value, ttl);

      expect(redisInstance.setex).toHaveBeenCalledWith(
        key,
        ttl,
        JSON.stringify(value),
      );
    });

    it('应该处理字符串值', async () => {
      const key = 'string-key';
      const value = 'plain-string';

      redisInstance.set.mockResolvedValue('OK');

      await store.set(key, value);

      expect(redisInstance.set).toHaveBeenCalledWith(key, value);
    });

    it('应该处理错误', async () => {
      const key = 'error-key';
      const value = { data: 'test' };

      redisInstance.set.mockRejectedValue(new Error('Redis error'));

      await expect(store.set(key, value)).rejects.toThrow('Redis error');
    });
  });

  describe('del', () => {
    it('应该删除缓存键', async () => {
      const key = 'test-key';

      redisInstance.del.mockResolvedValue(1);

      await store.del(key);

      expect(redisInstance.del).toHaveBeenCalledWith(key);
    });

    it('应该处理错误', async () => {
      const key = 'error-key';

      redisInstance.del.mockRejectedValue(new Error('Redis error'));

      await expect(store.del(key)).rejects.toThrow('Redis error');
    });
  });

  describe('mget', () => {
    it('应该批量获取缓存值', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = [
        JSON.stringify({ data: 'value1' }),
        JSON.stringify({ data: 'value2' }),
        null,
      ];

      redisInstance.mget.mockResolvedValue(values);

      const result = await store.mget(...keys);

      expect(redisInstance.mget).toHaveBeenCalledWith(...keys);
      expect(result).toEqual([
        { data: 'value1' },
        { data: 'value2' },
        undefined,
      ]);
    });

    it('应该处理错误并返回 undefined 数组', async () => {
      const keys = ['key1', 'key2'];

      redisInstance.mget.mockRejectedValue(new Error('Redis error'));

      const result = await store.mget(...keys);

      expect(result).toEqual([undefined, undefined]);
    });
  });

  describe('mset', () => {
    it('应该批量设置缓存值（无 TTL）', async () => {
      const data = {
        key1: { data: 'value1' },
        key2: { data: 'value2' },
      };
      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['OK'], ['OK']]),
      };

      redisInstance.pipeline.mockReturnValue(mockPipeline as any);

      await store.mset(Object.entries(data));

      expect(redisInstance.pipeline).toHaveBeenCalled();
      expect(mockPipeline.set).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('应该批量设置缓存值（有 TTL）', async () => {
      const data = {
        key1: { data: 'value1' },
        key2: { data: 'value2' },
      };
      const ttl = 60;
      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['OK'], ['OK']]),
      };

      redisInstance.pipeline.mockReturnValue(mockPipeline as any);

      await store.mset(Object.entries(data), ttl);

      expect(mockPipeline.setex).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('mdel', () => {
    it('应该批量删除缓存键', async () => {
      const keys = ['key1', 'key2', 'key3'];

      redisInstance.del.mockResolvedValue(3);

      await store.mdel(...keys);

      expect(redisInstance.del).toHaveBeenCalledWith(...keys);
    });

    it('应该处理空键数组', async () => {
      await store.mdel();

      expect(redisInstance.del).not.toHaveBeenCalled();
    });
  });

  describe('keys', () => {
    it('应该获取所有缓存键', async () => {
      const keys = ['key1', 'key2', 'key3'];

      redisInstance.keys.mockResolvedValue(keys);

      const result = await store.keys();

      expect(redisInstance.keys).toHaveBeenCalledWith('*');
      expect(result).toEqual(keys);
    });

    it('应该处理错误并返回空数组', async () => {
      redisInstance.keys.mockRejectedValue(new Error('Redis error'));

      const result = await store.keys();

      expect(result).toEqual([]);
    });
  });

  describe('ttl', () => {
    it('应该获取缓存 TTL', async () => {
      const key = 'test-key';
      const ttl = 3600;

      redisInstance.ttl.mockResolvedValue(ttl);

      const result = await store.ttl(key);

      expect(redisInstance.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(ttl);
    });

    it('应该设置缓存 TTL', async () => {
      const key = 'test-key';
      const ttl = 3600;

      redisInstance.expire.mockResolvedValue(1);
      redisInstance.ttl.mockResolvedValue(ttl);

      const result = await store.ttl(key, ttl);

      expect(redisInstance.expire).toHaveBeenCalledWith(key, ttl);
      expect(result).toBe(ttl);
    });

    it('应该处理错误并返回 -2', async () => {
      const key = 'error-key';

      redisInstance.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await store.ttl(key);

      expect(result).toBe(-2);
    });
  });

  describe('reset', () => {
    it('应该清空所有缓存', async () => {
      redisInstance.flushdb.mockResolvedValue('OK');

      await store.reset();

      expect(redisInstance.flushdb).toHaveBeenCalled();
    });

    it('应该处理错误', async () => {
      redisInstance.flushdb.mockRejectedValue(new Error('Redis error'));

      await expect(store.reset()).rejects.toThrow('Redis error');
    });
  });

  describe('disconnect', () => {
    it('应该断开连接', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      await store.disconnect();

      expect(loggerSpy).toHaveBeenCalledWith('Redis Cache Store 断开连接');
    });
  });
});
