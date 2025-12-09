import { ValueObject } from '@/core/entities';

/**
 * 密码哈希属性接口
 *
 * 定义密码哈希值对象的属性结构。
 *
 * @interface PasswordHashProps
 */
interface PasswordHashProps {
  /** bcrypt 哈希值 */
  value: string;
}

/**
 * 密码哈希值对象
 *
 * 封装密码哈希值，不包含哈希生成逻辑（哈希生成属于基础设施层）。
 * 值对象仅负责封装和验证哈希值的格式。
 * 继承 ValueObject 基类，使用统一的值对象结构。
 *
 * @class PasswordHash
 * @extends {ValueObject<PasswordHashProps>}
 * @description 密码哈希值对象，封装 bcrypt 哈希字符串
 */
export class PasswordHash extends ValueObject<PasswordHashProps> {
  /**
   * 构造函数
   *
   * 创建密码哈希值对象，验证哈希格式。
   *
   * @param {string} hash - bcrypt 哈希字符串
   * @throws {Error} 当哈希格式无效时抛出异常
   *
   * @example
   * ```typescript
   * const hash = new PasswordHash('$2b$12$...');
   * ```
   */
  constructor(hash: string) {
    PasswordHash.validate(hash);
    super({ value: hash });
  }

  /**
   * 获取 bcrypt 哈希值
   *
   * bcrypt 哈希字符串，格式为：$2a$xx$... 或 $2b$xx$...
   *
   * @returns {string} bcrypt 哈希字符串
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 验证哈希格式
   *
   * 检查哈希值是否符合 bcrypt 格式。
   *
   * @private
   * @static
   * @param {string} hash - 待验证的哈希字符串
   * @throws {Error} 当哈希格式无效时抛出异常
   */
  private static validate(hash: string): void {
    if (!hash || typeof hash !== 'string') {
      throw new Error('密码哈希值不能为空');
    }

    // bcrypt 哈希格式：$2a$xx$... 或 $2b$xx$...，长度通常为 60 个字符
    if (!hash.startsWith('$2')) {
      throw new Error('密码哈希格式无效，必须是 bcrypt 哈希');
    }

    if (hash.length < 60) {
      throw new Error('密码哈希长度无效');
    }
  }

  /**
   * 比较两个密码哈希是否相等
   *
   * 值对象的相等性比较。
   *
   * @param {PasswordHash} other - 另一个密码哈希值对象
   * @returns {boolean} 如果哈希值相同返回 true，否则返回 false
   */
  equals(other: PasswordHash): boolean {
    if (!(other instanceof PasswordHash)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * 转换为字符串
   *
   * 返回密码哈希的字符串表示。
   *
   * @returns {string} 密码哈希字符串
   */
  toString(): string {
    return this.value;
  }
}
