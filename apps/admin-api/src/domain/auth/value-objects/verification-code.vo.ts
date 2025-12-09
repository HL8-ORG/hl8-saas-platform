import { ValueObject } from '@/core/entities';

/**
 * 验证码属性接口
 *
 * 定义验证码值对象的属性结构。
 *
 * @interface VerificationCodeProps
 */
interface VerificationCodeProps {
  /** 验证码值（6位数字） */
  value: string;
  /** 过期时间 */
  expiresAt: Date;
}

/**
 * 验证码值对象
 *
 * 封装邮箱验证码，提供验证码生成和验证逻辑。
 * 验证码为6位数字，具有过期时间。
 * 继承 ValueObject 基类，使用统一的值对象结构。
 *
 * @class VerificationCode
 * @extends {ValueObject<VerificationCodeProps>}
 * @description 邮箱验证码值对象，包含生成和验证逻辑
 */
export class VerificationCode extends ValueObject<VerificationCodeProps> {
  /**
   * 验证码长度
   *
   * 默认验证码长度为6位数字。
   *
   * @private
   * @static
   * @type {number}
   */
  private static readonly CODE_LENGTH = 6;

  /**
   * 默认过期时间（分钟）
   *
   * 验证码默认有效期为15分钟。
   *
   * @private
   * @static
   * @type {number}
   */
  private static readonly DEFAULT_EXPIRY_MINUTES = 15;

  /**
   * 构造函数
   *
   * 创建验证码值对象，自动验证格式。
   *
   * @param {string} code - 验证码字符串（6位数字）
   * @param {Date} expiresAt - 验证码过期时间
   * @throws {Error} 当验证码格式无效时抛出异常
   *
   * @example
   * ```typescript
   * const code = new VerificationCode('123456', new Date(Date.now() + 15 * 60 * 1000));
   * ```
   */
  constructor(code: string, expiresAt: Date) {
    VerificationCode.validate(code, expiresAt);
    super({ value: code, expiresAt });
  }

  /**
   * 获取验证码值
   *
   * 6位数字验证码字符串。
   *
   * @returns {string} 验证码字符串
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 获取过期时间
   *
   * 验证码的有效期限，超过此时间后验证码失效。
   *
   * @returns {Date} 过期时间
   */
  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  /**
   * 生成新的验证码
   *
   * 生成一个6位数字的随机验证码，并设置过期时间。
   *
   * @static
   * @param {number} [expiryMinutes] - 过期时间（分钟），默认15分钟
   * @returns {VerificationCode} 新生成的验证码值对象
   *
   * @example
   * ```typescript
   * const code = VerificationCode.generate(); // 默认15分钟过期
   * const code2 = VerificationCode.generate(30); // 30分钟过期
   * ```
   */
  static generate(
    expiryMinutes: number = VerificationCode.DEFAULT_EXPIRY_MINUTES,
  ): VerificationCode {
    const code = VerificationCode.generateCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return new VerificationCode(code, expiresAt);
  }

  /**
   * 生成6位数字验证码
   *
   * 生成一个随机的6位数字字符串。
   *
   * @private
   * @static
   * @returns {string} 6位数字验证码
   */
  private static generateCode(): string {
    const min = 100000;
    const max = 999999;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString();
  }

  /**
   * 验证验证码格式和过期时间
   *
   * 检查验证码是否符合6位数字格式，以及过期时间是否有效。
   *
   * @private
   * @static
   * @param {string} code - 待验证的验证码字符串
   * @param {Date} expiresAt - 过期时间
   * @throws {Error} 当验证码格式无效或过期时间无效时抛出异常
   */
  private static validate(code: string, expiresAt: Date): void {
    if (!code || typeof code !== 'string') {
      throw new Error('验证码不能为空');
    }

    if (code.length !== VerificationCode.CODE_LENGTH) {
      throw new Error(`验证码长度必须为${VerificationCode.CODE_LENGTH}位数字`);
    }

    if (!/^\d+$/.test(code)) {
      throw new Error('验证码必须由数字组成');
    }

    if (!expiresAt || !(expiresAt instanceof Date)) {
      throw new Error('验证码过期时间无效');
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new Error('验证码过期时间必须大于当前时间');
    }
  }

  /**
   * 验证验证码是否匹配且未过期
   *
   * 检查提供的验证码是否与当前验证码匹配，以及是否在有效期内。
   *
   * @param {string} code - 待验证的验证码字符串
   * @returns {boolean} 如果验证码匹配且未过期返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const verificationCode = VerificationCode.generate();
   * const isValid = verificationCode.verify('123456');
   * ```
   */
  verify(code: string): boolean {
    if (!code || code !== this.value) {
      return false;
    }

    if (Date.now() > this.expiresAt.getTime()) {
      return false;
    }

    return true;
  }

  /**
   * 检查验证码是否已过期
   *
   * 检查当前时间是否已超过验证码的过期时间。
   *
   * @returns {boolean} 如果验证码已过期返回 true，否则返回 false
   */
  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  /**
   * 比较两个验证码是否相等
   *
   * 值对象的相等性比较，比较验证码值。
   *
   * @param {VerificationCode} other - 另一个验证码值对象
   * @returns {boolean} 如果验证码相同返回 true，否则返回 false
   */
  equals(other: VerificationCode): boolean {
    if (!(other instanceof VerificationCode)) {
      return false;
    }
    return (
      this.value === other.value &&
      this.expiresAt.getTime() === other.expiresAt.getTime()
    );
  }

  /**
   * 转换为字符串
   *
   * 返回验证码的字符串表示。
   *
   * @returns {string} 验证码字符串
   */
  toString(): string {
    return this.value;
  }
}
