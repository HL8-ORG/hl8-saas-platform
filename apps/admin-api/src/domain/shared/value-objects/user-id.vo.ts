import { UniqueEntityID } from '@/core/entities/unique-entity-id';

/**
 * 用户ID值对象
 *
 * 封装用户唯一标识符（ULID）。
 *
 * @class UserId
 * @extends {UniqueEntityID}
 */
export class UserId extends UniqueEntityID {
  /**
   * 生成新的用户ID
   *
   * @static
   * @returns {UserId} 新生成的用户ID值对象
   */
  static generate(): UserId {
    return new UserId();
  }
}
