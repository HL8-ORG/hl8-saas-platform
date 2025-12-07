import { IsEmail } from 'class-validator';

/**
 * 重新发送验证邮件 DTO
 *
 * 用于重新发送邮箱验证邮件的请求数据验证。
 *
 * @class ResendVerificationDto
 * @description 重新发送验证邮件请求的 DTO
 */
export class ResendVerificationDto {
  /**
   * 用户邮箱地址
   *
   * 必须是有效的邮箱格式。
   *
   * @type {string}
   */
  @IsEmail()
  email: string;
}
