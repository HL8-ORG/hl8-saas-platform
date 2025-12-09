/**
 * 更新个人资料输出DTO
 *
 * 返回更新后的用户个人资料信息（已脱敏）。
 *
 * @class UpdateProfileOutputDto
 * @description 更新个人资料用例的输出DTO
 */
export class UpdateProfileOutputDto {
  /**
   * 用户ID
   *
   * @type {string}
   */
  public readonly id: string;

  /**
   * 用户邮箱
   *
   * @type {string}
   */
  public readonly email: string;

  /**
   * 用户全名
   *
   * @type {string}
   */
  public readonly fullName: string;

  /**
   * 用户角色
   *
   * @type {string}
   */
  public readonly role: string;

  /**
   * 是否激活
   *
   * @type {boolean}
   */
  public readonly isActive: boolean;

  /**
   * 邮箱是否已验证
   *
   * @type {boolean}
   */
  public readonly isEmailVerified: boolean;

  /**
   * 创建时间
   *
   * @type {Date}
   */
  public readonly createdAt: Date;

  /**
   * 更新时间
   *
   * @type {Date}
   */
  public readonly updatedAt: Date;

  /**
   * 构造函数
   *
   * 创建更新个人资料输出DTO实例。
   *
   * @param {object} props - 用户属性
   */
  constructor(props: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.fullName = props.fullName;
    this.role = props.role;
    this.isActive = props.isActive;
    this.isEmailVerified = props.isEmailVerified;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
