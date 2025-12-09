import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../application/shared/interfaces/password-hasher.interface';

/**
 * 密码哈希服务实现
 *
 * 基于 bcrypt 的密码哈希服务实现。
 * 使用 bcrypt 盐值 12 轮进行密码哈希。
 *
 * @class PasswordHasherService
 * @implements {IPasswordHasher}
 * @description 密码哈希服务实现
 */
@Injectable()
export class PasswordHasherService implements IPasswordHasher {
  /**
   * 哈希密码
   *
   * 使用 bcrypt 对密码进行哈希，盐值 12 轮。
   *
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 密码哈希值
   *
   * @example
   * ```typescript
   * const hash = await passwordHasher.hash('myPassword123');
   * ```
   */
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   *
   * 比较明文密码和哈希值是否匹配。
   *
   * @param {string} password - 明文密码
   * @param {string} hash - 密码哈希值
   * @returns {Promise<boolean>} 如果密码匹配返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const isValid = await passwordHasher.verify('myPassword123', hash);
   * ```
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
