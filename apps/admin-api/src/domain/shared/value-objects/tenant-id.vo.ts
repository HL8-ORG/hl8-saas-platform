import { UniqueEntityID } from '@/core/entities/unique-entity-id';

/**
 * 租户ID值对象
 *
 * 封装租户唯一标识符（ULID）。
 *
 * @class TenantId
 * @extends {UniqueEntityID}
 */
export class TenantId extends UniqueEntityID {
  /**
   * 生成新的租户ID
   *
   * @static
   * @returns {TenantId} 新生成的租户ID值对象
   */
  static generate(): TenantId {
    return new TenantId();
  }
}
