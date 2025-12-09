import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 用户注册事件
 *
 * 当新用户注册成功时发布的领域事件。
 * 用于触发发送验证邮件、记录审计日志等后续操作。
 *
 * @class UserRegisteredEvent
 * @extends {DomainEventBase}
 * @description 用户注册领域事件
 */
export class UserRegisteredEvent extends DomainEventBase {
  /**
   * 用户邮箱地址
   *
   * @type {string}
   * @readonly
   */
  public readonly email: string;

  /**
   * 用户全名
   *
   * @type {string}
   * @readonly
   */
  public readonly fullName: string;

  /**
   * 用户角色
   *
   * @type {string}
   * @readonly
   */
  public readonly role: string;

  /**
   * 邮箱验证码
   *
   * @type {string}
   * @readonly
   */
  public readonly verificationCode: string;

  /**
   * 构造函数
   *
   * 创建用户注册事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string} email - 用户邮箱地址
   * @param {string} fullName - 用户全名
   * @param {string} role - 用户角色
   * @param {string} verificationCode - 邮箱验证码
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new UserRegisteredEvent(userId, email, fullName, role, verificationCode, tenantId);
   * ```
   */
  constructor(
    userId: string,
    email: string,
    fullName: string,
    role: string,
    verificationCode: string,
    tenantId?: string,
  ) {
    super(userId, 'UserRegisteredEvent', tenantId);
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.verificationCode = verificationCode;
  }
}
