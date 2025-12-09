import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateRoleHandler } from '../../application/roles/commands/handlers/create-role.handler';
import { DeleteRoleHandler } from '../../application/roles/commands/handlers/delete-role.handler';
import { GrantRolePermissionHandler } from '../../application/roles/commands/handlers/grant-role-permission.handler';
import { GetRoleByIdHandler } from '../../application/roles/queries/handlers/get-role-by-id.handler';
import { GetRolePermissionsHandler } from '../../application/roles/queries/handlers/get-role-permissions.handler';
import { GetRolesHandler } from '../../application/roles/queries/handlers/get-roles.handler';
import { Role as OrmRole } from '../../infrastructure/persistence/typeorm/entities/role.entity';
import { RoleReadRepository } from '../../infrastructure/persistence/typeorm/repositories/role-read.repository';
import { RoleRepository } from '../../infrastructure/persistence/typeorm/repositories/role.repository';
import { TenantResolverService } from '../../infrastructure/services/tenant-resolver.service';
import { RolesController } from '../../interface/controllers/roles/roles.controller';
import { AuthZModule } from '../../lib/casbin';
import { PermissionsModule } from '../permissions/permissions.module';

/**
 * 角色模块（Clean Architecture）
 *
 * 负责角色管理相关的功能，使用 Clean Architecture 架构。
 * 集成所有用例、仓储和服务。
 *
 * **模块职责**：
 * - 提供角色控制器（表现层）
 * - 注册所有 Command/Query Handlers（应用层）
 * - 注册所有仓储实现（基础设施层）
 * - 配置 CQRS 模块和事件总线
 *
 * @class RolesModule
 * @description 角色管理功能模块（Clean Architecture）
 */
@Module({
  imports: [
    // CQRS 模块：支持命令查询职责分离和事件驱动架构
    CqrsModule,
    // TypeORM 模块：注册 ORM 实体
    TypeOrmModule.forFeature([OrmRole]),
    // 授权模块：用于权限管理
    AuthZModule,
    // 权限模块：用于权限实体管理（导入以使用 IPermissionsService）
    PermissionsModule,
  ],
  controllers: [RolesController],
  providers: [
    // ==================== Command Handlers ====================
    CreateRoleHandler,
    DeleteRoleHandler,
    GrantRolePermissionHandler,

    // ==================== Query Handlers ====================
    GetRolesHandler,
    GetRoleByIdHandler,
    GetRolePermissionsHandler,

    // ==================== 仓储实现（基础设施层） ====================
    // 角色仓储（写操作）
    RoleRepository,
    {
      provide: 'IRoleRepository',
      useExisting: RoleRepository,
    },
    // 角色只读仓储（读操作）
    RoleReadRepository,
    {
      provide: 'IRoleReadRepository',
      useExisting: RoleReadRepository,
    },

    // ==================== 服务实现（基础设施层） ====================
    // 租户解析器服务
    TenantResolverService,
    {
      provide: 'ITenantResolver',
      useExisting: TenantResolverService,
    },
  ],
})
export class RolesModule {}
