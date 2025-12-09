import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission as OrmPermission } from '../../infrastructure/persistence/typeorm/entities/permission.entity';
import { Role as OrmRole } from '../../infrastructure/persistence/typeorm/entities/role.entity';
import { PermissionReadRepository } from '../../infrastructure/persistence/typeorm/repositories/permission-read.repository';
import { PermissionRepository } from '../../infrastructure/persistence/typeorm/repositories/permission.repository';
import { PermissionsService } from '../../infrastructure/services/permissions.service';
import { TenantResolverService } from '../../infrastructure/services/tenant-resolver.service';
import { PermissionsController } from '../../interface/controllers/permissions/permissions.controller';
import { AuthZModule } from '../../lib/casbin';
import { AuthModule } from '../auth/auth.module';
import { CreatePermissionHandler } from './commands/handlers/create-permission.handler';
import { GetPermissionsHandler } from './queries/handlers/get-permissions.handler';

/**
 * 权限模块（Clean Architecture）
 *
 * 负责权限管理相关的功能，使用 Clean Architecture 架构。
 *
 * **模块职责**：
 * - 提供权限控制器（表现层）
 * - 注册所有 Command/Query Handlers（应用层）
 * - 注册所有仓储实现（基础设施层）
 * - 注册权限服务实现（基础设施层）
 *
 * @class PermissionsModule
 * @description 权限管理功能模块（Clean Architecture）
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrmPermission, OrmRole]),
    AuthZModule,
    AuthModule, // 导入 AuthModule 以使用 ITenantResolver
  ],
  controllers: [PermissionsController],
  providers: [
    // ==================== Command Handlers ====================
    CreatePermissionHandler,

    // ==================== Query Handlers ====================
    GetPermissionsHandler,

    // ==================== 仓储实现（基础设施层） ====================
    PermissionRepository,
    {
      provide: 'IPermissionRepository',
      useExisting: PermissionRepository,
    },
    PermissionReadRepository,
    {
      provide: 'IPermissionReadRepository',
      useExisting: PermissionReadRepository,
    },

    // ==================== 服务实现（基础设施层） ====================
    // 租户解析器服务
    TenantResolverService,
    {
      provide: 'ITenantResolver',
      useExisting: TenantResolverService,
    },
    // 权限服务
    PermissionsService,
    {
      provide: 'IPermissionsService',
      useExisting: PermissionsService,
    },
  ],
  exports: [
    'IPermissionRepository',
    'IPermissionReadRepository',
    'IPermissionsService', // 导出权限服务供其他模块使用
  ],
})
export class PermissionsModule {}
