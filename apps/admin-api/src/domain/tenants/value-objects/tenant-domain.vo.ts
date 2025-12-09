import { ValueObject } from '@/core/entities';

/**
 * 租户域名属性接口
 *
 * 定义租户域名值对象的属性结构。
 *
 * @interface TenantDomainProps
 */
interface TenantDomainProps {
  /** 租户域名值 */
  value: string;
}

/**
 * 租户域名值对象
 *
 * 封装租户的子域名，用于基于域名的租户识别。
 * 例如：'acme' 对应 'acme.example.com'
 * 必须符合域名格式：字母、数字、连字符，不能以连字符开头或结尾。
 *
 * @class TenantDomain
 * @extends {ValueObject<TenantDomainProps>}
 * @description 租户域名值对象
 */
export class TenantDomain extends ValueObject<TenantDomainProps> {
  /**
   * 域名格式正则表达式
   *
   * 验证域名格式：字母、数字、连字符，不能以连字符开头或结尾。
   *
   * @private
   * @static
   * @type {RegExp}
   */
  private static readonly DOMAIN_REGEX =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

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
  private static readonly MAX_LENGTH = 255;

  /**
   * 构造函数
   *
   * 创建租户域名值对象，自动验证格式。
   *
   * @param {string} domain - 租户域名字符串
   * @throws {Error} 当域名格式无效时抛出异常
   *
   * @example
   * ```typescript
   * const tenantDomain = new TenantDomain('acme');
   * ```
   */
  constructor(domain: string) {
    TenantDomain.validate(domain);
    super({ value: domain.trim() });
  }

  /**
   * 获取租户域名值
   *
   * @returns {string} 租户域名字符串
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 验证租户域名格式
   *
   * 检查域名是否符合格式要求。
   *
   * @private
   * @static
   * @param {string} domain - 待验证的域名字符串
   * @throws {Error} 当域名格式无效时抛出异常
   */
  private static validate(domain: string): void {
    if (!domain || typeof domain !== 'string') {
      throw new Error('租户域名不能为空');
    }

    const trimmed = domain.trim();
    if (trimmed.length < TenantDomain.MIN_LENGTH) {
      throw new Error(`租户域名长度不能少于 ${TenantDomain.MIN_LENGTH} 个字符`);
    }

    if (trimmed.length > TenantDomain.MAX_LENGTH) {
      throw new Error(`租户域名长度不能超过 ${TenantDomain.MAX_LENGTH} 个字符`);
    }

    if (!TenantDomain.DOMAIN_REGEX.test(trimmed)) {
      throw new Error(
        '域名格式无效，只能包含字母、数字和连字符，且不能以连字符开头或结尾',
      );
    }
  }

  /**
   * 比较两个租户域名是否相等
   *
   * 值对象的相等性比较（不区分大小写）。
   *
   * @param {TenantDomain} other - 另一个租户域名值对象
   * @returns {boolean} 如果域名相同返回 true，否则返回 false
   */
  equals(other: TenantDomain): boolean {
    if (!(other instanceof TenantDomain)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * 转换为字符串
   *
   * 返回租户域名的字符串表示。
   *
   * @returns {string} 租户域名字符串
   */
  toString(): string {
    return this.value;
  }
}
