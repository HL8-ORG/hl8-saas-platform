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

/**
 * 权限服务
 *
 * 管理权限实体的 CRUD 操作，包括：
 * - 权限的创建、查询、更新、删除
 * - 权限与角色的关联管理
 *
 * @class PermissionsService
 * @description 权限管理服务
 */
@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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
   * 创建或获取权限
   *
   * 如果权限已存在（相同的 resource + action + tenantId），则返回现有权限。
   * 如果不存在，则创建新权限。
   *
   * @param permissionData - 权限数据
   * @returns 权限实体
   */
  async createOrGet(permissionData: {
    resource: string;
    action: string;
    description?: string;
    tenantId?: string;
  }): Promise<Permission> {
    const tenantId = permissionData.tenantId || this.getCurrentTenantId();
    const existing = await this.permissionRepository.findOne({
      where: {
        resource: permissionData.resource,
        action: permissionData.action,
        tenantId,
      },
    });

    if (existing) {
      return existing;
    }

    const permission = this.permissionRepository.create({
      resource: permissionData.resource,
      action: permissionData.action,
      description: permissionData.description,
      tenantId,
    });

    return await this.permissionRepository.save(permission);
  }

  /**
   * 查询所有权限
   *
   * 默认过滤当前租户的权限。
   *
   * @param tenantId - 租户 ID（可选，如果未提供则使用当前租户）
   * @returns 权限列表
   */
  async findAll(tenantId?: string): Promise<Permission[]> {
    const currentTenantId = tenantId || this.getCurrentTenantId();
    return await this.permissionRepository.find({
      where: { tenantId: currentTenantId },
      relations: ['roles'],
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * 根据 ID 查询权限
   *
   * @param id - 权限 ID
   * @returns 权限实体，如果不存在则返回 null
   */
  async findById(id: string): Promise<Permission | null> {
    const tenantId = this.getCurrentTenantId();
    return await this.permissionRepository.findOne({
      where: { id, tenantId },
      relations: ['roles'],
    });
  }

  /**
   * 根据资源和操作查询权限
   *
   * @param resource - 资源标识
   * @param action - 操作类型
   * @param tenantId - 租户 ID（可选）
   * @returns 权限实体，如果不存在则返回 null
   */
  async findByResourceAndAction(
    resource: string,
    action: string,
    tenantId?: string,
  ): Promise<Permission | null> {
    const currentTenantId = tenantId || this.getCurrentTenantId();
    return await this.permissionRepository.findOne({
      where: {
        resource,
        action,
        tenantId: currentTenantId,
      },
      relations: ['roles'],
    });
  }

  /**
   * 更新权限描述
   *
   * @param id - 权限 ID
   * @param description - 新的描述
   * @returns 更新后的权限实体
   * @throws {NotFoundException} 当权限不存在时抛出
   */
  async updateDescription(
    id: string,
    description: string,
  ): Promise<Permission> {
    const tenantId = this.getCurrentTenantId();
    const permission = await this.permissionRepository.findOne({
      where: { id, tenantId },
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    permission.description = description;
    return await this.permissionRepository.save(permission);
  }

  /**
   * 删除权限
   *
   * @param id - 权限 ID
   * @returns 删除结果
   * @throws {NotFoundException} 当权限不存在时抛出
   * @throws {BadRequestException} 当权限仍被角色使用时抛出
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    const permission = await this.permissionRepository.findOne({
      where: { id, tenantId },
      relations: ['roles'],
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    if (permission.roles && permission.roles.length > 0) {
      throw new BadRequestException(
        `权限仍被 ${permission.roles.length} 个角色使用，无法删除`,
      );
    }

    await this.permissionRepository.remove(permission);
  }

  /**
   * 为角色关联权限（通过 Permission 实体）
   *
   * @param roleId - 角色 ID
   * @param permissionId - 权限 ID
   * @returns 关联结果
   * @throws {NotFoundException} 当角色或权限不存在时抛出
   */
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const [role, permission] = await Promise.all([
      this.roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions'],
      }),
      this.permissionRepository.findOne({
        where: { id: permissionId },
      }),
    ]);

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    // 检查是否已关联
    if (role.permissions?.some((p) => p.id === permissionId)) {
      return; // 已关联，直接返回
    }

    // 添加关联
    if (!role.permissions) {
      role.permissions = [];
    }
    role.permissions.push(permission);
    await this.roleRepository.save(role);
  }

  /**
   * 取消角色与权限的关联
   *
   * @param roleId - 角色 ID
   * @param permissionId - 权限 ID
   * @returns 取消关联结果
   * @throws {NotFoundException} 当角色或权限不存在时抛出
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (!role.permissions) {
      return; // 没有关联的权限
    }

    // 移除关联
    role.permissions = role.permissions.filter((p) => p.id !== permissionId);
    await this.roleRepository.save(role);
  }

  /**
   * 查询角色拥有的所有权限（通过 Permission 实体）
   *
   * @param roleId - 角色 ID
   * @returns 权限列表
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role.permissions || [];
  }
}
