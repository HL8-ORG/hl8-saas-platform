import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { UserRole } from 'src/common/guards/roles.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

/**
 * 用户控制器
 *
 * 处理用户相关的 REST API 请求。
 * 包含用户个人资料管理和管理员用户管理功能。
 *
 * **权限控制**：
 * - 个人资料路由：所有认证用户可访问
 * - 管理员路由：仅 ADMIN 角色可访问
 *
 * @class UsersController
 * @description 用户管理的 REST API 控制器
 */
@Controller('users')
export class UsersController {
  /**
   * 构造函数
   *
   * 注入用户服务依赖。
   *
   * @param {UsersService} usersService - 用户服务，处理用户业务逻辑
   */
  constructor(private readonly usersService: UsersService) {}

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
    return this.usersService.getProfile(userId);
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
    return this.usersService.updateProfile(userId, updateProfileDto);
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
    const { page = 1, limit = 10 } = paginationDto;
    return this.usersService.getAllUsers(page, limit);
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
    return this.usersService.getUserById(id);
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
    return this.usersService.updateUserById(id, updateUserDto);
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
    return this.usersService.deleteUserById(id);
  }
}
