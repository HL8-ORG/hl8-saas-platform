import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { FastifyRequest } from 'fastify';
import { Repository } from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../../common/constants/tenant.constants';
import { Permission } from '../../../entities/permission.entity';
import { Role } from '../../../entities/role.entity';
import { User } from '../../../entities/user.entity';
import { AuthZService } from '../../authz/services/authz.service';
import { AuthAction } from '../../authz/types';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { Resource, ResourceGroup } from '../resources';

/**
 * 角色服务
 *
 * 实现基于角色的访问控制（RBAC）的核心功能，包括：
 * - 角色管理（创建、删除、查询）
 * - 用户-角色关联管理
 * - 角色-权限关联管理
 *
 * @class RolesService
 * @description 角色管理服务
 */
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authzService: AuthZService,
    private readonly permissionsService: PermissionsService,
    @Inject(REQUEST) private readonly request: FastifyRequest,
  ) {}

  /**
   * 获取当前租户 ID
   *
   * @private
   * @returns {string} 当前租户 ID
   * @throws {BadRequestException} 当租户 ID 不存在时抛出
   */
  private getCurrentTenantId(): string {
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY];
    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失');
    }
    return tenantId;
  }

  /**
   * 创建新角色
   *
   * @param roleData - 角色数据
   * @returns 创建的角色实体
   * @throws {BadRequestException} 当角色名称已存在时抛出
   */
  async addRole(roleData: {
    name: string;
    displayName?: string;
    description?: string;
  }): Promise<Role> {
    const tenantId = this.getCurrentTenantId();
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleData.name, tenantId },
    });

    if (existingRole) {
      throw new BadRequestException(`角色 ${roleData.name} 已存在`);
    }

    const role = this.roleRepository.create({
      name: roleData.name,
      displayName: roleData.displayName || roleData.name,
      description: roleData.description,
      tenantId,
      isActive: true,
    });

    return await this.roleRepository.save(role);
  }

  /**
   * 删除角色
   *
   * @param roleId - 角色 ID
   * @returns 删除结果
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async deleteRole(roleId: string): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`角色不存在`);
    }

    // 从 Casbin 中删除角色
    await this.authzService.deleteRole(role.name);

    // 从数据库中删除角色
    await this.roleRepository.remove(role);
  }

  /**
   * 为用户分配角色
   *
   * @param userId - 用户 ID
   * @param roleName - 角色名称
   * @returns 分配结果
   * @throws {NotFoundException} 当用户或角色不存在时抛出
   */
  async assignUser(userId: string, roleName: string): Promise<boolean> {
    const tenantId = this.getCurrentTenantId();
    const [user, role] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId, tenantId } }),
      this.roleRepository.findOne({ where: { name: roleName, tenantId } }),
    ]);

    if (!user) {
      throw new NotFoundException(`用户不存在`);
    }

    if (!role) {
      throw new NotFoundException(`角色 ${roleName} 不存在`);
    }

    if (!role.isActive) {
      throw new BadRequestException(`角色 ${roleName} 未激活`);
    }

    // 在 Casbin 中添加用户-角色关联（传递租户ID以实现多租户隔离）
    return await this.authzService.addRoleForUser(user.id, role.name, tenantId);
  }

  /**
   * 取消用户的角色分配
   *
   * @param userId - 用户 ID
   * @param roleName - 角色名称
   * @returns 取消分配结果
   * @throws {NotFoundException} 当用户或角色不存在时抛出
   * @throws {BadRequestException} 当用户没有该角色时抛出
   */
  async deAssignUser(userId: string, roleName: string): Promise<boolean> {
    const tenantId = this.getCurrentTenantId();
    const [user, role] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId, tenantId } }),
      this.roleRepository.findOne({ where: { name: roleName, tenantId } }),
    ]);

    if (!user) {
      throw new NotFoundException(`用户不存在`);
    }

    if (!role) {
      throw new NotFoundException(`角色 ${roleName} 不存在`);
    }

    const hasRole = await this.authzService.hasRoleForUser(
      user.id,
      role.name,
      tenantId,
    );

    if (!hasRole) {
      throw new BadRequestException(`用户 ${user.email} 没有角色 ${roleName}`);
    }

    // 从 Casbin 中删除用户-角色关联（传递租户ID以实现多租户隔离）
    return await this.authzService.deleteRoleForUser(
      user.id,
      role.name,
      tenantId,
    );
  }

  /**
   * 为角色授予权限
   *
   * 同时更新 Permission 实体和 Casbin 策略。
   *
   * @param roleName - 角色名称
   * @param operation - 操作类型（如 'read:any'）
   * @param resource - 资源标识（如 'user' 或 'users_list'）
   * @param description - 权限描述（可选）
   * @returns 授权结果
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async grantPermission(
    roleName: string,
    operation: AuthAction | string,
    resource: ResourceGroup | Resource | string,
    description?: string,
  ): Promise<boolean> {
    const tenantId = this.getCurrentTenantId();
    const role = await this.roleRepository.findOne({
      where: { name: roleName, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`角色 ${roleName} 不存在`);
    }

    // 创建或获取权限实体（会自动使用当前租户 ID）
    const permission = await this.permissionsService.createOrGet({
      resource: resource as string,
      action: operation as string,
      description,
    });

    // 在 Permission 实体中关联角色和权限
    await this.permissionsService.assignPermissionToRole(
      role.id,
      permission.id,
    );

    // 在 Casbin 中添加角色-权限关联（用于权限检查，传递租户ID以实现多租户隔离）
    // 注意：Casbin 策略格式为 (subject, domain, object, action)
    // 这里需要将租户ID作为 domain 参数传递
    return await this.authzService.addPolicy(
      role.name,
      tenantId,
      resource,
      operation,
    );
  }

  /**
   * 撤销角色的权限
   *
   * 同时更新 Permission 实体和 Casbin 策略。
   *
   * @param roleName - 角色名称
   * @param operation - 操作类型
   * @param resource - 资源标识
   * @returns 撤销结果
   * @throws {NotFoundException} 当角色不存在时抛出
   * @throws {BadRequestException} 当角色没有该权限时抛出
   */
  async revokePermission(
    roleName: string,
    operation: AuthAction | string,
    resource: ResourceGroup | Resource | string,
  ): Promise<boolean> {
    const tenantId = this.getCurrentTenantId();
    const role = await this.roleRepository.findOne({
      where: { name: roleName, tenantId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`角色 ${roleName} 不存在`);
    }

    // 检查角色是否有权限（传递租户ID以实现多租户隔离）
    const hasPermission = await this.authzService.enforce(
      role.name,
      tenantId,
      resource,
      operation,
    );

    if (!hasPermission) {
      throw new BadRequestException(
        `角色 ${roleName} 没有权限 ${operation} ${resource}`,
      );
    }

    // 查找权限实体
    const permission = await this.permissionsService.findByResourceAndAction(
      resource as string,
      operation as string,
    );

    // 从 Permission 实体中取消关联
    if (permission) {
      await this.permissionsService.removePermissionFromRole(
        role.id,
        permission.id,
      );
    }

    // 从 Casbin 中删除角色-权限关联（传递租户ID以实现多租户隔离）
    return await this.authzService.removePolicy(
      role.name,
      tenantId,
      resource,
      operation,
    );
  }

  /**
   * 获取角色的所有权限
   *
   * 优先从 Permission 实体获取（包含元数据），如果没有则从 Casbin 获取。
   *
   * @param roleName - 角色名称
   * @returns 权限列表（格式：[[resource, operation], ...]）
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async rolePermissions(roleName: string): Promise<string[][]> {
    const tenantId = this.getCurrentTenantId();
    const role = await this.roleRepository.findOne({
      where: { name: roleName, tenantId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`角色 ${roleName} 不存在`);
    }

    // 优先从 Permission 实体获取（包含完整信息）
    if (role.permissions && role.permissions.length > 0) {
      return role.permissions.map((p) => [p.resource, p.action]);
    }

    // 如果没有，从 Casbin 获取（兼容旧数据，传递租户ID以实现多租户隔离）
    // 注意：getPermissionsForUser 不支持 domain 参数，需要使用 getFilteredPolicy
    const policies = await this.authzService.getFilteredPolicy(
      0,
      role.name,
      tenantId,
    );
    return policies.map((policy) => [policy[2], policy[3]]); // 返回 [resource, action]
  }

  /**
   * 获取角色的所有权限（包含完整信息）
   *
   * 从 Permission 实体获取权限的完整信息，包括描述等元数据。
   *
   * @param roleId - 角色 ID
   * @returns 权限实体列表
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async getRolePermissionsWithDetails(roleId: string): Promise<Permission[]> {
    return await this.permissionsService.getRolePermissions(roleId);
  }

  /**
   * 获取拥有指定角色的所有用户
   *
   * @param roleName - 角色名称
   * @returns 用户 ID 列表
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async assignedUsers(roleName: string): Promise<string[]> {
    const tenantId = this.getCurrentTenantId();
    const role = await this.roleRepository.findOne({
      where: { name: roleName, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`角色 ${roleName} 不存在`);
    }

    // 获取拥有该角色的所有用户（传递租户ID以实现多租户隔离）
    return await this.authzService.getUsersForRole(role.name, tenantId);
  }

  /**
   * 查询所有角色
   *
   * @returns 角色列表
   */
  async findAllRoles(): Promise<Role[]> {
    const tenantId = this.getCurrentTenantId();
    return await this.roleRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 查询角色
   *
   * @param id - 角色 ID
   * @returns 角色实体，如果不存在则返回 null
   */
  async findById(id: string): Promise<Role | null> {
    const tenantId = this.getCurrentTenantId();
    return await this.roleRepository.findOne({
      where: { id, tenantId },
    });
  }

  /**
   * 根据名称查询角色
   *
   * @param name - 角色名称
   * @returns 角色实体，如果不存在则返回 null
   */
  async findByName(name: string): Promise<Role | null> {
    const tenantId = this.getCurrentTenantId();
    return await this.roleRepository.findOne({
      where: { name, tenantId },
    });
  }

  /**
   * 检查角色是否存在
   *
   * @param name - 角色名称
   * @returns 如果存在返回 true，否则返回 false
   */
  async exists(name: string): Promise<boolean> {
    const tenantId = this.getCurrentTenantId();
    const role = await this.roleRepository.findOne({
      where: { name, tenantId },
    });
    return !!role;
  }
}
