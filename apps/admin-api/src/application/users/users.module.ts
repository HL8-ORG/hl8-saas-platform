import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeleteUserHandler } from '../../application/users/commands/handlers/delete-user.handler';
import { UpdateProfileHandler } from '../../application/users/commands/handlers/update-profile.handler';
import { UpdateUserHandler } from '../../application/users/commands/handlers/update-user.handler';
import { GetProfileHandler } from '../../application/users/queries/handlers/get-profile.handler';
import { GetUserByIdHandler } from '../../application/users/queries/handlers/get-user-by-id.handler';
import { GetUsersHandler } from '../../application/users/queries/handlers/get-users.handler';
import { RefreshToken } from '../../infrastructure/persistence/typeorm/entities/refresh-token.entity';
import { User as OrmUser } from '../../infrastructure/persistence/typeorm/entities/user.entity';
import { UserProfileRepository } from '../../infrastructure/persistence/typeorm/repositories/user-profile.repository';
import { UserReadRepository } from '../../infrastructure/persistence/typeorm/repositories/user-read.repository';
import { RefreshTokenRepositoryService } from '../../infrastructure/services/refresh-token-repository.service';
import { TenantResolverService } from '../../infrastructure/services/tenant-resolver.service';
import { UsersController } from '../../interface/controllers/users/users.controller';

/**
 * 用户模块（Clean Architecture）
 *
 * 负责用户管理相关的功能，使用 Clean Architecture 架构。
 * 集成所有用例、仓储和服务。
 *
 * **模块职责**：
 * - 提供用户控制器（表现层）
 * - 注册所有 Command/Query Handlers（应用层）
 * - 注册所有仓储实现（基础设施层）
 * - 配置 CQRS 模块和事件总线
 *
 * @class UsersModule
 * @description 用户管理功能模块（Clean Architecture）
 */
@Module({
  imports: [
    // CQRS 模块：支持命令查询职责分离和事件驱动架构
    CqrsModule,
    // TypeORM 模块：注册 ORM 实体
    TypeOrmModule.forFeature([OrmUser, RefreshToken]),
  ],
  controllers: [UsersController],
  providers: [
    // ==================== Command Handlers ====================
    UpdateUserHandler,
    DeleteUserHandler,
    UpdateProfileHandler,

    // ==================== Query Handlers ====================
    GetUsersHandler,
    GetUserByIdHandler,
    GetProfileHandler,

    // ==================== 仓储实现（基础设施层） ====================
    // 用户资料仓储（写操作）
    UserProfileRepository,
    {
      provide: 'IUserProfileRepository',
      useExisting: UserProfileRepository,
    },
    // 用户只读仓储（读操作）
    UserReadRepository,
    {
      provide: 'IUserReadRepository',
      useExisting: UserReadRepository,
    },

    // ==================== 服务实现（基础设施层） ====================
    // 租户解析器服务（复用认证模块的服务）
    TenantResolverService,
    {
      provide: 'ITenantResolver',
      useExisting: TenantResolverService,
    },
    // 刷新令牌仓储服务
    RefreshTokenRepositoryService,
    {
      provide: 'IRefreshTokenRepository',
      useExisting: RefreshTokenRepositoryService,
    },
  ],
})
export class UsersModule {}
