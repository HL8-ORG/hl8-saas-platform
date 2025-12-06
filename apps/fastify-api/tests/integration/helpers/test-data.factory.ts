import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../../../src/entities/refresh-token.entity';
import { User, UserRole } from '../../../src/entities/user.entity';

/**
 * 测试数据工厂
 *
 * 用于创建测试数据，包括用户、刷新令牌等。
 *
 * @class TestDataFactory
 */
export class TestDataFactory {
  /**
   * 构造函数
   *
   * @param {DataSource} dataSource - TypeORM 数据源
   */
  constructor(private dataSource: DataSource) {}

  /**
   * 创建测试用户
   *
   * @param {Partial<User>} [overrides] - 用户属性覆盖
   * @returns {Promise<User>} 创建的用户实体
   */
  async createUser(overrides?: Partial<User>): Promise<User> {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash('Password123!', 12),
      fullName: 'Test User',
      role: UserRole.USER,
      isActive: true,
      ...overrides,
    };

    const user = this.dataSource.getRepository(User).create(defaultUser);
    return this.dataSource.getRepository(User).save(user);
  }

  /**
   * 创建管理员用户
   *
   * @param {Partial<User>} [overrides] - 用户属性覆盖
   * @returns {Promise<User>} 创建的管理员用户实体
   */
  async createAdminUser(overrides?: Partial<User>): Promise<User> {
    return this.createUser({
      role: UserRole.ADMIN,
      email: `admin-${Date.now()}@example.com`,
      ...overrides,
    });
  }

  /**
   * 创建刷新令牌
   *
   * @param {string} userId - 用户 ID
   * @param {Partial<RefreshToken>} [overrides] - 令牌属性覆盖
   * @returns {Promise<RefreshToken>} 创建的刷新令牌实体
   */
  async createRefreshToken(
    userId: string,
    overrides?: Partial<RefreshToken>,
  ): Promise<RefreshToken> {
    const hashedToken = await bcrypt.hash('test-refresh-token', 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 天后过期

    const defaultToken = {
      token: hashedToken,
      userId,
      deviceInfo: 'Test Device',
      ipAddress: '127.0.0.1',
      expiresAt,
      ...overrides,
    };

    const token = this.dataSource
      .getRepository(RefreshToken)
      .create(defaultToken);
    return this.dataSource.getRepository(RefreshToken).save(token);
  }

  /**
   * 创建多个测试用户
   *
   * @param {number} count - 要创建的用户数量
   * @param {Partial<User>} [overrides] - 用户属性覆盖
   * @returns {Promise<User[]>} 创建的用户实体数组
   */
  async createUsers(count: number, overrides?: Partial<User>): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(
        await this.createUser({
          email: `test-${Date.now()}-${i}@example.com`,
          ...overrides,
        }),
      );
    }
    return users;
  }
}
