import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { IRedisConfig, RedisConfig, redisRegToken } from './redis.config.js';

describe('RedisConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除测试相关的环境变量
    delete process.env.REDIS_MODE;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_DB;
    delete process.env.REDIS_CLUSTER_NODES;
    delete process.env.REDIS_CLUSTER_PASSWORD;
    delete process.env.REDIS_SENTINELS;
    delete process.env.REDIS_SENTINEL_MASTER_NAME;
    delete process.env.REDIS_SENTINEL_PASSWORD;
    delete process.env.REDIS_SENTINEL_DB;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('配置注册', () => {
    it('应该正确注册配置令牌', () => {
      expect(redisRegToken).toBe('redis');
    });

    it('应该返回配置工厂函数', () => {
      expect(typeof RedisConfig).toBe('function');
    });
  });

  describe('默认值 - standalone 模式', () => {
    it('当所有环境变量未设置时应使用默认值', () => {
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('standalone');
      expect(config.standalone.host).toBe('localhost');
      expect(config.standalone.port).toBe(26379);
      expect(config.standalone.password).toBe('123456');
      expect(config.standalone.db).toBe(5);
      expect(config.cluster).toEqual([]);
      expect(config.sentinel.sentinels).toEqual([]);
      expect(config.sentinel.name).toBe('master');
      expect(config.sentinel.password).toBe('');
      expect(config.sentinel.db).toBe(5);
    });
  });

  describe('REDIS_MODE', () => {
    it('当 REDIS_MODE 设置为 "standalone" 时应使用该值', () => {
      process.env.REDIS_MODE = 'standalone';
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('standalone');
    });

    it('当 REDIS_MODE 设置为 "cluster" 时应使用该值', () => {
      process.env.REDIS_MODE = 'cluster';
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('cluster');
    });

    it('当 REDIS_MODE 设置为 "sentinel" 时应使用该值', () => {
      process.env.REDIS_MODE = 'sentinel';
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('sentinel');
    });

    it('当 REDIS_MODE 未设置时应使用默认值 "standalone"', () => {
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('standalone');
    });
  });

  describe('standalone 配置', () => {
    describe('REDIS_HOST', () => {
      it('当 REDIS_HOST 设置时应使用该值', () => {
        process.env.REDIS_HOST = 'redis.example.com';
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.host).toBe('redis.example.com');
      });

      it('当 REDIS_HOST 未设置时应使用默认值', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.host).toBe('localhost');
      });
    });

    describe('REDIS_PORT', () => {
      it('当 REDIS_PORT 设置为有效数字时应使用该值', () => {
        process.env.REDIS_PORT = '6379';
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.port).toBe(6379);
      });

      it('当 REDIS_PORT 设置为无效数字时应使用默认值', () => {
        process.env.REDIS_PORT = 'invalid';
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.port).toBe(26379);
      });

      it('当 REDIS_PORT 未设置时应使用默认值 26379', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.port).toBe(26379);
      });
    });

    describe('REDIS_PASSWORD', () => {
      it('当 REDIS_PASSWORD 设置时应使用该值', () => {
        process.env.REDIS_PASSWORD = 'custom-password';
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.password).toBe('custom-password');
      });

      it('当 REDIS_PASSWORD 未设置时应使用默认值', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.password).toBe('123456');
      });
    });

    describe('REDIS_DB', () => {
      it('当 REDIS_DB 设置为有效数字时应使用该值', () => {
        process.env.REDIS_DB = '0';
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.db).toBe(0);
      });

      it('当 REDIS_DB 设置为无效数字时应使用默认值', () => {
        process.env.REDIS_DB = 'invalid';
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.db).toBe(5);
      });

      it('当 REDIS_DB 未设置时应使用默认值 5', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.standalone.db).toBe(5);
      });
    });
  });

  describe('cluster 配置', () => {
    it('当 REDIS_CLUSTER_NODES 未设置时应返回空数组', () => {
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster).toEqual([]);
    });

    it('当 REDIS_CLUSTER_NODES 设置为单个节点时应正确解析', () => {
      process.env.REDIS_CLUSTER_NODES = 'redis1.example.com:6379';
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster).toHaveLength(1);
      expect(config.cluster[0]).toEqual({
        host: 'redis1.example.com',
        port: 6379,
        password: '',
      });
    });

    it('当 REDIS_CLUSTER_NODES 设置为多个节点时应正确解析', () => {
      process.env.REDIS_CLUSTER_NODES =
        'redis1.example.com:6379,redis2.example.com:6380,redis3.example.com:6381';
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster).toHaveLength(3);
      expect(config.cluster[0]).toEqual({
        host: 'redis1.example.com',
        port: 6379,
        password: '',
      });
      expect(config.cluster[1]).toEqual({
        host: 'redis2.example.com',
        port: 6380,
        password: '',
      });
      expect(config.cluster[2]).toEqual({
        host: 'redis3.example.com',
        port: 6381,
        password: '',
      });
    });

    it('当 REDIS_CLUSTER_PASSWORD 设置时应应用到所有节点', () => {
      process.env.REDIS_CLUSTER_NODES =
        'redis1.example.com:6379,redis2.example.com:6380';
      process.env.REDIS_CLUSTER_PASSWORD = 'cluster-password';
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster).toHaveLength(2);
      expect(config.cluster[0].password).toBe('cluster-password');
      expect(config.cluster[1].password).toBe('cluster-password');
    });

    it('当 REDIS_CLUSTER_PASSWORD 未设置时密码应为空字符串', () => {
      process.env.REDIS_CLUSTER_NODES = 'redis1.example.com:6379';
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster[0].password).toBe('');
    });

    // 注意：改进后的代码会使用默认端口（6379）而不是返回 NaN
    it('当节点格式错误时（缺少端口）应使用默认端口', () => {
      process.env.REDIS_CLUSTER_NODES = 'redis1.example.com';
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster[0].host).toBe('redis1.example.com');
      expect(config.cluster[0].port).toBe(6379); // 使用默认端口
    });

    it('当节点格式完全无效时应被过滤掉', () => {
      process.env.REDIS_CLUSTER_NODES = '';
      const config = RedisConfig() as IRedisConfig;
      expect(config.cluster).toHaveLength(0);
    });
  });

  describe('sentinel 配置', () => {
    describe('REDIS_SENTINELS', () => {
      it('当 REDIS_SENTINELS 未设置时应返回空数组', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.sentinels).toEqual([]);
      });

      it('当 REDIS_SENTINELS 设置为单个节点时应正确解析', () => {
        process.env.REDIS_SENTINELS = 'sentinel1.example.com:26379';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.sentinels).toHaveLength(1);
        expect(config.sentinel.sentinels[0]).toEqual({
          host: 'sentinel1.example.com',
          port: 26379,
        });
      });

      it('当 REDIS_SENTINELS 设置为多个节点时应正确解析', () => {
        process.env.REDIS_SENTINELS =
          'sentinel1.example.com:26379,sentinel2.example.com:26380,sentinel3.example.com:26381';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.sentinels).toHaveLength(3);
        expect(config.sentinel.sentinels[0]).toEqual({
          host: 'sentinel1.example.com',
          port: 26379,
        });
        expect(config.sentinel.sentinels[1]).toEqual({
          host: 'sentinel2.example.com',
          port: 26380,
        });
        expect(config.sentinel.sentinels[2]).toEqual({
          host: 'sentinel3.example.com',
          port: 26381,
        });
      });

      // 注意：改进后的代码会使用默认端口（6379）而不是返回 NaN
      it('当节点格式错误时（缺少端口）应使用默认端口', () => {
        process.env.REDIS_SENTINELS = 'sentinel1.example.com';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.sentinels[0].host).toBe('sentinel1.example.com');
        expect(config.sentinel.sentinels[0].port).toBe(6379); // 使用默认端口
      });

      it('当节点格式完全无效时应被过滤掉', () => {
        process.env.REDIS_SENTINELS = '';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.sentinels).toHaveLength(0);
      });
    });

    describe('REDIS_SENTINEL_MASTER_NAME', () => {
      it('当 REDIS_SENTINEL_MASTER_NAME 设置时应使用该值', () => {
        process.env.REDIS_SENTINEL_MASTER_NAME = 'my-master';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.name).toBe('my-master');
      });

      it('当 REDIS_SENTINEL_MASTER_NAME 未设置时应使用默认值', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.name).toBe('master');
      });
    });

    describe('REDIS_SENTINEL_PASSWORD', () => {
      it('当 REDIS_SENTINEL_PASSWORD 设置时应使用该值', () => {
        process.env.REDIS_SENTINEL_PASSWORD = 'sentinel-password';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.password).toBe('sentinel-password');
      });

      it('当 REDIS_SENTINEL_PASSWORD 未设置时应使用默认值空字符串', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.password).toBe('');
      });
    });

    describe('REDIS_SENTINEL_DB', () => {
      it('当 REDIS_SENTINEL_DB 设置为有效数字时应使用该值', () => {
        process.env.REDIS_SENTINEL_DB = '0';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.db).toBe(0);
      });

      it('当 REDIS_SENTINEL_DB 设置为无效数字时应使用默认值', () => {
        process.env.REDIS_SENTINEL_DB = 'invalid';
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.db).toBe(5);
      });

      it('当 REDIS_SENTINEL_DB 未设置时应使用默认值 5', () => {
        const config = RedisConfig() as IRedisConfig;
        expect(config.sentinel.db).toBe(5);
      });
    });
  });

  describe('配置对象完整性', () => {
    it('配置对象应包含所有必需的属性', () => {
      const config = RedisConfig() as IRedisConfig;
      expect(config).toHaveProperty('mode');
      expect(config).toHaveProperty('standalone');
      expect(config).toHaveProperty('cluster');
      expect(config).toHaveProperty('sentinel');
      expect(config.standalone).toHaveProperty('host');
      expect(config.standalone).toHaveProperty('port');
      expect(config.standalone).toHaveProperty('password');
      expect(config.standalone).toHaveProperty('db');
      expect(config.sentinel).toHaveProperty('sentinels');
      expect(config.sentinel).toHaveProperty('name');
      expect(config.sentinel).toHaveProperty('password');
      expect(config.sentinel).toHaveProperty('db');
    });

    it('配置对象属性类型应正确', () => {
      const config = RedisConfig() as IRedisConfig;
      expect(typeof config.mode).toBe('string');
      expect(typeof config.standalone.host).toBe('string');
      expect(typeof config.standalone.port).toBe('number');
      expect(typeof config.standalone.password).toBe('string');
      expect(typeof config.standalone.db).toBe('number');
      expect(Array.isArray(config.cluster)).toBe(true);
      expect(Array.isArray(config.sentinel.sentinels)).toBe(true);
      expect(typeof config.sentinel.name).toBe('string');
      expect(typeof config.sentinel.password).toBe('string');
      expect(typeof config.sentinel.db).toBe('number');
    });
  });

  describe('组合场景', () => {
    it('standalone 模式：当所有 standalone 环境变量都设置时应使用所有设置的值', () => {
      process.env.REDIS_MODE = 'standalone';
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6379';
      process.env.REDIS_PASSWORD = 'password123';
      process.env.REDIS_DB = '0';
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('standalone');
      expect(config.standalone.host).toBe('redis.example.com');
      expect(config.standalone.port).toBe(6379);
      expect(config.standalone.password).toBe('password123');
      expect(config.standalone.db).toBe(0);
    });

    it('cluster 模式：当所有 cluster 环境变量都设置时应使用所有设置的值', () => {
      process.env.REDIS_MODE = 'cluster';
      process.env.REDIS_CLUSTER_NODES =
        'redis1.example.com:6379,redis2.example.com:6380';
      process.env.REDIS_CLUSTER_PASSWORD = 'cluster-password';
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('cluster');
      expect(config.cluster).toHaveLength(2);
      expect(config.cluster[0].password).toBe('cluster-password');
      expect(config.cluster[1].password).toBe('cluster-password');
    });

    it('sentinel 模式：当所有 sentinel 环境变量都设置时应使用所有设置的值', () => {
      process.env.REDIS_MODE = 'sentinel';
      process.env.REDIS_SENTINELS =
        'sentinel1.example.com:26379,sentinel2.example.com:26380';
      process.env.REDIS_SENTINEL_MASTER_NAME = 'my-master';
      process.env.REDIS_SENTINEL_PASSWORD = 'sentinel-password';
      process.env.REDIS_SENTINEL_DB = '1';
      const config = RedisConfig() as IRedisConfig;
      expect(config.mode).toBe('sentinel');
      expect(config.sentinel.sentinels).toHaveLength(2);
      expect(config.sentinel.name).toBe('my-master');
      expect(config.sentinel.password).toBe('sentinel-password');
      expect(config.sentinel.db).toBe(1);
    });

    it('混合配置：不同模式的配置应互不干扰', () => {
      // 设置所有模式的配置
      process.env.REDIS_MODE = 'standalone';
      process.env.REDIS_HOST = 'standalone-host';
      process.env.REDIS_CLUSTER_NODES = 'cluster1:6379,cluster2:6380';
      process.env.REDIS_SENTINELS = 'sentinel1:26379';
      const config = RedisConfig() as IRedisConfig;
      // 当前模式应为 standalone
      expect(config.mode).toBe('standalone');
      // standalone 配置应生效
      expect(config.standalone.host).toBe('standalone-host');
      // cluster 和 sentinel 配置也应存在（即使当前模式不是它们）
      expect(config.cluster).toHaveLength(2);
      expect(config.sentinel.sentinels).toHaveLength(1);
    });
  });
});
