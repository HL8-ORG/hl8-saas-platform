import { Permission } from '../../../infrastructure/persistence/typeorm/entities/permission.entity';

/**
 * 权限服务接口
 *
 * 定义权限管理的服务接口，用于解耦应用层和基础设施层。
 * 提供权限实体的 CRUD 操作和权限与角色的关联管理。
 *
 * @interface IPermissionsService
 * @description 权限管理服务接口
 */
export interface IPermissionsService {
  /**
   * 创建或获取权限
   *
   * 如果权限已存在（相同的 resource + action + tenantId），则返回现有权限。
   * 如果不存在，则创建新权限。
   *
   * @param permissionData - 权限数据
   * @param permissionData.resource - 资源标识
   * @param permissionData.action - 操作类型
   * @param permissionData.description - 权限描述（可选）
   * @param permissionData.tenantId - 租户 ID（可选，如果未提供则使用当前租户）
   * @returns 权限实体
   */
  createOrGet(permissionData: {
    resource: string;
    action: string;
    description?: string;
    tenantId?: string;
  }): Promise<Permission>;

  /**
   * 查询所有权限
   *
   * 默认过滤当前租户的权限。
   *
   * @param tenantId - 租户 ID（可选，如果未提供则使用当前租户）
   * @returns 权限列表
   */
  findAll(tenantId?: string): Promise<Permission[]>;

  /**
   * 根据 ID 查询权限
   *
   * @param id - 权限 ID
   * @returns 权限实体，如果不存在则返回 null
   */
  findById(id: string): Promise<Permission | null>;

  /**
   * 根据资源和操作查询权限
   *
   * @param resource - 资源标识
   * @param action - 操作类型
   * @param tenantId - 租户 ID（可选）
   * @returns 权限实体，如果不存在则返回 null
   */
  findByResourceAndAction(
    resource: string,
    action: string,
    tenantId?: string,
  ): Promise<Permission | null>;

  /**
   * 更新权限描述
   *
   * @param id - 权限 ID
   * @param description - 新的描述
   * @returns 更新后的权限实体
   * @throws {NotFoundException} 当权限不存在时抛出
   */
  updateDescription(id: string, description: string): Promise<Permission>;

  /**
   * 删除权限
   *
   * @param id - 权限 ID
   * @returns 删除结果
   * @throws {NotFoundException} 当权限不存在时抛出
   * @throws {BadRequestException} 当权限仍被角色使用时抛出
   */
  delete(id: string): Promise<void>;

  /**
   * 为角色关联权限（通过 Permission 实体）
   *
   * @param roleId - 角色 ID
   * @param permissionId - 权限 ID
   * @returns 关联结果
   * @throws {NotFoundException} 当角色或权限不存在时抛出
   */
  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;

  /**
   * 取消角色与权限的关联
   *
   * @param roleId - 角色 ID
   * @param permissionId - 权限 ID
   * @returns 取消关联结果
   * @throws {NotFoundException} 当角色或权限不存在时抛出
   */
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;

  /**
   * 查询角色拥有的所有权限（通过 Permission 实体）
   *
   * @param roleId - 角色 ID
   * @returns 权限列表
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  getRolePermissions(roleId: string): Promise<Permission[]>;
}
