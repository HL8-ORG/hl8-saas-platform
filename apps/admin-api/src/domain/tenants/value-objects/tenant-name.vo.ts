import { ValueObject } from '@/core/entities';

/**
 * 租户名称属性接口
 *
 * 定义租户名称值对象的属性结构。
 *
 * @interface TenantNameProps
 */
interface TenantNameProps {
  /** 租户名称值 */
  value: string;
}

/**
 * 租户名称值对象
 *
 * 封装租户名称，提供类型安全和验证。
 * 租户名称必须唯一，长度限制为1-100个字符。
 *
 * @class TenantName
 * @extends {ValueObject<TenantNameProps>}
 * @description 租户名称值对象
 */
export class TenantName extends ValueObject<TenantNameProps> {
  /**
   * 最小长度
   *
   * @private
   * @static
   * @type {number}
   */
  private static readonly MIN_LENGTH = 1;

  /**
   * 最大长度
   *
   * @private
   * @static
   * @type {number}
   */
  private static readonly MAX_LENGTH = 100;

  /**
   * 构造函数
   *
   * 创建租户名称值对象，自动验证格式。
   *
   * @param {string} name - 租户名称字符串
   * @throws {Error} 当名称格式无效时抛出异常
   *
   * @example
   * ```typescript
   * const tenantName = new TenantName('Acme Corporation');
   * ```
   */
  constructor(name: string) {
    TenantName.validate(name);
    super({ value: name.trim() });
  }

  /**
   * 获取租户名称值
   *
   * @returns {string} 租户名称字符串
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 验证租户名称格式
   *
   * 检查名称是否符合格式要求（非空、长度限制）。
   *
   * @private
   * @static
   * @param {string} name - 待验证的名称字符串
   * @throws {Error} 当名称格式无效时抛出异常
   */
  private static validate(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('租户名称不能为空');
    }

    const trimmed = name.trim();
    if (trimmed.length < TenantName.MIN_LENGTH) {
      throw new Error(`租户名称长度不能少于 ${TenantName.MIN_LENGTH} 个字符`);
    }

    if (trimmed.length > TenantName.MAX_LENGTH) {
      throw new Error(`租户名称长度不能超过 ${TenantName.MAX_LENGTH} 个字符`);
    }
  }

  /**
   * 比较两个租户名称是否相等
   *
   * 值对象的相等性比较（不区分大小写）。
   *
   * @param {TenantName} other - 另一个租户名称值对象
   * @returns {boolean} 如果名称相同返回 true，否则返回 false
   */
  equals(other: TenantName): boolean {
    if (!(other instanceof TenantName)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * 转换为字符串
   *
   * 返回租户名称的字符串表示。
   *
   * @returns {string} 租户名称字符串
   */
  toString(): string {
    return this.value;
  }
}
