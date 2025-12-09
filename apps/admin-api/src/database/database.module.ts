import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../infrastructure/persistence/typeorm/entities/refresh-token.entity';
import { User } from '../infrastructure/persistence/typeorm/entities/user.entity';

/**
 * 数据库模块
 *
 * 负责配置和导出 TypeORM 数据库连接。
 *
 * **配置特性**：
 * - 异步配置：从环境变量读取数据库连接信息
 * - 实体注册：注册 User 和 RefreshToken 实体
 * - 环境相关配置：
 *   - synchronize: 非生产环境自动同步数据库结构
 *   - logging: 开发环境启用 SQL 日志
 *   - ssl: 生产环境启用 SSL 连接
 *
 * @class DatabaseModule
 * @description 数据库连接配置模块
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: (configService.get<string>('DB_TYPE') as any) || 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, RefreshToken],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
