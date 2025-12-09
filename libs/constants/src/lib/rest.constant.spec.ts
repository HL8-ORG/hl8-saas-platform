import { describe, expect, it } from '@jest/globals';
import {
  FUNCTION,
  METHOD,
  PATH,
  RESPONSE_SUCCESS_CODE,
  RESPONSE_SUCCESS_MSG,
  SWAGGER_API_OPERATION,
  USER_AGENT,
  X_REQUEST_ID,
} from './rest.constant';

/**
 * REST 常量单元测试
 *
 * @description 验证所有 REST 相关常量的值是否正确
 */
describe('rest.constant', () => {
  describe('RESPONSE_SUCCESS_CODE', () => {
    it('应该是 200', () => {
      expect(RESPONSE_SUCCESS_CODE).toBe(200);
    });

    it('应该是数字类型', () => {
      expect(typeof RESPONSE_SUCCESS_CODE).toBe('number');
    });
  });

  describe('RESPONSE_SUCCESS_MSG', () => {
    it('应该是 "success"', () => {
      expect(RESPONSE_SUCCESS_MSG).toBe('success');
    });

    it('应该是字符串类型', () => {
      expect(typeof RESPONSE_SUCCESS_MSG).toBe('string');
    });
  });

  describe('X_REQUEST_ID', () => {
    it('应该是 "x-request-id"', () => {
      expect(X_REQUEST_ID).toBe('x-request-id');
    });

    it('应该是字符串类型', () => {
      expect(typeof X_REQUEST_ID).toBe('string');
    });
  });

  describe('USER_AGENT', () => {
    it('应该是 "user-agent"', () => {
      expect(USER_AGENT).toBe('user-agent');
    });

    it('应该是字符串类型', () => {
      expect(typeof USER_AGENT).toBe('string');
    });
  });

  describe('PATH', () => {
    it('应该是 "path"', () => {
      expect(PATH).toBe('path');
    });

    it('应该是字符串类型', () => {
      expect(typeof PATH).toBe('string');
    });
  });

  describe('FUNCTION', () => {
    it('应该是 "function"', () => {
      expect(FUNCTION).toBe('function');
    });

    it('应该是字符串类型', () => {
      expect(typeof FUNCTION).toBe('string');
    });
  });

  describe('METHOD', () => {
    it('应该是 "method"', () => {
      expect(METHOD).toBe('method');
    });

    it('应该是字符串类型', () => {
      expect(typeof METHOD).toBe('string');
    });
  });

  describe('SWAGGER_API_OPERATION', () => {
    it('应该是 "swagger/apiOperation"', () => {
      expect(SWAGGER_API_OPERATION).toBe('swagger/apiOperation');
    });

    it('应该是字符串类型', () => {
      expect(typeof SWAGGER_API_OPERATION).toBe('string');
    });
  });
});
