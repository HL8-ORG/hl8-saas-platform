import { LoggerModule } from '@hl8/logger';
import { MailModule } from '@hl8/mail';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginHandler } from '../../application/auth/commands/handlers/login.handler';
import { LogoutHandler } from '../../application/auth/commands/handlers/logout.handler';
import { RefreshTokenHandler } from '../../application/auth/commands/handlers/refresh-token.handler';
import { ResendVerificationHandler } from '../../application/auth/commands/handlers/resend-verification.handler';
import { SignupHandler } from '../../application/auth/commands/handlers/signup.handler';
import { VerifyEmailHandler } from '../../application/auth/commands/handlers/verify-email.handler';
import { GetMeHandler } from '../../application/auth/queries/handlers/get-me.handler';
import { UserMapper } from '../../infrastructure/persistence/mappers/user.mapper';
import { RefreshToken } from '../../infrastructure/persistence/typeorm/entities/refresh-token.entity';
import { Tenant } from '../../infrastructure/persistence/typeorm/entities/tenant.entity';
import { User } from '../../infrastructure/persistence/typeorm/entities/user.entity';
import { TenantRepository } from '../../infrastructure/persistence/typeorm/repositories/tenant.repository';
import { UserRepository } from '../../infrastructure/persistence/typeorm/repositories/user.repository';
import { AuthJwtService } from '../../infrastructure/services/jwt.service';
import { PasswordHasherService } from '../../infrastructure/services/password-hasher.service';
import { RefreshTokenRepositoryService } from '../../infrastructure/services/refresh-token-repository.service';
import { TenantResolverService } from '../../infrastructure/services/tenant-resolver.service';
import { AuthController } from '../../interface/controllers/auth/auth.controller';

/**
 * 认证模块（Clean Architecture）
 *
 * 负责用户认证相关的功能，使用 Clean Architecture 架构。
 * 集成所有用例、仓储和服务。
 *
 * **模块职责**：
 * - 提供认证控制器（表现层）
 * - 注册所有 Command/Query Handlers（应用层）
 * - 注册所有仓储实现（基础设施层）
 * - 注册所有服务实现（基础设施层）
 * - 配置 JWT 模块
 *
 * @class AuthModule
 * @description 认证功能模块（Clean Architecture）
 */
@Module({
  imports: [
    // CQRS 模块：支持命令查询职责分离和事件驱动架构
    CqrsModule,
    // TypeORM 模块：注册 ORM 实体
    TypeOrmModule.forFeature([User, RefreshToken, Tenant]),
    // JWT 模块：配置 JWT 认证
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '15m') as any,
        },
      }),
    }),
    LoggerModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    // ==================== Command/Query Handlers ====================
    SignupHandler,
    LoginHandler,
    RefreshTokenHandler,
    LogoutHandler,
    VerifyEmailHandler,
    ResendVerificationHandler,
    GetMeHandler,

    // ==================== 仓储实现（基础设施层） ====================
    // 用户仓储
    UserRepository,
    {
      provide: 'IUserRepository',
      useExisting: UserRepository,
    },
    // 租户仓储
    TenantRepository,
    {
      provide: 'ITenantRepository',
      useExisting: TenantRepository,
    },

    // ==================== 服务实现（基础设施层） ====================
    // 密码哈希服务
    PasswordHasherService,
    {
      provide: 'IPasswordHasher',
      useExisting: PasswordHasherService,
    },
    // JWT 服务
    AuthJwtService,
    {
      provide: 'IJwtService',
      useExisting: AuthJwtService,
    },
    // 刷新令牌仓储服务
    RefreshTokenRepositoryService,
    {
      provide: 'IRefreshTokenRepository',
      useExisting: RefreshTokenRepositoryService,
    },
    // 租户解析器服务
    TenantResolverService,
    {
      provide: 'ITenantResolver',
      useExisting: TenantResolverService,
    },
    // 用户映射器
    UserMapper,
  ],
  exports: [
    // 导出服务供其他模块使用
    'IUserRepository',
    'IPasswordHasher',
    'IJwtService',
    'IRefreshTokenRepository',
    'ITenantResolver',
  ],
})
export class AuthModule {}
