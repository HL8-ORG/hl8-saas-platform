import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { UsersModule } from '../users/users.module';
import { PermissionsController } from './controllers/permissions.controller';
import { UserPermissionsController } from './controllers/user-permissions.controller';
import { PermissionsService } from './services/permissions.service';

/**
 * 权限管理模块
 *
 * 提供权限管理的功能，包括：
 * - 权限的 CRUD 操作
 * - 权限与角色的关联管理
 * - 用户权限查询
 *
 * **模块职责**：
 * - 提供权限管理控制器和服务
 * - 注册 Permission 和 Role 实体
 * - 依赖 UsersModule 和 AuthZModule（全局模块）
 *
 * @class PermissionsModule
 * @description 权限管理功能模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role]),
    UsersModule, // 导入 UsersModule 以使用 UsersService
  ],
  controllers: [PermissionsController, UserPermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService], // 导出服务供其他模块使用
})
export class PermissionsModule {}
