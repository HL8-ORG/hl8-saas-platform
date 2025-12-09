import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  IThrottlerConfig,
  ThrottlerConfig,
  throttlerConfigToken,
} from './throttler.config.js';

describe('ThrottlerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除测试相关的环境变量
    delete process.env.THROTTLER_TTL;
    delete process.env.THROTTLER_LIMIT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('配置注册', () => {
    it('应该正确注册配置令牌', () => {
      expect(throttlerConfigToken).toBe('throttler');
    });

    it('应该返回配置工厂函数', () => {
      expect(typeof ThrottlerConfig).toBe('function');
    });
  });

  describe('默认值', () => {
    it('当所有环境变量未设置时应使用默认值', () => {
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.ttl).toBe(60000); // 1 分钟
      expect(config.limit).toBe(10);
      expect(config.errorMessage).toBe(
        "Oops! Looks like you've hit our rate limit. Please take a short break and try again shortly",
      );
    });
  });

  describe('THROTTLER_TTL', () => {
    it('当 THROTTLER_TTL 设置为有效数字时应使用该值', () => {
      process.env.THROTTLER_TTL = '30000';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.ttl).toBe(30000);
    });

    it('当 THROTTLER_TTL 设置为无效数字时应使用默认值', () => {
      process.env.THROTTLER_TTL = 'invalid';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.ttl).toBe(60000); // 默认值
    });

    it('当 THROTTLER_TTL 未设置时应使用默认值 60000', () => {
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.ttl).toBe(60000);
    });

    it('当 THROTTLER_TTL 设置为 0 时应使用该值', () => {
      process.env.THROTTLER_TTL = '0';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.ttl).toBe(0);
    });
  });

  describe('THROTTLER_LIMIT', () => {
    it('当 THROTTLER_LIMIT 设置为有效数字时应使用该值', () => {
      process.env.THROTTLER_LIMIT = '20';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.limit).toBe(20);
    });

    it('当 THROTTLER_LIMIT 设置为无效数字时应使用默认值', () => {
      process.env.THROTTLER_LIMIT = 'invalid';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.limit).toBe(10); // 默认值
    });

    it('当 THROTTLER_LIMIT 未设置时应使用默认值 10', () => {
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.limit).toBe(10);
    });

    it('当 THROTTLER_LIMIT 设置为 0 时应使用该值', () => {
      process.env.THROTTLER_LIMIT = '0';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.limit).toBe(0);
    });
  });

  describe('errorMessage', () => {
    it('错误消息应该是固定的字符串', () => {
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.errorMessage).toBe(
        "Oops! Looks like you've hit our rate limit. Please take a short break and try again shortly",
      );
    });

    it('错误消息不应受环境变量影响', () => {
      // 即使设置了环境变量，错误消息也不应该改变
      process.env.THROTTLER_TTL = '30000';
      process.env.THROTTLER_LIMIT = '20';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.errorMessage).toBe(
        "Oops! Looks like you've hit our rate limit. Please take a short break and try again shortly",
      );
    });
  });

  describe('配置对象完整性', () => {
    it('配置对象应包含所有必需的属性', () => {
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config).toHaveProperty('ttl');
      expect(config).toHaveProperty('limit');
      expect(config).toHaveProperty('errorMessage');
    });

    it('配置对象属性类型应正确', () => {
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(typeof config.ttl).toBe('number');
      expect(typeof config.limit).toBe('number');
      expect(typeof config.errorMessage).toBe('string');
    });
  });

  describe('组合场景', () => {
    it('当所有环境变量都设置时应使用所有设置的值', () => {
      process.env.THROTTLER_TTL = '30000';
      process.env.THROTTLER_LIMIT = '20';
      const config = ThrottlerConfig() as IThrottlerConfig;
      expect(config.ttl).toBe(30000);
      expect(config.limit).toBe(20);
      expect(config.errorMessage).toBe(
        "Oops! Looks like you've hit our rate limit. Please take a short break and try again shortly",
      );
    });
  });
});
