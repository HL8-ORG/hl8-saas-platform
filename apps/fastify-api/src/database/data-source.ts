import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

config();

/**
 * TypeORM 数据源配置
 *
 * 用于 TypeORM CLI 和迁移的数据源配置。
 *
 * **配置说明**：
 * - 数据库类型：从环境变量读取，默认为 postgres
 * - 连接 URL：从环境变量 DATABASE_URL 读取
 * - 实体：注册 User 和 RefreshToken 实体
 * - 迁移：从 src/database/migrations 目录加载迁移文件
 * - synchronize: 禁用自动同步（使用迁移管理数据库结构）
 * - logging: 开发环境启用 SQL 日志
 * - ssl: 生产环境启用 SSL 连接
 *
 * @constant {DataSource} AppDataSource
 * @description TypeORM 数据源实例，用于 CLI 和迁移
 */
export const AppDataSource = new DataSource({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  type: (process.env.DB_TYPE as any) || 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, RefreshToken],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
