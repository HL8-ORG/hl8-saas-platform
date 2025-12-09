import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  ISecurityConfig,
  SecurityConfig,
  securityRegToken,
} from './security.config.js';

describe('SecurityConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除测试相关的环境变量
    delete process.env.CASBIN_MODEL;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRE_IN;
    delete process.env.REFRESH_TOKEN_SECRET;
    delete process.env.REFRESH_TOKEN_EXPIRE_IN;
    delete process.env.SIGN_REQ_TIMESTAMP_DISPARITY;
    delete process.env.SIGN_REQ_NONCE_TTL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('配置注册', () => {
    it('应该正确注册配置令牌', () => {
      expect(securityRegToken).toBe('security');
    });

    it('应该返回配置工厂函数', () => {
      expect(typeof SecurityConfig).toBe('function');
    });
  });

  describe('默认值', () => {
    it('当所有环境变量未设置时应使用默认值', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.casbinModel).toBe('model.conf');
      expect(config.jwtSecret).toBe('JWT_SECRET-soybean-admin-nest!@#123.');
      expect(config.jwtExpiresIn).toBe(60 * 60 * 2); // 7200 秒 = 2 小时
      expect(config.refreshJwtSecret).toBe(
        'REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.',
      );
      expect(config.refreshJwtExpiresIn).toBe(60 * 60 * 12); // 43200 秒 = 12 小时
      expect(config.signReqTimestampDisparity).toBe(5 * 60 * 1000); // 300000 毫秒 = 5 分钟
      expect(config.signReqNonceTTL).toBe(300); // 300 秒 = 5 分钟
    });
  });

  describe('CASBIN_MODEL', () => {
    it('当 CASBIN_MODEL 设置时应使用该值', () => {
      process.env.CASBIN_MODEL = 'custom-model.conf';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.casbinModel).toBe('custom-model.conf');
    });

    it('当 CASBIN_MODEL 未设置时应使用默认值', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.casbinModel).toBe('model.conf');
    });
  });

  describe('JWT_SECRET', () => {
    it('当 JWT_SECRET 设置时应使用该值', () => {
      const customSecret = 'custom-jwt-secret-key';
      process.env.JWT_SECRET = customSecret;
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.jwtSecret).toBe(customSecret);
    });

    it('当 JWT_SECRET 未设置时应使用默认值', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.jwtSecret).toBe('JWT_SECRET-soybean-admin-nest!@#123.');
    });
  });

  describe('JWT_EXPIRE_IN', () => {
    it('当 JWT_EXPIRE_IN 设置为有效数字时应使用该值', () => {
      process.env.JWT_EXPIRE_IN = '3600';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.jwtExpiresIn).toBe(3600);
    });

    it('当 JWT_EXPIRE_IN 设置为无效数字时应使用默认值', () => {
      process.env.JWT_EXPIRE_IN = 'invalid';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.jwtExpiresIn).toBe(7200); // 默认值
    });

    it('当 JWT_EXPIRE_IN 未设置时应使用默认值 7200', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.jwtExpiresIn).toBe(7200);
    });
  });

  describe('REFRESH_TOKEN_SECRET', () => {
    it('当 REFRESH_TOKEN_SECRET 设置时应使用该值', () => {
      const customSecret = 'custom-refresh-secret-key';
      process.env.REFRESH_TOKEN_SECRET = customSecret;
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.refreshJwtSecret).toBe(customSecret);
    });

    it('当 REFRESH_TOKEN_SECRET 未设置时应使用默认值', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.refreshJwtSecret).toBe(
        'REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.',
      );
    });
  });

  describe('REFRESH_TOKEN_EXPIRE_IN', () => {
    it('当 REFRESH_TOKEN_EXPIRE_IN 设置为有效数字时应使用该值', () => {
      process.env.REFRESH_TOKEN_EXPIRE_IN = '86400';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.refreshJwtExpiresIn).toBe(86400);
    });

    it('当 REFRESH_TOKEN_EXPIRE_IN 设置为无效数字时应使用默认值', () => {
      process.env.REFRESH_TOKEN_EXPIRE_IN = 'invalid';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.refreshJwtExpiresIn).toBe(43200); // 默认值
    });

    it('当 REFRESH_TOKEN_EXPIRE_IN 未设置时应使用默认值 43200', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.refreshJwtExpiresIn).toBe(43200);
    });
  });

  describe('SIGN_REQ_TIMESTAMP_DISPARITY', () => {
    it('当 SIGN_REQ_TIMESTAMP_DISPARITY 设置为有效数字时应使用该值', () => {
      process.env.SIGN_REQ_TIMESTAMP_DISPARITY = '600000';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.signReqTimestampDisparity).toBe(600000);
    });

    it('当 SIGN_REQ_TIMESTAMP_DISPARITY 设置为无效数字时应使用默认值', () => {
      process.env.SIGN_REQ_TIMESTAMP_DISPARITY = 'invalid';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.signReqTimestampDisparity).toBe(300000); // 默认值
    });

    it('当 SIGN_REQ_TIMESTAMP_DISPARITY 未设置时应使用默认值 300000', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.signReqTimestampDisparity).toBe(300000);
    });
  });

  describe('SIGN_REQ_NONCE_TTL', () => {
    it('当 SIGN_REQ_NONCE_TTL 设置为有效数字时应使用该值', () => {
      process.env.SIGN_REQ_NONCE_TTL = '600';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.signReqNonceTTL).toBe(600);
    });

    it('当 SIGN_REQ_NONCE_TTL 设置为无效数字时应使用默认值', () => {
      process.env.SIGN_REQ_NONCE_TTL = 'invalid';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.signReqNonceTTL).toBe(300); // 默认值
    });

    it('当 SIGN_REQ_NONCE_TTL 未设置时应使用默认值 300', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.signReqNonceTTL).toBe(300);
    });
  });

  describe('配置对象完整性', () => {
    it('配置对象应包含所有必需的属性', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(config).toHaveProperty('casbinModel');
      expect(config).toHaveProperty('jwtSecret');
      expect(config).toHaveProperty('jwtExpiresIn');
      expect(config).toHaveProperty('refreshJwtSecret');
      expect(config).toHaveProperty('refreshJwtExpiresIn');
      expect(config).toHaveProperty('signReqTimestampDisparity');
      expect(config).toHaveProperty('signReqNonceTTL');
    });

    it('配置对象属性类型应正确', () => {
      const config = SecurityConfig() as ISecurityConfig;
      expect(typeof config.casbinModel).toBe('string');
      expect(typeof config.jwtSecret).toBe('string');
      expect(typeof config.jwtExpiresIn).toBe('number');
      expect(typeof config.refreshJwtSecret).toBe('string');
      expect(typeof config.refreshJwtExpiresIn).toBe('number');
      expect(typeof config.signReqTimestampDisparity).toBe('number');
      expect(typeof config.signReqNonceTTL).toBe('number');
    });
  });

  describe('组合场景', () => {
    it('当所有环境变量都设置时应使用所有设置的值', () => {
      process.env.CASBIN_MODEL = 'custom-model.conf';
      process.env.JWT_SECRET = 'custom-jwt-secret';
      process.env.JWT_EXPIRE_IN = '1800';
      process.env.REFRESH_TOKEN_SECRET = 'custom-refresh-secret';
      process.env.REFRESH_TOKEN_EXPIRE_IN = '86400';
      process.env.SIGN_REQ_TIMESTAMP_DISPARITY = '600000';
      process.env.SIGN_REQ_NONCE_TTL = '600';
      const config = SecurityConfig() as ISecurityConfig;
      expect(config.casbinModel).toBe('custom-model.conf');
      expect(config.jwtSecret).toBe('custom-jwt-secret');
      expect(config.jwtExpiresIn).toBe(1800);
      expect(config.refreshJwtSecret).toBe('custom-refresh-secret');
      expect(config.refreshJwtExpiresIn).toBe(86400);
      expect(config.signReqTimestampDisparity).toBe(600000);
      expect(config.signReqNonceTTL).toBe(600);
    });
  });
});
