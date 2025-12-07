import { LoggerModule } from '@hl8/logger';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuard } from '../../../src/common/guards/auth.guard';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { CorrelationIdMiddleware } from '../../../src/common/middleware/correlation-id.middleware';
import { AppConfigModule } from '../../../src/config/config.module';
import { loggerConfig } from '../../../src/config/logger.config';
import { RefreshToken } from '../../../src/entities/refresh-token.entity';
import { User } from '../../../src/entities/user.entity';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { HealthModule } from '../../../src/modules/health/health.module';
import { UsersModule } from '../../../src/modules/users/users.module';

/**
 * 测试专用的应用模块
 *
 * 用于集成测试，不包含 ThrottlerModule，避免限流影响测试。
 *
 * @class TestAppModule
 * @implements {NestModule}
 */
@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    // 注意：测试环境中不导入 ThrottlerModule，避免限流影响测试
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') || 'postgres';
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV');

        return {
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
    // 只注册 AuthGuard 和 RolesGuard，不注册 ThrottlerGuard
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
export class TestAppModule implements NestModule {
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
