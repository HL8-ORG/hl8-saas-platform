import { ValueObject } from '@/core/entities';

/**
 * 邮箱属性接口
 *
 * 定义邮箱值对象的属性结构。
 *
 * @interface EmailProps
 */
interface EmailProps {
  /** 邮箱地址值 */
  value: string;
}

/**
 * 邮箱值对象
 *
 * 封装邮箱地址，提供邮箱格式验证和业务规则。
 * 遵循充血模型，值对象包含验证逻辑。
 * 继承 ValueObject 基类，使用统一的值对象结构。
 *
 * @class Email
 * @extends {ValueObject<EmailProps>}
 * @description 邮箱地址值对象，包含格式验证
 */
export class Email extends ValueObject<EmailProps> {
  /**
   * 邮箱地址正则表达式
   *
   * 用于验证邮箱格式是否符合标准。
   *
   * @private
   * @static
   * @type {RegExp}
   */
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * 构造函数
   *
   * 创建邮箱值对象，自动验证邮箱格式。
   *
   * @param {string} email - 邮箱地址字符串
   * @throws {Error} 当邮箱格式无效时抛出异常
   *
   * @example
   * ```typescript
   * const email = new Email('user@example.com');
   * console.log(email.value); // 'user@example.com'
   * ```
   */
  constructor(email: string) {
    const validatedEmail = Email.validateAndNormalize(email);
    super({ value: validatedEmail });
  }

  /**
   * 获取邮箱地址值
   *
   * @returns {string} 邮箱地址字符串
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 验证并规范化邮箱格式
   *
   * 检查邮箱地址是否符合标准格式，并返回规范化后的邮箱地址。
   *
   * @private
   * @static
   * @param {string} email - 待验证的邮箱地址
   * @returns {string} 规范化后的邮箱地址
   * @throws {Error} 当邮箱格式无效时抛出异常
   */
  private static validateAndNormalize(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('邮箱地址不能为空');
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0) {
      throw new Error('邮箱地址不能为空');
    }

    if (trimmedEmail.length > 100) {
      throw new Error('邮箱地址长度不能超过100个字符');
    }

    if (!Email.EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('邮箱地址格式无效');
    }

    return trimmedEmail.toLowerCase();
  }

  /**
   * 比较两个邮箱是否相等
   *
   * 值对象的相等性比较，比较邮箱值（忽略大小写）。
   *
   * @param {Email} other - 另一个邮箱值对象
   * @returns {boolean} 如果邮箱地址相同返回 true，否则返回 false
   */
  equals(other: Email): boolean {
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * 转换为字符串
   *
   * 返回邮箱地址的字符串表示。
   *
   * @returns {string} 邮箱地址字符串
   */
  toString(): string {
    return this.value;
  }
}
