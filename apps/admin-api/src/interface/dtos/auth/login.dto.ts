import { IsEmail, IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password.validator';

/**
 * 用户登录HTTP请求DTO
 *
 * 用于HTTP请求的数据验证和类型定义。
 *
 * @class LoginDto
 * @description 用户登录HTTP请求DTO
 */
export class LoginDto {
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
   * 必须符合强密码要求。
   *
   * @type {string}
   */
  @IsString()
  @IsStrongPassword()
  password: string;
}
