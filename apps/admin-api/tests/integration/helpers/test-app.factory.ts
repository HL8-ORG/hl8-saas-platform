import fastifyCookie from '@fastify/cookie';
import { Logger } from '@hl8/logger';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../../src/common/interceptors/response.interceptor';
import { DatabaseHelper } from './database-helper';
import { TestAppModule } from './test-app.module';

/**
 * 测试应用工厂
 *
 * 用于创建测试用的 NestJS 应用实例。
 * 提供应用初始化、数据库清理等工具方法。
 *
 * @class TestAppFactory
 */
export class TestAppFactory {
  private app: INestApplication | null = null;
  private dataSource: DataSource | null = null;

  /**
   * 创建测试应用实例
   *
   * 初始化 NestJS 应用，配置中间件、管道、拦截器和过滤器。
   *
   * @returns {Promise<INestApplication>} 测试应用实例
   * @throws {Error} 如果数据库连接失败则抛出错误
   */
  async createApp(): Promise<INestApplication> {
    const adapter = new FastifyAdapter();
    await adapter.getInstance().register(fastifyCookie);

    // 使用测试专用的 AppModule，不包含 ThrottlerModule
    // 这样可以完全避免限流影响测试
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    const app = moduleFixture.createNestApplication<NestFastifyApplication>(
      adapter,
      { bufferLogs: true },
    );

    // 使用测试日志
    app.useLogger(app.get(Logger));

    app.setGlobalPrefix('api/v1');

    // 配置 CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    // 配置全局验证管道
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // 配置全局拦截器和过滤器
    const logger = app.get(Logger);
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    this.app = app;

    // 获取数据源用于数据库操作
    this.dataSource = app.get(DataSource);

    // 检查数据库连接
    if (!this.dataSource) {
      throw new Error('数据源未初始化');
    }
    const isConnected = await DatabaseHelper.checkConnection(this.dataSource);
    if (!isConnected) {
      console.warn(
        '⚠️  数据库连接失败。请确保：',
        '\n  1. PostgreSQL 数据库已启动',
        '\n  2. 测试数据库已创建',
        '\n  3. DATABASE_URL 环境变量已正确设置',
        '\n  4. 数据库凭据正确',
        '\n\n  可以使用 Docker Compose 启动数据库：',
        '\n  docker-compose up -d postgres',
        '\n\n  或设置环境变量：',
        '\n  export TEST_DATABASE_URL="postgresql://username:password@localhost:5432/fastify_api_test"',
      );
      throw new Error(
        '数据库连接失败。请检查数据库配置和连接。查看上面的提示获取帮助。',
      );
    }

    return app;
  }

  /**
   * 获取应用实例
   *
   * @returns {INestApplication} 应用实例
   * @throws {Error} 如果应用未初始化则抛出错误
   */
  getApp(): INestApplication {
    if (!this.app) {
      throw new Error('应用未初始化，请先调用 createApp()');
    }
    return this.app;
  }

  /**
   * 获取数据源
   *
   * @returns {DataSource} TypeORM 数据源
   * @throws {Error} 如果数据源未初始化则抛出错误
   */
  getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('数据源未初始化，请先调用 createApp()');
    }
    return this.dataSource;
  }

  /**
   * 清理数据库
   *
   * 删除所有测试数据，确保测试之间的隔离。
   *
   * @returns {Promise<void>}
   */
  async cleanupDatabase(): Promise<void> {
    if (!this.dataSource) {
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 使用 SQL 直接删除所有记录（按外键依赖顺序）
      // 先删除刷新令牌（依赖用户）
      await queryRunner.query('DELETE FROM refresh_tokens');
      // 再删除用户
      await queryRunner.query('DELETE FROM users');
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // 清除 Throttler 存储，避免限流影响后续测试
    if (this.app) {
      try {
        const throttlerStorage = this.app.get(ThrottlerStorageService, {
          strict: false,
        });
        if (throttlerStorage) {
          // 尝试清除存储
          // ThrottlerStorageService 的内部存储结构可能因版本而异
          // 这里尝试多种清除方法
          if (
            throttlerStorage.storage &&
            typeof throttlerStorage.storage === 'object'
          ) {
            const storage = throttlerStorage.storage as Map<string, any>;
            if (storage && typeof storage.clear === 'function') {
              storage.clear();
            }
          }
          // 如果 storage 是对象，尝试删除所有属性
          if (
            throttlerStorage.storage &&
            typeof throttlerStorage.storage === 'object' &&
            !(throttlerStorage.storage instanceof Map)
          ) {
            Object.keys(throttlerStorage.storage).forEach((key) => {
              delete (throttlerStorage.storage as any)[key];
            });
          }
        }
      } catch {
        // 如果无法清除存储，忽略错误（可能存储结构不同）
      }
    }
  }

  /**
   * 清除 Throttler 存储
   *
   * 清除 Throttler 的存储，避免限流影响测试。
   *
   * @returns {Promise<void>}
   */
  async clearThrottlerStorage(): Promise<void> {
    if (!this.app) {
      return;
    }

    try {
      // 尝试获取 ThrottlerStorageService
      // 注意：如果服务不存在或无法获取，忽略错误
      const throttlerStorage = this.app.get(ThrottlerStorageService, {
        strict: false,
      });
      if (throttlerStorage && throttlerStorage.storage) {
        // 尝试清除存储
        // ThrottlerStorageService 的内部存储结构可能因版本而异
        // 这里尝试多种清除方法
        const storage = throttlerStorage.storage;
        if (storage instanceof Map) {
          storage.clear();
        } else if (typeof storage === 'object' && storage !== null) {
          // 如果是普通对象，删除所有属性
          Object.keys(storage).forEach((key) => {
            try {
              delete (storage as any)[key];
            } catch {
              // 忽略删除失败
            }
          });
        }
      }
    } catch (error) {
      // 如果无法清除存储，忽略错误（可能存储结构不同或服务不存在）
      // 这在测试环境中是正常的，因为 ThrottlerGuard 可能已经被覆盖
    }
  }

  /**
   * 关闭应用
   *
   * 清理资源并关闭应用实例。
   *
   * @returns {Promise<void>}
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }
  }
}
