import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { ITenantResolver } from '../../../application/shared/interfaces/tenant-resolver.interface';
import { DeleteUserCommand } from '../../../application/users/commands/delete-user.command';
import { UpdateProfileCommand } from '../../../application/users/commands/update-profile.command';
import { UpdateUserCommand } from '../../../application/users/commands/update-user.command';
import { GetProfileQuery } from '../../../application/users/queries/get-profile.query';
import { GetUserByIdQuery } from '../../../application/users/queries/get-user-by-id.query';
import { GetUsersQuery } from '../../../application/users/queries/get-users.query';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/guards/roles.guard';
import { PaginationDto } from '../../dtos/users/pagination.dto';
import { UpdateProfileDto } from '../../dtos/users/update-profile.dto';
import { UpdateUserDto } from '../../dtos/users/update-user.dto';

/**
 * 用户控制器
 *
 * 处理用户相关的 REST API 请求。
 * 使用 CQRS 架构，通过 CommandBus 和 QueryBus 处理请求。
 *
 * **权限控制**：
 * - 个人资料路由：所有认证用户可访问
 * - 管理员路由：仅 ADMIN 角色可访问
 *
 * @class UsersController
 * @description 用户管理的 REST API 控制器（CQRS）
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  /**
   * 获取个人资料
   *
   * 获取当前登录用户的个人资料信息。
   *
   * @param {string} userId - 用户 ID（从 JWT 载荷中提取）
   * @returns {Promise<any>} 用户信息（已脱敏）
   */
  @Get('/profile')
  async getProfile(@GetUser('sub') userId: string) {
    return this.queryBus.execute(new GetProfileQuery(userId));
  }

  /**
   * 更新个人资料
   *
   * 更新当前登录用户的个人资料信息。
   *
   * @param {string} userId - 用户 ID（从 JWT 载荷中提取）
   * @param {UpdateProfileDto} updateProfileDto - 更新个人资料的 DTO
   * @returns {Promise<any>} 更新后的用户信息（已脱敏）
   */
  @Patch('/profile')
  async updateProfile(
    @GetUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.commandBus.execute(
      new UpdateProfileCommand(userId, updateProfileDto.fullName!),
    );
  }

  /**
   * 获取所有用户（管理员）
   *
   * 分页查询系统中的所有激活用户。
   *
   * **权限要求**：ADMIN 角色
   *
   * @param {PaginationDto} paginationDto - 分页参数 DTO
   * @returns {Promise<Object>} 用户列表和分页元数据
   */
  @Roles(UserRole.ADMIN)
  @Get('/')
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.queryBus.execute(
      new GetUsersQuery(tenantId, paginationDto.page, paginationDto.limit),
    );
  }

  /**
   * 根据 ID 获取用户（管理员）
   *
   * 根据用户 ID 查询用户信息。
   *
   * **权限要求**：ADMIN 角色
   *
   * @param {string} id - 用户唯一标识符
   * @returns {Promise<any>} 用户信息（已脱敏），如果用户不存在则返回 null
   */
  @Roles(UserRole.ADMIN)
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.queryBus.execute(new GetUserByIdQuery(id, tenantId));
  }

  /**
   * 根据 ID 更新用户（管理员）
   *
   * 更新指定用户的信息。
   *
   * **权限要求**：ADMIN 角色
   *
   * @param {string} id - 用户唯一标识符
   * @param {UpdateUserDto} updateUserDto - 更新用户的 DTO
   * @returns {Promise<any>} 更新后的用户信息（已脱敏）
   */
  @Roles(UserRole.ADMIN)
  @Patch('/:id')
  async updateUserById(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.commandBus.execute(
      new UpdateUserCommand(
        id,
        tenantId,
        updateUserDto.fullName,
        updateUserDto.role,
        updateUserDto.isActive,
      ),
    );
  }

  /**
   * 删除用户（管理员）
   *
   * 软删除指定用户，将 isActive 设置为 false，并删除所有刷新令牌。
   *
   * **权限要求**：ADMIN 角色
   *
   * **业务规则**：
   * - 软删除：设置 isActive = false，不物理删除数据
   * - 删除用户的所有刷新令牌，强制所有设备登出
   *
   * @param {string} id - 用户唯一标识符
   * @returns {Promise<Object>} 删除成功消息
   */
  @Roles(UserRole.ADMIN)
  @Delete('/:id')
  async deleteUserById(@Param('id') id: string) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.commandBus.execute(new DeleteUserCommand(id, tenantId));
  }
}
