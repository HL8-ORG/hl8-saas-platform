import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { Permission } from '../entities/permission.aggregate';
import { PermissionId } from '../value-objects/permission-id.vo';

/**
 * 权限只读仓储接口
 *
 * 用于查询权限信息的只读仓储。
 * 遵循 CQRS 模式，专门用于查询操作。
 *
 * @interface IPermissionReadRepository
 */
export interface IPermissionReadRepository {
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
   * 查询所有权限
   *
   * @param {TenantId} tenantId
   * @returns {Promise<Permission[]>}
   */
  findAll(tenantId: TenantId): Promise<Permission[]>;
}
