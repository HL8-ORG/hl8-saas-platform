import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { CorsConfig, corsRegToken, ICorsConfig } from './cors.config.js';

describe('CorsConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除测试相关的环境变量
    delete process.env.CORS_ENABLED;
    delete process.env.CORS_ORIGIN;
    delete process.env.CORS_METHODS;
    delete process.env.CORS_PREFLIGHT_CONTINUE;
    delete process.env.CORS_OPTIONS_SUCCESS_STATUS;
    delete process.env.CORS_CREDENTIALS;
    delete process.env.CORS_MAX_AGE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('配置注册', () => {
    it('应该正确注册配置令牌', () => {
      expect(corsRegToken).toBe('cors');
    });

    it('应该返回配置工厂函数', () => {
      expect(typeof CorsConfig).toBe('function');
    });
  });

  describe('默认值', () => {
    it('当所有环境变量未设置时应使用默认值', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.enabled).toBe(false);
      expect(config.corsOptions.origin).toEqual([]);
      expect(config.corsOptions.methods).toBe(
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
      expect(config.corsOptions.preflightContinue).toBe(false);
      expect(config.corsOptions.optionsSuccessStatus).toBe(204);
      expect(config.corsOptions.credentials).toBe(true);
      expect(config.corsOptions.maxAge).toBe(3600);
    });
  });

  describe('CORS_ENABLED', () => {
    it('当 CORS_ENABLED 设置为 "true" 时应返回 true', () => {
      process.env.CORS_ENABLED = 'true';
      const config = CorsConfig() as ICorsConfig;
      expect(config.enabled).toBe(true);
    });

    it('当 CORS_ENABLED 设置为 "false" 时应返回 false', () => {
      process.env.CORS_ENABLED = 'false';
      const config = CorsConfig() as ICorsConfig;
      expect(config.enabled).toBe(false);
    });

    it('当 CORS_ENABLED 未设置时应使用默认值 false', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.enabled).toBe(false);
    });
  });

  describe('CORS_ORIGIN', () => {
    it('当 CORS_ORIGIN 设置为单个值时应返回包含该值的数组', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.origin).toEqual(['http://localhost:3000']);
    });

    it('当 CORS_ORIGIN 设置为多个值时应返回分割后的数组', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.origin).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });

    it('当 CORS_ORIGIN 未设置时应返回空数组', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.origin).toEqual([]);
    });

    it('当 CORS_ORIGIN 设置为空字符串时应返回包含空字符串的数组', () => {
      process.env.CORS_ORIGIN = '';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.origin).toEqual(['']);
    });
  });

  describe('CORS_METHODS', () => {
    it('当 CORS_METHODS 设置时应使用该值', () => {
      process.env.CORS_METHODS = 'GET,POST';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.methods).toBe('GET,POST');
    });

    it('当 CORS_METHODS 未设置时应使用默认值', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.methods).toBe(
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
    });
  });

  describe('CORS_PREFLIGHT_CONTINUE', () => {
    it('当 CORS_PREFLIGHT_CONTINUE 设置为 "true" 时应返回 true', () => {
      process.env.CORS_PREFLIGHT_CONTINUE = 'true';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.preflightContinue).toBe(true);
    });

    it('当 CORS_PREFLIGHT_CONTINUE 设置为 "false" 时应返回 false', () => {
      process.env.CORS_PREFLIGHT_CONTINUE = 'false';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.preflightContinue).toBe(false);
    });

    it('当 CORS_PREFLIGHT_CONTINUE 未设置时应使用默认值 false', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.preflightContinue).toBe(false);
    });
  });

  describe('CORS_OPTIONS_SUCCESS_STATUS', () => {
    it('当 CORS_OPTIONS_SUCCESS_STATUS 设置为有效数字时应使用该值', () => {
      process.env.CORS_OPTIONS_SUCCESS_STATUS = '200';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.optionsSuccessStatus).toBe(200);
    });

    it('当 CORS_OPTIONS_SUCCESS_STATUS 设置为无效数字时应使用默认值', () => {
      process.env.CORS_OPTIONS_SUCCESS_STATUS = 'invalid';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.optionsSuccessStatus).toBe(204);
    });

    it('当 CORS_OPTIONS_SUCCESS_STATUS 未设置时应使用默认值 204', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.optionsSuccessStatus).toBe(204);
    });
  });

  describe('CORS_CREDENTIALS', () => {
    it('当 CORS_CREDENTIALS 设置为 "true" 时应返回 true', () => {
      process.env.CORS_CREDENTIALS = 'true';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.credentials).toBe(true);
    });

    it('当 CORS_CREDENTIALS 设置为 "false" 时应返回 false', () => {
      process.env.CORS_CREDENTIALS = 'false';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.credentials).toBe(false);
    });

    it('当 CORS_CREDENTIALS 未设置时应使用默认值 true', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.credentials).toBe(true);
    });
  });

  describe('CORS_MAX_AGE', () => {
    it('当 CORS_MAX_AGE 设置为有效数字时应使用该值', () => {
      process.env.CORS_MAX_AGE = '7200';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.maxAge).toBe(7200);
    });

    it('当 CORS_MAX_AGE 设置为无效数字时应使用默认值', () => {
      process.env.CORS_MAX_AGE = 'invalid';
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.maxAge).toBe(3600);
    });

    it('当 CORS_MAX_AGE 未设置时应使用默认值 3600', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config.corsOptions.maxAge).toBe(3600);
    });
  });

  describe('配置对象完整性', () => {
    it('配置对象应包含所有必需的属性', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('corsOptions');
      expect(config.corsOptions).toHaveProperty('origin');
      expect(config.corsOptions).toHaveProperty('methods');
      expect(config.corsOptions).toHaveProperty('preflightContinue');
      expect(config.corsOptions).toHaveProperty('optionsSuccessStatus');
      expect(config.corsOptions).toHaveProperty('credentials');
      expect(config.corsOptions).toHaveProperty('maxAge');
    });

    it('配置对象属性类型应正确', () => {
      const config = CorsConfig() as ICorsConfig;
      expect(typeof config.enabled).toBe('boolean');
      expect(Array.isArray(config.corsOptions.origin)).toBe(true);
      expect(typeof config.corsOptions.methods).toBe('string');
      expect(typeof config.corsOptions.preflightContinue).toBe('boolean');
      expect(typeof config.corsOptions.optionsSuccessStatus).toBe('number');
      expect(typeof config.corsOptions.credentials).toBe('boolean');
      expect(typeof config.corsOptions.maxAge).toBe('number');
    });
  });

  describe('组合场景', () => {
    it('当所有环境变量都设置时应使用所有设置的值', () => {
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';
      process.env.CORS_METHODS = 'GET,POST';
      process.env.CORS_PREFLIGHT_CONTINUE = 'true';
      process.env.CORS_OPTIONS_SUCCESS_STATUS = '200';
      process.env.CORS_CREDENTIALS = 'false';
      process.env.CORS_MAX_AGE = '7200';
      const config = CorsConfig() as ICorsConfig;
      expect(config.enabled).toBe(true);
      expect(config.corsOptions.origin).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
      expect(config.corsOptions.methods).toBe('GET,POST');
      expect(config.corsOptions.preflightContinue).toBe(true);
      expect(config.corsOptions.optionsSuccessStatus).toBe(200);
      expect(config.corsOptions.credentials).toBe(false);
      expect(config.corsOptions.maxAge).toBe(7200);
    });
  });
});
