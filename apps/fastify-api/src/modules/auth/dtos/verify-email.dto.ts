import { IsEmail, IsString, Length } from 'class-validator';

/**
 * 邮箱验证 DTO
 *
 * 用于验证用户邮箱的请求数据验证。
 *
 * @class VerifyEmailDto
 * @description 邮箱验证请求的 DTO
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
