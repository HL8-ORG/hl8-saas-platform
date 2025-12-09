import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import type { IPermissionsService } from '../../application/shared/interfaces/permissions-service.interface';
import type { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';
import { Permission } from '../persistence/typeorm/entities/permission.entity';
import { Role } from '../persistence/typeorm/entities/role.entity';

/**
 * 权限服务实现
 *
 * 管理权限实体的 CRUD 操作，包括：
 * - 权限的创建、查询、更新、删除
 * - 权限与角色的关联管理
 *
 * @class PermissionsService
 * @implements {IPermissionsService}
 * @description 权限管理服务实现
 */
@Injectable()
export class PermissionsService implements IPermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取当前租户 ID
   *
   * @private
   * @returns {string} 当前租户 ID
   * @throws {BadRequestException} 当租户 ID 不存在时抛出
   */
  private getCurrentTenantId(): string {
    return this.tenantResolver.getCurrentTenantId();
  }

  /**
   * 创建或获取权限
   *
   * 如果权限已存在（相同的 resource + action + tenantId），则返回现有权限。
   * 如果不存在，则创建新权限。
   * 性能优化：使用缓存键查询，减少数据库访问。
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
    const cacheKey = `permission:${tenantId}:${permissionData.resource}:${permissionData.action}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Permission>(cacheKey);
    if (cached) {
      return cached;
    }

    // 性能优化：使用 select 只查询需要的字段，避免加载不必要的数据
    const existing = await this.permissionRepository.findOne({
      where: {
        resource: permissionData.resource,
        action: permissionData.action,
        tenantId,
      },
      select: ['id', 'resource', 'action', 'description', 'tenantId'],
    });

    if (existing) {
      // 缓存结果，TTL 5 分钟（cache-manager v7 使用秒）
      await this.cacheManager.set(cacheKey, existing, 5 * 60);
      return existing;
    }

    const permission = this.permissionRepository.create({
      resource: permissionData.resource,
      action: permissionData.action,
      description: permissionData.description,
      tenantId,
    });

    const saved = await this.permissionRepository.save(permission);
    // 缓存新创建的权限，TTL 5 分钟（cache-manager v7 使用秒）
    await this.cacheManager.set(cacheKey, saved, 5 * 60);
    // 清除权限列表缓存
    await this.cacheManager.del(`permissions:list:${tenantId}`);

    return saved;
  }

  /**
   * 查询所有权限
   *
   * 默认过滤当前租户的权限。
   * 性能优化：添加缓存，减少数据库查询。
   *
   * @param tenantId - 租户 ID（可选，如果未提供则使用当前租户）
   * @returns 权限列表
   */
  async findAll(tenantId?: string): Promise<Permission[]> {
    const currentTenantId = tenantId || this.getCurrentTenantId();
    const cacheKey = `permissions:list:${currentTenantId}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Permission[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 性能优化：只在需要时加载 roles 关联，使用 select 优化查询
    const permissions = await this.permissionRepository.find({
      where: { tenantId: currentTenantId },
      relations: ['roles'],
      order: { resource: 'ASC', action: 'ASC' },
      // 性能优化：如果不需要 roles 的详细信息，可以移除 relations
      // 或者使用 QueryBuilder 进行更精细的控制
    });

    // 缓存结果，TTL 2 分钟（cache-manager v7 使用秒）
    await this.cacheManager.set(cacheKey, permissions, 2 * 60);

    return permissions;
  }

  /**
   * 根据 ID 查询权限
   *
   * 性能优化：添加缓存，减少数据库查询。
   *
   * @param id - 权限 ID
   * @returns 权限实体，如果不存在则返回 null
   */
  async findById(id: string): Promise<Permission | null> {
    const tenantId = this.getCurrentTenantId();
    const cacheKey = `permission:id:${id}:${tenantId}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Permission | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const permission = await this.permissionRepository.findOne({
      where: { id, tenantId },
      relations: ['roles'],
    });

    // 缓存结果（包括 null），TTL 5 分钟（cache-manager v7 使用秒）
    await this.cacheManager.set(cacheKey, permission, 5 * 60);

    return permission;
  }

  /**
   * 根据资源和操作查询权限
   *
   * 性能优化：使用缓存键复用 createOrGet 的缓存逻辑。
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
    const cacheKey = `permission:${currentTenantId}:${resource}:${action}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Permission | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const permission = await this.permissionRepository.findOne({
      where: {
        resource,
        action,
        tenantId: currentTenantId,
      },
      relations: ['roles'],
    });

    // 缓存结果（包括 null），TTL 5 分钟（cache-manager v7 使用秒）
    await this.cacheManager.set(cacheKey, permission, 5 * 60);

    return permission;
  }

  /**
   * 更新权限描述
   *
   * 性能优化：使用 update 方法直接更新，避免先查询再保存。
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

    // 性能优化：直接更新，减少查询
    const result = await this.permissionRepository.update(
      { id, tenantId },
      { description },
    );

    if (result.affected === 0) {
      throw new NotFoundException('权限不存在');
    }

    // 清除相关缓存
    await this.clearPermissionCache(id, tenantId);

    // 返回更新后的实体
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('权限不存在');
    }
    return updated;
  }

  /**
   * 清除权限相关缓存
   *
   * @private
   * @param id - 权限 ID
   * @param tenantId - 租户 ID
   */
  private async clearPermissionCache(
    id: string,
    tenantId: string,
  ): Promise<void> {
    // 清除 ID 缓存
    await this.cacheManager.del(`permission:id:${id}:${tenantId}`);
    // 清除列表缓存
    await this.cacheManager.del(`permissions:list:${tenantId}`);
    // 注意：resource:action 缓存会在下次查询时自动更新
  }

  /**
   * 删除权限
   *
   * 性能优化：先检查关联，再删除，避免不必要的查询。
   *
   * @param id - 权限 ID
   * @returns 删除结果
   * @throws {NotFoundException} 当权限不存在时抛出
   * @throws {BadRequestException} 当权限仍被角色使用时抛出
   */
  async delete(id: string): Promise<void> {
    const tenantId = this.getCurrentTenantId();

    // 性能优化：使用 count 检查关联，比加载所有 roles 更高效
    const roleCount = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.permissions', 'permission')
      .where('permission.id = :id', { id })
      .andWhere('role.tenantId = :tenantId', { tenantId })
      .getCount();

    if (roleCount > 0) {
      throw new BadRequestException(
        `权限仍被 ${roleCount} 个角色使用，无法删除`,
      );
    }

    // 性能优化：直接删除，不需要先查询
    const result = await this.permissionRepository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('权限不存在');
    }

    // 清除相关缓存
    await this.clearPermissionCache(id, tenantId);
  }

  /**
   * 为角色关联权限（通过 Permission 实体）
   *
   * 性能优化：使用 QueryBuilder 直接操作关联表，避免加载所有权限。
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
    // 性能优化：并行检查存在性和关联关系
    const [roleExists, permissionExists, isAlreadyAssigned] = await Promise.all(
      [
        this.roleRepository.count({ where: { id: roleId } }),
        this.permissionRepository.count({ where: { id: permissionId } }),
        this.roleRepository
          .createQueryBuilder('role')
          .innerJoin('role.permissions', 'permission')
          .where('role.id = :roleId', { roleId })
          .andWhere('permission.id = :permissionId', { permissionId })
          .getCount(),
      ],
    );

    if (roleExists === 0) {
      throw new NotFoundException('角色不存在');
    }

    if (permissionExists === 0) {
      throw new NotFoundException('权限不存在');
    }

    if (isAlreadyAssigned > 0) {
      return; // 已关联，直接返回
    }

    // 性能优化：使用 QueryBuilder 直接插入关联，避免加载实体
    await this.roleRepository
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(roleId)
      .add(permissionId);

    // 清除相关缓存
    await this.cacheManager.del(`role:permissions:${roleId}`);
  }

  /**
   * 取消角色与权限的关联
   *
   * 性能优化：使用 QueryBuilder 直接删除关联，避免加载实体。
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
    // 性能优化：直接检查关联是否存在
    const isAssigned = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.permissions', 'permission')
      .where('role.id = :roleId', { roleId })
      .andWhere('permission.id = :permissionId', { permissionId })
      .getCount();

    if (isAssigned === 0) {
      return; // 没有关联，直接返回
    }

    // 性能优化：使用 QueryBuilder 直接删除关联
    await this.roleRepository
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(roleId)
      .remove(permissionId);

    // 清除相关缓存
    await this.cacheManager.del(`role:permissions:${roleId}`);
  }

  /**
   * 查询角色拥有的所有权限（通过 Permission 实体）
   *
   * 性能优化：添加缓存，使用 QueryBuilder 优化查询。
   *
   * @param roleId - 角色 ID
   * @returns 权限列表
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const cacheKey = `role:permissions:${roleId}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Permission[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 性能优化：先检查角色是否存在
    const roleExists = await this.roleRepository.count({
      where: { id: roleId },
    });

    if (roleExists === 0) {
      throw new NotFoundException('角色不存在');
    }

    // 性能优化：使用 QueryBuilder 直接查询权限，避免加载整个角色实体
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .orderBy('permission.resource', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getMany();

    // 缓存结果，TTL 2 分钟（cache-manager v7 使用秒）
    await this.cacheManager.set(cacheKey, permissions, 2 * 60);

    return permissions;
  }
}
