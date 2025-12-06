import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

/**
 * 用户服务类
 *
 * 负责处理用户相关的业务逻辑，包括用户资料管理和用户列表查询。
 *
 * **安全特性**：
 * - 所有返回的用户数据都经过脱敏处理（移除密码哈希和刷新令牌）
 * - 软删除：删除用户时只设置 isActive = false
 *
 * @class UsersService
 * @description 用户业务逻辑处理服务
 */
@Injectable()
export class UsersService {
  /**
   * 构造函数
   *
   * 注入用户仓库和刷新令牌仓库依赖。
   *
   * @param {Repository<User>} userRepository - 用户仓库
   * @param {Repository<RefreshToken>} refreshTokenRepository - 刷新令牌仓库
   */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * 获取个人资料
   *
   * 根据用户 ID 查询用户信息并返回脱敏后的数据。
   *
   * @param {string} userId - 用户唯一标识符
   * @returns {Promise<any>} 用户信息（已脱敏），如果用户不存在则返回 null
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    return this.sanitizeUser(user);
  }

  /**
   * 更新个人资料
   *
   * 更新用户的个人资料信息。
   *
   * @param {string} userId - 用户唯一标识符
   * @param {UpdateProfileDto} updateProfileDto - 更新个人资料的 DTO
   * @returns {Promise<any>} 更新后的用户信息（已脱敏）
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    await this.userRepository.update(userId, updateProfileDto);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * 获取所有用户（分页）
   *
   * 分页查询所有激活的用户，按创建时间倒序排列。
   *
   * **业务规则**：
   * - 只返回激活的用户（isActive = true）
   * - 按创建时间倒序排列
   * - 返回分页元数据（总数、总页数、是否有上一页/下一页）
   *
   * @param {number} [page=1] - 页码，默认为 1
   * @param {number} [limit=10] - 每页数据限制，默认为 10
   * @returns {Promise<Object>} 用户列表和分页元数据
   */
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const sanitizedUsers = users.map((user) => this.sanitizeUser(user));
    const totalPages = Math.ceil(total / limit);

    return {
      data: sanitizedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * 根据 ID 获取用户
   *
   * 根据用户 ID 查询用户信息。
   *
   * @param {string} userId - 用户唯一标识符
   * @returns {Promise<any>} 用户信息（已脱敏），如果用户不存在或 ID 为空则返回 null
   */
  async getUserById(userId: string) {
    if (!userId) {
      return null;
    }

    // 验证 UUID 格式，避免 PostgreSQL 抛出错误
    // UUID 格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * 根据 ID 更新用户
   *
   * 更新指定用户的信息。
   *
   * @param {string} userId - 用户唯一标识符
   * @param {UpdateUserDto} updateUserDto - 更新用户的 DTO
   * @returns {Promise<any>} 更新后的用户信息（已脱敏）
   */
  async updateUserById(userId: string, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(userId, updateUserDto);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * 删除用户
   *
   * 软删除指定用户，将 isActive 设置为 false，并删除所有刷新令牌。
   *
   * **业务规则**：
   * - 软删除：设置 isActive = false，不物理删除数据
   * - 删除用户的所有刷新令牌，强制所有设备登出
   *
   * @param {string} userId - 用户唯一标识符
   * @returns {Promise<Object>} 删除成功消息
   */
  async deleteUserById(userId: string) {
    // Soft delete: set isActive to false
    await this.userRepository.update(userId, { isActive: false });

    // Invalidate all refresh tokens for this user
    await this.refreshTokenRepository.delete({ userId });

    return { message: 'User deleted successfully' };
  }

  // Utils

  /**
   * 脱敏用户数据
   *
   * 移除用户对象中的敏感信息（密码哈希、刷新令牌等），返回安全的数据。
   *
   * **移除的字段**：
   * - passwordHash: 密码哈希值
   * - refreshToken: 刷新令牌（已废弃字段）
   *
   * @param {User | null} user - 用户实体对象或 null
   * @returns {any} 脱敏后的用户对象，如果输入为 null 则返回 null
   */
  sanitizeUser(user: User | null) {
    if (!user) {
      return null;
    }

    const { refreshToken, passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
