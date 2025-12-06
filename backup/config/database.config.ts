import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

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
    const dbConfig = this.configService.get('database');

    return {
      type: (dbConfig?.type as any) || 'postgres',
      host: dbConfig?.host,
      port: dbConfig?.port || 5432,
      username: dbConfig?.username,
      password: dbConfig?.password,
      database: dbConfig?.database,
      entities: [],
      synchronize: false,
      logging: this.configService.get('LOGGER') === 'true',
    };
  }
}
