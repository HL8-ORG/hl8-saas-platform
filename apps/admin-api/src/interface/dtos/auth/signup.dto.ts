import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password.validator';

/**
 * 用户注册HTTP请求DTO
 *
 * 用于HTTP请求的数据验证和类型定义。
 * 表现层的DTO，用于接收客户端请求。
 *
 * @class SignupDto
 * @description 用户注册HTTP请求DTO
 */
export class SignupDto {
  /**
   * 用户邮箱地址
   *
   * 必须是有效的邮箱格式。
   *
   * @type {string}
   */
  @IsEmail()
  email: string;

  /**
   * 用户密码
   *
   * 必须符合强密码要求：
   * - 至少 8 个字符
   * - 至少一个大写字母
   * - 至少一个小写字母
   * - 至少一个数字
   * - 至少一个特殊字符
   *
   * @type {string}
   */
  @IsString()
  @IsStrongPassword()
  password: string;

  /**
   * 用户全名
   *
   * 用户的全名，至少 2 个字符。
   *
   * @type {string}
   */
  @IsString()
  @MinLength(2)
  fullName: string;

  /**
   * 租户名称
   *
   * 注册时创建的租户名称。
   *
   * @type {string}
   */
  @IsString()
  @MinLength(2)
  tenantName: string;
}
