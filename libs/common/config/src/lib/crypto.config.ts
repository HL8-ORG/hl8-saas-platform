import { ConfigType, registerAs } from '@nestjs/config';

import { getEnvString } from '@hl8/utils';

/**
 * 加密配置注册令牌
 *
 * @description 用于标识加密配置的注册令牌
 */
export const cryptoRegToken = 'crypto';

/**
 * 加密配置
 *
 * @description 注册加密相关配置，包括 AES 和 RSA 密钥
 *
 * @returns 返回加密配置对象
 *
 * @example
 * 环境变量配置：
 * - CRYPTO_AES_KEY: AES 加密密钥（32字节），默认 '12345678901234567890123456789012'
 * - CRYPTO_AES_IV: AES 初始化向量（16字节），默认 '1234567890123456'
 * - CRYPTO_RSA_PRIVATE_KEY: RSA 私钥（PEM 格式）
 * - CRYPTO_RSA_PUBLIC_KEY: RSA 公钥（PEM 格式）
 *
 * @warning 生产环境必须修改默认密钥，使用强随机密钥
 */
export const CryptoConfig = registerAs(cryptoRegToken, () => ({
  // AES配置
  aesKey: getEnvString('CRYPTO_AES_KEY', '12345678901234567890123456789012'), // 32字节密钥
  aesIv: getEnvString('CRYPTO_AES_IV', '1234567890123456'), // 16字节IV

  // RSA配置
  rsaPrivateKey: getEnvString(
    'CRYPTO_RSA_PRIVATE_KEY',
    `-----BEGIN PRIVATE KEY-----
    YOUR_DEFAULT_PRIVATE_KEY
    -----END PRIVATE KEY-----`,
  ),
  rsaPublicKey: getEnvString(
    'CRYPTO_RSA_PUBLIC_KEY',
    `-----BEGIN PUBLIC KEY-----
    YOUR_DEFAULT_PUBLIC_KEY
    -----END PUBLIC KEY-----`,
  ),
}));

/**
 * 加密配置类型
 *
 * @description 加密配置对象的类型定义
 */
export type ICryptoConfig = ConfigType<typeof CryptoConfig>;
