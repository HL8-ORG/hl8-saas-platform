import { IsString, MinLength } from 'class-validator';
import { LoginDto } from './login.dto';

/**
 * 注册数据传输对象
 *
 * 用于用户注册请求的数据验证。
 * 继承自 `LoginDto`，包含邮箱和密码字段。
 *
 * @class SignupDto
 * @extends {LoginDto}
 * @description 用户注册请求的 DTO
 */
export class SignupDto extends LoginDto {
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
}
