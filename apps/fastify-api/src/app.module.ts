import { Logger, LoggerModule } from '@hl8/logger';
import { MAIL_CONFIG, MailModule, MailService } from '@hl8/mail';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as casbin from 'casbin';
import { DataSource } from 'typeorm';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AppConfigModule } from './config/config.module';
import { loggerConfig } from './config/logger.config';
import { MailConfigService } from './config/mail.config';
import { MailerConfigModule } from './config/mailer.config';
import { Permission } from './entities/permission.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Role } from './entities/role.entity';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { AUTHZ_ENFORCER, AuthZModule } from './modules/authz';
import { HealthModule } from './modules/health/health.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import TypeORMAdapter from './typeorm-adapter';
import { CasbinRule } from './typeorm-adapter/casbinRule';

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
          type: dbType as any,
          url: databaseUrl,
          entities: [User, RefreshToken, Role, Permission, Tenant, CasbinRule],
          synchronize: nodeEnv !== 'production',
          logging: nodeEnv === 'development',
          ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    // 邮件服务配置
    MailerConfigModule,
    // 手动配置 MailModule，因为 MailConfigService 需要依赖注入
    // 不能使用 MailModule.forRoot()，因为它期望无参数的构造函数
    {
      module: MailModule,
      providers: [
        MailService,
        MailConfigService,
        {
          provide: MAIL_CONFIG,
          useExisting: MailConfigService,
        },
      ],
      exports: [MailService],
      global: true,
    },
    // 为全局守卫提供 User 实体访问
    TypeOrmModule.forFeature([User]),
    // Casbin 授权模块配置（使用数据库持久化）
    AuthZModule.register({
      imports: [ConfigModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async (
          configService: ConfigService,
          dataSource: DataSource,
          logger: Logger,
        ) => {
          // 使用 TypeORM Adapter 替代文件存储
          const adapter = await TypeORMAdapter.newAdapter(
            { connection: dataSource },
            {
              customCasbinRuleEntity: CasbinRule,
            },
          );

          // 创建 Casbin Enforcer，使用模型文件和数据库适配器
          const modelPath = 'src/modules/authz/model.conf';
          const enforcer = await casbin.newEnforcer(modelPath, adapter);

          // 加载策略（从数据库）
          await enforcer.loadPolicy();

          // 检查数据库是否为空，如果为空则记录警告
          // 统计所有策略类型：p（权限策略）、g（角色继承）、g2（资源继承）
          const policies = await enforcer.getPolicy();
          const groupingPolicies = await enforcer.getGroupingPolicy();
          const groupingPolicies2 = await enforcer.getNamedGroupingPolicy('g2');

          const totalPolicyCount =
            policies.length +
            groupingPolicies.length +
            groupingPolicies2.length;

          if (totalPolicyCount === 0) {
            logger.warn(
              '当前数据库没有权限策略数据，可能影响系统使用，请与系统管理员联系！',
              'AuthZModule',
            );
          } else {
            logger.log(
              `已从数据库加载 ${totalPolicyCount} 条权限策略规则`,
              'AuthZModule',
            );
          }

          return enforcer;
        },
        inject: [ConfigService, DataSource, Logger],
      },
      userFromContext: (context) => {
        // 从 JWT payload 中提取用户信息
        // request.user 包含 { sub: userId, role: userRole, email: userEmail }
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
          return null;
        }

        // 返回用户 ID（sub）作为 Casbin 中的 subject
        // 也可以返回用户对象，根据 Casbin 模型配置决定
        return user.sub || user.id || user.username || null;
      },
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    MailConfigService,
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
   * 为所有路由应用关联 ID 中间件和租户中间件，用于请求追踪和租户上下文管理。
   *
   * **中间件执行顺序**：
   * 1. CorrelationIdMiddleware: 生成关联 ID
   * 2. TenantMiddleware: 提取和验证租户 ID
   *
   * @param {MiddlewareConsumer} consumer - 中间件消费者
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, TenantMiddleware).forRoutes('*');
  }
}
