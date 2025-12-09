import { IsEmail, IsString, Length } from 'class-validator';

/**
 * 邮箱验证HTTP请求DTO
 *
 * 用于HTTP请求的数据验证和类型定义。
 *
 * @class VerifyEmailDto
 * @description 邮箱验证HTTP请求DTO
 */
export class VerifyEmailDto {
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
   * 邮箱验证码
   *
   * 6 位数字验证码。
   *
   * @type {string}
   */
  @IsString()
  @Length(6, 6, { message: '验证码必须是 6 位数字' })
  code: string;
}
