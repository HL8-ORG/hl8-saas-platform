import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  CryptoConfig,
  cryptoRegToken,
  ICryptoConfig,
} from './crypto.config.js';

describe('CryptoConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // 清除测试相关的环境变量
    delete process.env.CRYPTO_AES_KEY;
    delete process.env.CRYPTO_AES_IV;
    delete process.env.CRYPTO_RSA_PRIVATE_KEY;
    delete process.env.CRYPTO_RSA_PUBLIC_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('配置注册', () => {
    it('应该正确注册配置令牌', () => {
      expect(cryptoRegToken).toBe('crypto');
    });

    it('应该返回配置工厂函数', () => {
      expect(typeof CryptoConfig).toBe('function');
    });
  });

  describe('默认值', () => {
    it('当所有环境变量未设置时应使用默认值', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesKey).toBe('12345678901234567890123456789012');
      expect(config.aesIv).toBe('1234567890123456');
      expect(config.rsaPrivateKey).toContain('BEGIN PRIVATE KEY');
      expect(config.rsaPublicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('默认 AES 密钥长度应为 32 字节', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesKey.length).toBe(32);
    });

    it('默认 AES IV 长度应为 16 字节', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesIv.length).toBe(16);
    });
  });

  describe('CRYPTO_AES_KEY', () => {
    it('当 CRYPTO_AES_KEY 设置时应使用该值', () => {
      const customKey = 'abcdefghijklmnopqrstuvwxyz123456';
      process.env.CRYPTO_AES_KEY = customKey;
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesKey).toBe(customKey);
    });

    it('当 CRYPTO_AES_KEY 未设置时应使用默认值', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesKey).toBe('12345678901234567890123456789012');
    });

    it('当 CRYPTO_AES_KEY 设置为空字符串时应返回空字符串', () => {
      process.env.CRYPTO_AES_KEY = '';
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesKey).toBe('');
    });
  });

  describe('CRYPTO_AES_IV', () => {
    it('当 CRYPTO_AES_IV 设置时应使用该值', () => {
      const customIv = 'abcdefghijklmnop';
      process.env.CRYPTO_AES_IV = customIv;
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesIv).toBe(customIv);
    });

    it('当 CRYPTO_AES_IV 未设置时应使用默认值', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesIv).toBe('1234567890123456');
    });

    it('当 CRYPTO_AES_IV 设置为空字符串时应返回空字符串', () => {
      process.env.CRYPTO_AES_IV = '';
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesIv).toBe('');
    });
  });

  describe('CRYPTO_RSA_PRIVATE_KEY', () => {
    it('当 CRYPTO_RSA_PRIVATE_KEY 设置时应使用该值', () => {
      const customKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----`;
      process.env.CRYPTO_RSA_PRIVATE_KEY = customKey;
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.rsaPrivateKey).toBe(customKey);
    });

    it('当 CRYPTO_RSA_PRIVATE_KEY 未设置时应使用默认值', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.rsaPrivateKey).toContain('BEGIN PRIVATE KEY');
      expect(config.rsaPrivateKey).toContain('YOUR_DEFAULT_PRIVATE_KEY');
      expect(config.rsaPrivateKey).toContain('END PRIVATE KEY');
    });

    it('当 CRYPTO_RSA_PRIVATE_KEY 设置为空字符串时应返回空字符串', () => {
      process.env.CRYPTO_RSA_PRIVATE_KEY = '';
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.rsaPrivateKey).toBe('');
    });
  });

  describe('CRYPTO_RSA_PUBLIC_KEY', () => {
    it('当 CRYPTO_RSA_PUBLIC_KEY 设置时应使用该值', () => {
      const customKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;
      process.env.CRYPTO_RSA_PUBLIC_KEY = customKey;
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.rsaPublicKey).toBe(customKey);
    });

    it('当 CRYPTO_RSA_PUBLIC_KEY 未设置时应使用默认值', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.rsaPublicKey).toContain('BEGIN PUBLIC KEY');
      expect(config.rsaPublicKey).toContain('YOUR_DEFAULT_PUBLIC_KEY');
      expect(config.rsaPublicKey).toContain('END PUBLIC KEY');
    });

    it('当 CRYPTO_RSA_PUBLIC_KEY 设置为空字符串时应返回空字符串', () => {
      process.env.CRYPTO_RSA_PUBLIC_KEY = '';
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.rsaPublicKey).toBe('');
    });
  });

  describe('配置对象完整性', () => {
    it('配置对象应包含所有必需的属性', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(config).toHaveProperty('aesKey');
      expect(config).toHaveProperty('aesIv');
      expect(config).toHaveProperty('rsaPrivateKey');
      expect(config).toHaveProperty('rsaPublicKey');
    });

    it('配置对象属性类型应正确', () => {
      const config = CryptoConfig() as ICryptoConfig;
      expect(typeof config.aesKey).toBe('string');
      expect(typeof config.aesIv).toBe('string');
      expect(typeof config.rsaPrivateKey).toBe('string');
      expect(typeof config.rsaPublicKey).toBe('string');
    });
  });

  describe('组合场景', () => {
    it('当所有环境变量都设置时应使用所有设置的值', () => {
      const aesKey = 'abcdefghijklmnopqrstuvwxyz123456';
      const aesIv = 'abcdefghijklmnop';
      const rsaPrivateKey =
        '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----';
      const rsaPublicKey =
        '-----BEGIN PUBLIC KEY-----\nTEST\n-----END PUBLIC KEY-----';
      process.env.CRYPTO_AES_KEY = aesKey;
      process.env.CRYPTO_AES_IV = aesIv;
      process.env.CRYPTO_RSA_PRIVATE_KEY = rsaPrivateKey;
      process.env.CRYPTO_RSA_PUBLIC_KEY = rsaPublicKey;
      const config = CryptoConfig() as ICryptoConfig;
      expect(config.aesKey).toBe(aesKey);
      expect(config.aesIv).toBe(aesIv);
      expect(config.rsaPrivateKey).toBe(rsaPrivateKey);
      expect(config.rsaPublicKey).toBe(rsaPublicKey);
    });
  });
});
