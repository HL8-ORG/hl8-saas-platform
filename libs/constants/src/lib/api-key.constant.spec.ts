import { describe, expect, it } from '@jest/globals';
import {
  API_KEY_AUTH_OPTIONS,
  ApiKeyAuthSource,
  ApiKeyAuthStrategy,
} from './api-key.constant';

/**
 * API Key 常量单元测试
 *
 * @description 验证所有 API Key 相关常量的值是否正确
 */
describe('api-key.constant', () => {
  describe('API_KEY_AUTH_OPTIONS', () => {
    it('应该是一个 Symbol', () => {
      expect(typeof API_KEY_AUTH_OPTIONS).toBe('symbol');
    });

    it('应该是唯一的 Symbol 实例', () => {
      const anotherSymbol = Symbol('API_KEY_AUTH_OPTIONS');
      expect(API_KEY_AUTH_OPTIONS).not.toBe(anotherSymbol);
    });
  });

  describe('ApiKeyAuthStrategy', () => {
    it('应该是一个枚举对象', () => {
      expect(ApiKeyAuthStrategy).toBeInstanceOf(Object);
    });

    it('应该包含 ApiKey 和 SignedRequest 两个值', () => {
      expect(ApiKeyAuthStrategy).toHaveProperty('ApiKey');
      expect(ApiKeyAuthStrategy).toHaveProperty('SignedRequest');
    });

    describe('ApiKeyAuthStrategy.ApiKey', () => {
      it('应该是 "api-key"', () => {
        expect(ApiKeyAuthStrategy.ApiKey).toBe('api-key');
      });

      it('应该是字符串类型', () => {
        expect(typeof ApiKeyAuthStrategy.ApiKey).toBe('string');
      });
    });

    describe('ApiKeyAuthStrategy.SignedRequest', () => {
      it('应该是 "signed-request"', () => {
        expect(ApiKeyAuthStrategy.SignedRequest).toBe('signed-request');
      });

      it('应该是字符串类型', () => {
        expect(typeof ApiKeyAuthStrategy.SignedRequest).toBe('string');
      });
    });

    it('两个枚举值应该不同', () => {
      expect(ApiKeyAuthStrategy.ApiKey).not.toBe(
        ApiKeyAuthStrategy.SignedRequest,
      );
    });
  });

  describe('ApiKeyAuthSource', () => {
    it('应该是一个枚举对象', () => {
      expect(ApiKeyAuthSource).toBeInstanceOf(Object);
    });

    it('应该包含 Header 和 Query 两个值', () => {
      expect(ApiKeyAuthSource).toHaveProperty('Header');
      expect(ApiKeyAuthSource).toHaveProperty('Query');
    });

    describe('ApiKeyAuthSource.Header', () => {
      it('应该是 "header"', () => {
        expect(ApiKeyAuthSource.Header).toBe('header');
      });

      it('应该是字符串类型', () => {
        expect(typeof ApiKeyAuthSource.Header).toBe('string');
      });
    });

    describe('ApiKeyAuthSource.Query', () => {
      it('应该是 "query"', () => {
        expect(ApiKeyAuthSource.Query).toBe('query');
      });

      it('应该是字符串类型', () => {
        expect(typeof ApiKeyAuthSource.Query).toBe('string');
      });
    });

    it('两个枚举值应该不同', () => {
      expect(ApiKeyAuthSource.Header).not.toBe(ApiKeyAuthSource.Query);
    });
  });
});
