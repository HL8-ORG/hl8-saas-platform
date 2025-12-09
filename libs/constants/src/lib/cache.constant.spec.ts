import { describe, expect, it } from '@jest/globals';
import { CacheConstant } from './cache.constant';

/**
 * 缓存常量单元测试
 *
 * @description 验证所有缓存相关常量的值是否正确
 */
describe('cache.constant', () => {
  describe('CacheConstant', () => {
    it('应该是一个对象', () => {
      expect(CacheConstant).toBeInstanceOf(Object);
    });

    it('应该包含 SYSTEM、CACHE_PREFIX、AUTH_TOKEN_PREFIX 属性', () => {
      expect(CacheConstant).toHaveProperty('SYSTEM');
      expect(CacheConstant).toHaveProperty('CACHE_PREFIX');
      expect(CacheConstant).toHaveProperty('AUTH_TOKEN_PREFIX');
    });
  });

  describe('CacheConstant.SYSTEM', () => {
    it('应该是 "hl8:"', () => {
      expect(CacheConstant.SYSTEM).toBe('hl8:');
    });

    it('应该是字符串类型', () => {
      expect(typeof CacheConstant.SYSTEM).toBe('string');
    });

    it('应该以冒号结尾', () => {
      expect(CacheConstant.SYSTEM).toMatch(/:$/);
    });
  });

  describe('CacheConstant.CACHE_PREFIX', () => {
    it('应该是 "hl8:cache:"', () => {
      expect(CacheConstant.CACHE_PREFIX).toBe('hl8:cache:');
    });

    it('应该是字符串类型', () => {
      expect(typeof CacheConstant.CACHE_PREFIX).toBe('string');
    });

    it('应该以 "hl8:cache:" 开头', () => {
      expect(CacheConstant.CACHE_PREFIX).toMatch(/^hl8:cache:/);
    });

    it('应该以冒号结尾', () => {
      expect(CacheConstant.CACHE_PREFIX).toMatch(/:$/);
    });
  });

  describe('CacheConstant.AUTH_TOKEN_PREFIX', () => {
    it('应该是 "hl8:cache:user:"', () => {
      expect(CacheConstant.AUTH_TOKEN_PREFIX).toBe('hl8:cache:user:');
    });

    it('应该是字符串类型', () => {
      expect(typeof CacheConstant.AUTH_TOKEN_PREFIX).toBe('string');
    });

    it('应该以 "hl8:cache:user:" 开头', () => {
      expect(CacheConstant.AUTH_TOKEN_PREFIX).toMatch(/^hl8:cache:user:/);
    });

    it('应该以冒号结尾', () => {
      expect(CacheConstant.AUTH_TOKEN_PREFIX).toMatch(/:$/);
    });
  });

  describe('缓存前缀层级关系', () => {
    it('CACHE_PREFIX 应该包含 SYSTEM 前缀', () => {
      expect(CacheConstant.CACHE_PREFIX).toContain(CacheConstant.SYSTEM);
    });

    it('AUTH_TOKEN_PREFIX 应该包含 CACHE_PREFIX', () => {
      expect(CacheConstant.AUTH_TOKEN_PREFIX).toContain(
        CacheConstant.CACHE_PREFIX,
      );
    });
  });
});
