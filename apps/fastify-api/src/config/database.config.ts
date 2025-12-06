import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

/**
 * 数据库配置类
 *
 * 实现 `TypeOrmOptionsFactory` 接口，用于创建 TypeORM 配置选项。
 * 从 `ConfigService` 读取数据库配置并构建完整的 TypeORM 配置对象。
 *
 * @class DatabaseConfig
 * @implements {TypeOrmOptionsFactory}
 * @description TypeORM 配置工厂类
 */
@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  /**
   * 构造函数
   *
   * 注入配置服务依赖。
   *
   * @param {ConfigService} configService - 配置服务，用于读取环境变量配置
   */
  constructor(private configService: ConfigService) {}

  /**
   * 创建 TypeORM 配置选项
   *
   * 从配置服务读取数据库配置，并构建完整的 TypeORM 配置对象。
   *
   * @returns {TypeOrmModuleOptions} TypeORM 模块配置选项
   */
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbType = this.configService.get<string>('DB_TYPE') || 'postgres';
    const databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    return {
      // TypeORM 需要动态数据库类型，使用类型断言
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: dbType as any,
      url: databaseUrl,
      entities: [User, RefreshToken],
      synchronize: nodeEnv !== 'production',
      logging: nodeEnv === 'development',
      ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
}
