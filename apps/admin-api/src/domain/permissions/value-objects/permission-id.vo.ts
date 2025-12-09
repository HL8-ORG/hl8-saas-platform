import { UniqueEntityID } from '@/core/entities/unique-entity-id';

/**
 * 权限ID值对象
 *
 * 封装权限的唯一标识符（ULID）。
 *
 * @class PermissionId
 * @extends {UniqueEntityID}
 */
export class PermissionId extends UniqueEntityID {
  /**
   * 生成新的权限ID
   *
   * @static
   * @returns {PermissionId} 新生成的权限ID值对象
   */
  static generate(): PermissionId {
    return new PermissionId();
  }
}
