import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 更新个人资料HTTP DTO
 *
 * 用于更新用户个人资料的HTTP请求数据验证。
 *
 * @class UpdateProfileDto
 * @description 更新个人资料请求的HTTP DTO
 */
export class UpdateProfileDto {
  /**
   * 用户全名
   *
   * 用户的全名，长度在 2-100 个字符之间。
   *
   * @type {string}
   */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;
}
