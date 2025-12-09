import { ulid } from 'ulid';

/**
 * ULID 生成器
 *
 * @description 提供 ULID（Universally Unique Lexicographically Sortable Identifier）生成功能
 *
 * @class UlidGenerator
 */
export class UlidGenerator {
  /**
   * 生成新的 ULID
   *
   * @description 生成一个全局唯一且按字典序可排序的标识符
   *
   * @returns 返回新的 ULID 字符串
   *
   * @example
   * ```typescript
   * const id = UlidGenerator.generate();
   * // 返回类似: '01ARZ3NDEKTSV4RRFFQ69G5FAV'
   * ```
   */
  public static generate(): string {
    return ulid();
  }
}
