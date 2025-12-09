import { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';
import { DeleteUserInputDto } from '../../application/users/dtos/delete-user.input.dto';
import { GetProfileInputDto } from '../../application/users/dtos/get-profile.input.dto';
import { GetUserByIdInputDto } from '../../application/users/dtos/get-user-by-id.input.dto';
import { GetUsersInputDto } from '../../application/users/dtos/get-users.input.dto';
import { UpdateProfileInputDto } from '../../application/users/dtos/update-profile.input.dto';
import { UpdateUserInputDto } from '../../application/users/dtos/update-user.input.dto';
import { PaginationDto } from '../dtos/users/pagination.dto';
import { UpdateProfileDto as HttpUpdateProfileDto } from '../dtos/users/update-profile.dto';
import { UpdateUserDto as HttpUpdateUserDto } from '../dtos/users/update-user.dto';

/**
 * 用户HTTP DTO映射器
 *
 * 负责HTTP层的DTO和应用层用例DTO之间的映射转换。
 * 处理HTTP请求到用例输入参数的转换。
 *
 * @class UsersMapper
 * @description HTTP DTO ↔ 用例DTO映射器
 */
export class UsersMapper {
  /**
   * 将用户ID转换为获取个人资料用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @returns {GetProfileInputDto} 用例输入DTO
   */
  static toGetProfileInput(userId: string): GetProfileInputDto {
    return new GetProfileInputDto(userId);
  }

  /**
   * 将HTTP更新个人资料DTO转换为用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @param {HttpUpdateProfileDto} httpDto - HTTP更新个人资料DTO
   * @returns {UpdateProfileInputDto} 用例输入DTO
   */
  static toUpdateProfileInput(
    userId: string,
    httpDto: HttpUpdateProfileDto,
  ): UpdateProfileInputDto {
    return new UpdateProfileInputDto(userId, {
      fullName: httpDto.fullName,
    });
  }

  /**
   * 将分页参数和租户ID转换为获取用户列表用例输入DTO
   *
   * @param {PaginationDto} paginationDto - 分页参数DTO
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<GetUsersInputDto>} 用例输入DTO
   */
  static async toGetUsersInput(
    paginationDto: PaginationDto,
    tenantResolver: ITenantResolver,
  ): Promise<GetUsersInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new GetUsersInputDto({
      tenantId,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  /**
   * 将用户ID和租户ID转换为根据ID获取用户用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<GetUserByIdInputDto>} 用例输入DTO
   */
  static async toGetUserByIdInput(
    userId: string,
    tenantResolver: ITenantResolver,
  ): Promise<GetUserByIdInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new GetUserByIdInputDto(userId, tenantId);
  }

  /**
   * 将HTTP更新用户DTO转换为用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @param {HttpUpdateUserDto} httpDto - HTTP更新用户DTO
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<UpdateUserInputDto>} 用例输入DTO
   */
  static async toUpdateUserInput(
    userId: string,
    httpDto: HttpUpdateUserDto,
    tenantResolver: ITenantResolver,
  ): Promise<UpdateUserInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new UpdateUserInputDto(userId, tenantId, {
      fullName: httpDto.fullName,
      role: httpDto.role,
      isActive: httpDto.isActive,
    });
  }

  /**
   * 将用户ID和租户ID转换为删除用户用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<DeleteUserInputDto>} 用例输入DTO
   */
  static async toDeleteUserInput(
    userId: string,
    tenantResolver: ITenantResolver,
  ): Promise<DeleteUserInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new DeleteUserInputDto(userId, tenantId);
  }
}
