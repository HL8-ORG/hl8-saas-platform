import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { Permission } from '../entities/permission.aggregate';
import { PermissionId } from '../value-objects/permission-id.vo';

/**
 * 权限仓储接口
 *
 * 用于管理权限的仓储接口。
 * 遵循 CQRS 模式，专门用于写操作（命令）。
 *
 * @interface IPermissionRepository
 */
export interface IPermissionRepository {
  /**
   * 根据ID查询权限
   *
   * @param {PermissionId} permissionId
   * @param {TenantId} tenantId
   * @returns {Promise<Permission | null>}
   */
  findById(
    permissionId: PermissionId,
    tenantId: TenantId,
  ): Promise<Permission | null>;

  /**
   * 根据资源和操作查询权限
   *
   * @param {string} resource
   * @param {string} action
   * @param {TenantId} tenantId
   * @returns {Promise<Permission | null>}
   */
  findByResourceAndAction(
    resource: string,
    action: string,
    tenantId: TenantId,
  ): Promise<Permission | null>;

  /**
   * 保存权限
   *
   * @param {Permission} permission
   * @returns {Promise<void>}
   */
  save(permission: Permission): Promise<void>;

  /**
   * 删除权限
   *
   * @param {PermissionId} permissionId
   * @param {TenantId} tenantId
   * @returns {Promise<void>}
   */
  delete(permissionId: PermissionId, tenantId: TenantId): Promise<void>;
}
