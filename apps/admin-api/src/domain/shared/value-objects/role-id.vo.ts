import { UniqueEntityID } from '@/core/entities/unique-entity-id';

/**
 * 角色ID值对象
 *
 * 封装角色唯一标识符（ULID）。
 *
 * @class RoleId
 * @extends {UniqueEntityID}
 */
export class RoleId extends UniqueEntityID {
  /**
   * 生成新的角色ID
   *
   * @static
   * @returns {RoleId} 新生成的角色ID值对象
   */
  static generate(): RoleId {
    return new RoleId();
  }
}
