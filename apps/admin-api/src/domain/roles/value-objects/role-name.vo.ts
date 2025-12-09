import { ValueObject } from '@/core/entities';

/**
 * 角色名称属性接口
 *
 * 定义角色名称值对象的属性结构。
 *
 * @interface RoleNameProps
 */
interface RoleNameProps {
  /** 角色名称值 */
  value: string;
}

/**
 * 角色名称值对象
 *
 * 封装角色名称，提供类型安全和验证。
 * 角色名称必须唯一（在租户内），长度限制为2-50个字符。
 *
 * @class RoleName
 * @extends {ValueObject<RoleNameProps>}
 * @description 角色名称值对象
 */
export class RoleName extends ValueObject<RoleNameProps> {
  /**
   * 最小长度
   *
   * @private
   * @static
   * @type {number}
   */
  private static readonly MIN_LENGTH = 2;

  /**
   * 最大长度
   *
   * @private
   * @static
   * @type {number}
   */
  private static readonly MAX_LENGTH = 50;

  /**
   * 构造函数
   *
   * 创建角色名称值对象，自动验证格式。
   *
   * @param {string} name - 角色名称字符串
   * @throws {Error} 当名称格式无效时抛出异常
   *
   * @example
   * ```typescript
   * const roleName = new RoleName('admin');
   * ```
   */
  constructor(name: string) {
    RoleName.validate(name);
    super({ value: name.trim() });
  }

  /**
   * 获取角色名称值
   *
   * @returns {string} 角色名称字符串
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * 验证角色名称格式
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
      throw new Error('角色名称不能为空');
    }

    const trimmed = name.trim();
    if (trimmed.length < RoleName.MIN_LENGTH) {
      throw new Error(`角色名称长度不能少于 ${RoleName.MIN_LENGTH} 个字符`);
    }

    if (trimmed.length > RoleName.MAX_LENGTH) {
      throw new Error(`角色名称长度不能超过 ${RoleName.MAX_LENGTH} 个字符`);
    }
  }

  /**
   * 比较两个角色名称是否相等
   *
   * 值对象的相等性比较（不区分大小写）。
   *
   * @param {RoleName} other - 另一个角色名称值对象
   * @returns {boolean} 如果名称相同返回 true，否则返回 false
   */
  equals(other: RoleName): boolean {
    if (!(other instanceof RoleName)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * 转换为字符串
   *
   * 返回角色名称的字符串表示。
   *
   * @returns {string} 角色名称字符串
   */
  toString(): string {
    return this.value;
  }
}
