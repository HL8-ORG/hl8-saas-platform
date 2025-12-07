import { INestApplication } from '@nestjs/common';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { User, UserRole } from '../../src/entities/user.entity';
import { TestAppFactory, TestDataFactory } from './helpers';

/**
 * 用户管理模块集成测试
 *
 * 测试用户管理相关的完整 API 流程，包括个人资料管理和管理员操作。
 *
 * @describe Users Integration Tests
 */
describe('用户管理模块集成测试 (Users Integration)', () => {
  let app: INestApplication;
  let fastifyInstance: FastifyInstance;
  let testAppFactory: TestAppFactory;
  let testDataFactory: TestDataFactory;

  beforeAll(async () => {
    testAppFactory = new TestAppFactory();
    app = await testAppFactory.createApp();
    fastifyInstance = app.getHttpAdapter().getInstance();

    const dataSource = testAppFactory.getDataSource();
    testDataFactory = new TestDataFactory(dataSource);
  });

  beforeEach(async () => {
    // 在每个测试前清除 Throttler 存储，避免限流影响测试
    // 这比在 afterEach 中清除更有效，因为可以避免测试中的限流
    await testAppFactory.clearThrottlerStorage();
  });

  afterEach(async () => {
    await testAppFactory.cleanupDatabase();
    // 在每个测试之间添加延迟，避免 Throttler 限流
    // 注意：这是临时解决方案，理想情况下应该禁用 ThrottlerGuard
    // 由于我们设置了 TTL 为 50ms，等待 100ms 应该足够让限流窗口过期
    // 但如果 ThrottlerGuard 覆盖未生效，可能需要更长的延迟
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await testAppFactory.closeApp();
  });

  /**
   * 获取认证 Cookie 的辅助函数
   */
  async function getAuthCookies(
    userEmail: string,
    password: string,
  ): Promise<string[]> {
    const loginResponse = await request(fastifyInstance.server)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password })
      .expect(201); // 登录接口返回 201 Created

    const cookies = loginResponse.headers['set-cookie'];
    return Array.isArray(cookies) ? cookies : [];
  }

  describe('GET /api/v1/users/profile', () => {
    it('应该返回当前用户的个人资料', async () => {
      const user = await testDataFactory.createUser({
        email: 'profile@example.com',
        fullName: 'Profile User',
      });

      const cookies = await getAuthCookies(user.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .get('/api/v1/users/profile')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', user.id);
      expect(response.body.data).toHaveProperty('email', user.email);
      expect(response.body.data).toHaveProperty('fullName', user.fullName);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('当未认证时应该返回错误', async () => {
      const response = await request(fastifyInstance.server)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('应该成功更新个人资料', async () => {
      const user = await testDataFactory.createUser({
        email: 'update@example.com',
        fullName: 'Original Name',
      });

      const cookies = await getAuthCookies(user.email, 'Password123!');

      const updateData = {
        fullName: 'Updated Name',
      };

      const response = await request(fastifyInstance.server)
        .patch('/api/v1/users/profile')
        .set('Cookie', cookies)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('fullName', 'Updated Name');
    });

    it('当更新数据无效时应该返回验证错误', async () => {
      const user = await testDataFactory.createUser({
        email: 'update2@example.com',
      });

      const cookies = await getAuthCookies(user.email, 'Password123!');

      const updateData = {
        fullName: 'A', // 太短，不符合验证要求
      };

      const response = await request(fastifyInstance.server)
        .patch('/api/v1/users/profile')
        .set('Cookie', cookies)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/users (管理员)', () => {
    it('管理员应该能够获取所有用户列表', async () => {
      const admin = await testDataFactory.createAdminUser({
        email: 'admin@example.com',
      });

      // 创建一些测试用户
      await testDataFactory.createUsers(3);

      const cookies = await getAuthCookies(admin.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .get('/api/v1/users?page=1&limit=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('page', 1);
      expect(response.body.data.meta).toHaveProperty('limit', 10);
    });

    it('普通用户不应该能够访问管理员接口', async () => {
      const user = await testDataFactory.createUser({
        email: 'user@example.com',
      });

      const cookies = await getAuthCookies(user.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .get('/api/v1/users')
        .set('Cookie', cookies)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('应该支持分页', async () => {
      const admin = await testDataFactory.createAdminUser({
        email: 'admin2@example.com',
      });

      await testDataFactory.createUsers(15);

      const cookies = await getAuthCookies(admin.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .get('/api/v1/users?page=2&limit=5')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.data.meta).toHaveProperty('page', 2);
      expect(response.body.data.meta).toHaveProperty('limit', 5);
      expect(response.body.data.meta).toHaveProperty('hasNext');
      expect(response.body.data.meta).toHaveProperty('hasPrevious', true);
    });
  });

  describe('GET /api/v1/users/:id (管理员)', () => {
    it('管理员应该能够根据 ID 获取用户信息', async () => {
      const admin = await testDataFactory.createAdminUser({
        email: 'admin3@example.com',
      });
      const targetUser = await testDataFactory.createUser({
        email: 'target@example.com',
      });

      const cookies = await getAuthCookies(admin.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .get(`/api/v1/users/${targetUser.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', targetUser.id);
      expect(response.body.data).toHaveProperty('email', targetUser.email);
    });

    it('当用户不存在时应该返回 null', async () => {
      const admin = await testDataFactory.createAdminUser({
        email: 'admin4@example.com',
      });

      const cookies = await getAuthCookies(admin.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .get('/api/v1/users/non-existent-id')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('PATCH /api/v1/users/:id (管理员)', () => {
    it('管理员应该能够更新用户信息', async () => {
      const admin = await testDataFactory.createAdminUser({
        email: 'admin5@example.com',
      });
      const targetUser = await testDataFactory.createUser({
        email: 'target2@example.com',
        fullName: 'Original Name',
      });

      const cookies = await getAuthCookies(admin.email, 'Password123!');

      const updateData = {
        fullName: 'Updated by Admin',
        role: UserRole.ADMIN,
      };

      const response = await request(fastifyInstance.server)
        .patch(`/api/v1/users/${targetUser.id}`)
        .set('Cookie', cookies)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('fullName', 'Updated by Admin');
      expect(response.body.data).toHaveProperty('role', UserRole.ADMIN);
    });
  });

  describe('DELETE /api/v1/users/:id (管理员)', () => {
    it('管理员应该能够删除用户（软删除）', async () => {
      const admin = await testDataFactory.createAdminUser({
        email: 'admin6@example.com',
      });
      const targetUser = await testDataFactory.createUser({
        email: 'delete@example.com',
      });

      const cookies = await getAuthCookies(admin.email, 'Password123!');

      const response = await request(fastifyInstance.server)
        .delete(`/api/v1/users/${targetUser.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty(
        'message',
        'User deleted successfully',
      );

      // 验证用户已被软删除（isActive = false）
      const dataSource = testAppFactory.getDataSource();
      const deletedUser = await dataSource
        .getRepository(User)
        .findOne({ where: { id: targetUser.id } });
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.isActive).toBe(false);
    });
  });
});
