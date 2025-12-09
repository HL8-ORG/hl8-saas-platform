import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';

/**
 * 根据ID获取用户输入DTO
 *
 * 用于根据用户ID查询用户信息的输入参数。
 *
 * @class GetUserByIdInputDto
 * @description 根据ID获取用户用例的输入DTO
 */
export class GetUserByIdInputDto {
  /**
   * 用户ID
   *
   * 要查询的用户ID。
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
   * 构造函数
   *
   * 创建根据ID获取用户输入DTO实例。
   *
   * @param {string} userId - 用户ID字符串
   * @param {string} tenantId - 租户ID字符串
   */
  constructor(userId: string, tenantId: string) {
    this.userId = new UserId(userId);
    this.tenantId = new TenantId(tenantId);
  }
}
