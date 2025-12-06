import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 更新个人资料数据传输对象
 *
 * 用于更新用户个人资料的数据验证。
 *
 * **安全说明**：
 * - 邮箱更新已移除：邮箱更改需要单独的验证流程以确保安全
 * - 建议在专用端点中实现邮箱更改功能，包含邮箱验证步骤
 *
 * @class UpdateProfileDto
 * @description 更新个人资料请求的 DTO
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

  // Email update removed - requires separate verification flow for security
  // Implement email change in a dedicated endpoint with verification
}
