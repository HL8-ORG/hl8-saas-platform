import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import { UserRole } from '../../../domain/users/entities/user.aggregate';

/**
 * 更新用户输入DTO
 *
 * 用于管理员更新用户信息的输入参数。
 *
 * @class UpdateUserInputDto
 * @description 更新用户用例的输入DTO
 */
export class UpdateUserInputDto {
  /**
   * 用户ID
   *
   * 要更新的用户ID。
   *
   * @type {UserId}
   */
  public readonly userId: UserId;

  /**
   * 租户ID
   *
   * 当前租户的ID。
   *
   * @type {TenantId}
   */
  public readonly tenantId: TenantId;

  /**
   * 用户全名
   *
   * 用户的新全名，可选。
   *
   * @type {string | undefined}
   */
  public readonly fullName?: string;

  /**
   * 用户角色
   *
   * 用户的新角色，可选。
   *
   * @type {UserRole | undefined}
   */
  public readonly role?: UserRole;

  /**
   * 是否激活
   *
   * 用户的新激活状态，可选。
   *
   * @type {boolean | undefined}
   */
  public readonly isActive?: boolean;

  /**
   * 构造函数
   *
   * 创建更新用户输入DTO实例。
   *
   * @param {string} userId - 用户ID字符串
   * @param {string} tenantId - 租户ID字符串
   * @param {object} data - 更新数据
   * @param {string} [data.fullName] - 新的全名
   * @param {UserRole} [data.role] - 新的角色
   * @param {boolean} [data.isActive] - 新的激活状态
   */
  constructor(
    userId: string,
    tenantId: string,
    data: {
      fullName?: string;
      role?: UserRole;
      isActive?: boolean;
    },
  ) {
    this.userId = new UserId(userId);
    this.tenantId = new TenantId(tenantId);
    this.fullName = data.fullName;
    this.role = data.role;
    this.isActive = data.isActive;
  }
}
