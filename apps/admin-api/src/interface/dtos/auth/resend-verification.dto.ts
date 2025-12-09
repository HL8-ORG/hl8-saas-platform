import { IsEmail } from 'class-validator';

/**
 * 重新发送验证邮件HTTP请求DTO
 *
 * 用于HTTP请求的数据验证和类型定义。
 *
 * @class ResendVerificationDto
 * @description 重新发送验证邮件HTTP请求DTO
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
