import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from '../users/users.module';
import { RolesController } from './controllers/roles.controller';
import { UserRolesController } from './controllers/user-roles.controller';
import { RolesService } from './services/roles.service';

/**
 * 角色管理模块
 *
 * 提供基于角色的访问控制（RBAC）功能，包括：
 * - 角色管理（创建、删除、查询）
 * - 用户-角色关联管理
 * - 角色-权限关联管理（通过 PermissionsModule）
 *
 * **模块职责**：
 * - 提供角色管理控制器和服务
 * - 注册 Role 和 Permission 实体（用于关联查询）
 * - 依赖 UsersModule、PermissionsModule 和 AuthZModule（全局模块）
 *
 * @class RolesModule
 * @description 角色管理功能模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, User]),
    UsersModule, // 导入 UsersModule 以使用 UsersService
    PermissionsModule, // 导入 PermissionsModule 以使用 PermissionsService
  ],
  controllers: [RolesController, UserRolesController],
  providers: [RolesService],
  exports: [RolesService], // 导出服务供其他模块使用
})
export class RolesModule {}
