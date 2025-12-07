import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from 'src/common/guards/roles.guard';
import { UpdateProfileDto } from './update-profile.dto';

/**
 * 更新用户数据传输对象
 *
 * 用于管理员更新用户信息的数据验证。
 * 继承自 `UpdateProfileDto`，包含用户角色和激活状态字段。
 *
 * @class UpdateUserDto
 * @extends {UpdateProfileDto}
 * @description 管理员更新用户请求的 DTO
 */
export class UpdateUserDto extends UpdateProfileDto {
  /**
   * 用户角色
   *
   * 用户的角色，必须是有效的 UserRole 枚举值。
   *
   * @type {UserRole}
   */
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole' })
  role?: UserRole;

  /**
   * 是否激活
   *
   * 用户账户的激活状态。
   *
   * @type {boolean}
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
