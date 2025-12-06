import { z } from 'zod';

/**
 * 环境变量验证模式
 *
 * 使用 Zod 定义环境变量的验证规则和默认值。
 *
 * **验证项**：
 * - NODE_ENV: 环境类型（development/production/test）
 * - PORT: 应用端口
 * - DATABASE_URL: 数据库连接 URL
 * - DB_TYPE: 数据库类型
 * - JWT_ACCESS_SECRET: JWT 访问令牌密钥（至少 32 个字符）
 * - JWT_REFRESH_SECRET: JWT 刷新令牌密钥（至少 32 个字符）
 * - JWT_ACCESS_EXPIRY: JWT 访问令牌过期时间（格式：数字+单位，如 "60m"）
 * - JWT_REFRESH_EXPIRY: JWT 刷新令牌过期时间（格式：数字+单位，如 "30d"）
 * - CORS_ORIGIN: CORS 允许的源（URL 或 "*"）
 * - LOG_LEVEL: 日志级别
 *
 * @constant {z.ZodObject} envSchema
 * @description 环境变量验证模式
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(8080),

  // Database
  DATABASE_URL: z.string().min(1, 'Invalid DATABASE_URL'),
  DB_TYPE: z
    .enum(['postgres', 'mysql', 'sqlite', 'mariadb'])
    .default('postgres'),

  // JWT Secrets
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_EXPIRY must be in format: 60m, 1h, etc.')
    .default('60m'),
  JWT_REFRESH_EXPIRY: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRY must be in format: 7d, 30d, etc.')
    .default('30d'),

  // CORS
  CORS_ORIGIN: z
    .string()
    .refine((val) => {
      const origins = val.split(',').map((o) => o.trim());
      const urlRegex = /^https?:\/\/.+/;
      return origins.every((origin) => urlRegex.test(origin) || origin === '*');
    }, 'CORS_ORIGIN must be valid URL(s) or "*"')
    .default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

/**
 * 环境变量类型
 *
 * 从验证模式推断出的环境变量类型。
 *
 * @type {z.infer<typeof envSchema>} Env
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 验证环境变量
 *
 * 使用 Zod 模式验证环境变量配置。
 *
 * @param {Record<string, unknown>} config - 环境变量配置对象
 * @returns {Env} 验证后的环境变量对象
 * @throws {Error} 当环境变量验证失败时抛出错误，包含详细的错误信息
 */
export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}
