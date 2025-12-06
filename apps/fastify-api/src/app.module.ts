import { LoggerModule } from '@hl8/logger';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AppConfigModule } from './config/config.module';
import { loggerConfig } from './config/logger.config';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

/**
 * 应用根模块
 *
 * 负责导入和配置应用程序的所有核心模块，包括日志、限流、配置、数据库、认证、用户和健康检查模块。
 *
 * **全局守卫**：
 * - ThrottlerGuard: 请求限流守卫，防止 API 滥用
 *   - default: 每分钟 10 次请求
 *   - strict: 每分钟 5 次请求（用于敏感操作）
 * - AuthGuard: JWT 认证守卫，验证访问令牌
 * - RolesGuard: 角色授权守卫，验证用户权限
 *
 * **中间件**：
 * - CorrelationIdMiddleware: 为每个请求生成关联 ID，用于日志追踪
 *
 * **模块职责**：
 * - LoggerModule: Pino 日志系统配置
 * - ThrottlerModule: API 限流配置
 * - AppConfigModule: 应用配置管理
 * - TypeOrmModule: 数据库连接管理（通过 useFactory 配置）
 * - AuthModule: 认证功能模块
 * - UsersModule: 用户管理功能模块
 * - HealthModule: 健康检查模块
 *
 * @class AppModule
 * @implements {NestModule}
 * @description NestJS 应用程序的根模块，聚合所有功能模块和配置
 */
@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 5,
      },
    ]),
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') || 'postgres';
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV');

        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          type: dbType as any,
          url: databaseUrl,
          entities: [User, RefreshToken],
          synchronize: nodeEnv !== 'production',
          logging: nodeEnv === 'development',
          ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * 配置中间件
   *
   * 为所有路由应用关联 ID 中间件，用于请求追踪。
   *
   * @param {MiddlewareConsumer} consumer - 中间件消费者
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
