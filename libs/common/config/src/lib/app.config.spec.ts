import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { AppConfig, appConfigToken, IAppConfig } from './app.config.js';

describe('AppConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除测试相关的环境变量
    delete process.env.APP_PORT;
    delete process.env.DOC_SWAGGER_ENABLE;
    delete process.env.DOC_SWAGGER_PATH;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('配置注册', () => {
    it('应该正确注册配置令牌', () => {
      expect(appConfigToken).toBe('app');
    });

    it('应该返回配置工厂函数', () => {
      expect(typeof AppConfig).toBe('function');
    });
  });

  describe('默认值', () => {
    it('当所有环境变量未设置时应使用默认值', () => {
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(9528);
      expect(config.docSwaggerEnable).toBe(true);
      expect(config.docSwaggerPath).toBe('api-docs');
    });
  });

  describe('APP_PORT', () => {
    it('当 APP_PORT 设置为有效数字时应使用该值', () => {
      process.env.APP_PORT = '3000';
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(3000);
    });

    it('当 APP_PORT 设置为无效数字时应使用默认值', () => {
      process.env.APP_PORT = 'invalid';
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(9528);
    });

    it('当 APP_PORT 设置为负数时应使用该值', () => {
      process.env.APP_PORT = '-1';
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(-1);
    });

    it('当 APP_PORT 设置为 0 时应使用该值', () => {
      process.env.APP_PORT = '0';
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(0);
    });
  });

  describe('DOC_SWAGGER_ENABLE', () => {
    it('当 DOC_SWAGGER_ENABLE 设置为 "true" 时应返回 true', () => {
      process.env.DOC_SWAGGER_ENABLE = 'true';
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerEnable).toBe(true);
    });

    it('当 DOC_SWAGGER_ENABLE 设置为 "false" 时应返回 false', () => {
      process.env.DOC_SWAGGER_ENABLE = 'false';
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerEnable).toBe(false);
    });

    it('当 DOC_SWAGGER_ENABLE 未设置时应使用默认值 true', () => {
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerEnable).toBe(true);
    });

    it('当 DOC_SWAGGER_ENABLE 设置为其他值时应返回 false', () => {
      process.env.DOC_SWAGGER_ENABLE = 'yes';
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerEnable).toBe(false);
    });
  });

  describe('DOC_SWAGGER_PATH', () => {
    it('当 DOC_SWAGGER_PATH 设置时应使用该值', () => {
      process.env.DOC_SWAGGER_PATH = 'swagger';
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerPath).toBe('swagger');
    });

    it('当 DOC_SWAGGER_PATH 未设置时应使用默认值', () => {
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerPath).toBe('api-docs');
    });

    it('当 DOC_SWAGGER_PATH 设置为空字符串时应返回空字符串', () => {
      process.env.DOC_SWAGGER_PATH = '';
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerPath).toBe('');
    });

    it('当 DOC_SWAGGER_PATH 设置为带斜杠的路径时应保留斜杠', () => {
      process.env.DOC_SWAGGER_PATH = '/api/docs';
      const config = AppConfig() as IAppConfig;
      expect(config.docSwaggerPath).toBe('/api/docs');
    });
  });

  describe('配置对象完整性', () => {
    it('配置对象应包含所有必需的属性', () => {
      const config = AppConfig() as IAppConfig;
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('docSwaggerEnable');
      expect(config).toHaveProperty('docSwaggerPath');
    });

    it('配置对象属性类型应正确', () => {
      const config = AppConfig() as IAppConfig;
      expect(typeof config.port).toBe('number');
      expect(typeof config.docSwaggerEnable).toBe('boolean');
      expect(typeof config.docSwaggerPath).toBe('string');
    });
  });

  describe('组合场景', () => {
    it('当所有环境变量都设置时应使用所有设置的值', () => {
      process.env.APP_PORT = '8080';
      process.env.DOC_SWAGGER_ENABLE = 'false';
      process.env.DOC_SWAGGER_PATH = 'docs';
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(8080);
      expect(config.docSwaggerEnable).toBe(false);
      expect(config.docSwaggerPath).toBe('docs');
    });

    it('当部分环境变量设置时应混合使用设置值和默认值', () => {
      process.env.APP_PORT = '9000';
      // DOC_SWAGGER_ENABLE 和 DOC_SWAGGER_PATH 未设置
      const config = AppConfig() as IAppConfig;
      expect(config.port).toBe(9000);
      expect(config.docSwaggerEnable).toBe(true); // 默认值
      expect(config.docSwaggerPath).toBe('api-docs'); // 默认值
    });
  });
});
