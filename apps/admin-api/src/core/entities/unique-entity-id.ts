import { UlidGenerator } from '../utils/id.util';

/**
 * 唯一实体标识符
 *
 * 用于为领域实体生成和封装唯一标识符的值对象。
 * 使用 ULID（Universally Unique Lexicographically Sortable Identifier）作为标识符格式。
 * 如果未提供值，则自动生成 ULID。
 *
 * **ULID 优势**：
 * - 按字典序可排序，便于数据库索引和查询优化
 * - 包含时间戳信息，便于按时间排序
 * - 使用 Crockford's Base32 编码，URL 安全
 * - 26 个字符，比 UUID 更紧凑
 *
 * @class UniqueEntityID
 * @description 实体唯一标识符的值对象，封装 ULID 格式的标识符
 */
export class UniqueEntityID {
  /**
   * ULID 正则表达式
   *
   * 用于验证 ULID 格式。ULID 使用 Crockford's Base32 编码，包含 0-9 和 A-Z（排除 I, L, O, U），
   * 总长度为 26 个字符。
   *
   * @private
   * @static
   * @type {RegExp}
   */
  private static readonly ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

  /**
   * 标识符值
   *
   * 存储实体的唯一标识符字符串（ULID 格式）。
   *
   * @private
   * @type {string}
   */
  private value: string;

  /**
   * 转换为字符串
   *
   * @returns {string} 标识符的字符串表示
   */
  toString() {
    return this.value;
  }

  /**
   * 获取值
   *
   * @returns {string} 标识符的值
   */
  toValue() {
    return this.value;
  }

  /**
   * 构造函数
   *
   * 如果未提供值，则自动生成 ULID。
   * 如果提供了值，会验证其是否符合 ULID 格式。
   *
   * @param {string} [value] - 可选的标识符值，如果不提供则自动生成 ULID
   * @throws {Error} 当提供的值不符合 ULID 格式时抛出异常
   *
   * @example
   * ```typescript
   * // 自动生成 ULID
   * const id1 = new UniqueEntityID();
   *
   * // 使用现有 ULID
   * const id2 = new UniqueEntityID('01ARZ3NDEKTSV4RRFFQ69G5FAV');
   * ```
   */
  constructor(value?: string) {
    if (value) {
      this.validate(value);
      this.value = value;
    } else {
      this.value = UlidGenerator.generate();
    }
  }

  /**
   * 验证 ULID 格式
   *
   * 检查标识符是否符合 ULID 格式（26个字符的Base32编码字符串）。
   *
   * @private
   * @param {string} value - 待验证的标识符字符串
   * @throws {Error} 当标识符格式无效时抛出异常
   */
  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('标识符不能为空');
    }

    if (!UniqueEntityID.ULID_REGEX.test(value)) {
      throw new Error(
        '标识符格式无效，必须是有效的ULID（26个字符的Base32编码）',
      );
    }
  }

  /**
   * 比较两个标识符是否相等
   *
   * @param {UniqueEntityID} id - 要比较的标识符
   * @returns {boolean} 如果相等则返回 true，否则返回 false
   */
  public equals(id: UniqueEntityID) {
    return id.toValue() === this.value;
  }
}
