import { IsEmail, IsString } from 'class-validator';
import { IsStrongPassword } from 'src/common/validators/password.validator';

/**
 * 登录数据传输对象
 *
 * 用于用户登录请求的数据验证。
 *
 * @class LoginDto
 * @description 用户登录请求的 DTO
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
}
