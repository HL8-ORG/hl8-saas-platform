import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { TestAppFactory, TestDataFactory } from './helpers';

/**
 * 认证模块集成测试
 *
 * 测试认证相关的完整 API 流程，包括注册、登录、令牌刷新、登出等功能。
 *
 * @describe Auth Integration Tests
 */
describe('认证模块集成测试 (Auth Integration)', () => {
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

  describe('POST /api/v1/auth/signup', () => {
    it('应该成功注册新用户', async () => {
      const signupData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        fullName: 'New User',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/signup')
        .send(signupData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', signupData.email);
      expect(response.body.data.user).toHaveProperty(
        'fullName',
        signupData.fullName,
      );
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data).toHaveProperty(
        'message',
        'User registered successfully',
      );
    });

    it('当邮箱已存在时应该返回错误', async () => {
      const existingUser = await testDataFactory.createUser({
        email: 'existing@example.com',
      });

      const signupData = {
        email: existingUser.email,
        password: 'Password123!',
        fullName: 'New User',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/signup')
        .send(signupData)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('already in use');
    });

    it('当密码不符合要求时应该返回验证错误', async () => {
      const signupData = {
        email: 'user@example.com',
        password: 'weak',
        fullName: 'New User',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/signup')
        .send(signupData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('应该成功登录并返回令牌', async () => {
      const user = await testDataFactory.createUser({
        email: 'login@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
      });

      const loginData = {
        email: user.email,
        password: 'Password123!',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(201); // 登录接口返回 201 Created

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('id', user.id);
      expect(response.body.data.user).toHaveProperty('email', user.email);

      // 检查 Cookie 是否设置
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieArray = Array.isArray(cookies)
        ? cookies
        : [cookies].filter(Boolean);
      expect(
        cookieArray.some((cookie: string) => cookie.includes('accessToken')),
      ).toBe(true);
      expect(
        cookieArray.some((cookie: string) => cookie.includes('refreshToken')),
      ).toBe(true);
    });

    it('当密码错误时应该返回错误', async () => {
      const user = await testDataFactory.createUser({
        email: 'login@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
      });

      const loginData = {
        email: user.email,
        password: 'WrongPassword123!',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('当用户不存在时应该返回错误', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('当用户未激活时应该返回错误', async () => {
      const user = await testDataFactory.createUser({
        email: 'inactive@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        isActive: false,
      });

      const loginData = {
        email: user.email,
        password: 'Password123!',
      };

      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('应该成功刷新令牌', async () => {
      const user = await testDataFactory.createUser();

      // 首先登录获取有效的刷新令牌
      const loginResponse = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Password123!',
        })
        .expect(201); // 登录接口返回 201 Created

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies)
        ? cookies
        : [cookies].filter(Boolean);
      const refreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.includes('refreshToken'),
      );

      // 使用刷新令牌刷新访问令牌
      const refreshResponse = await request(fastifyInstance.server)
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(201); // 登录接口返回 201 Created

      expect(refreshResponse.body).toHaveProperty('success', true);
      expect(refreshResponse.body.data).toHaveProperty(
        'message',
        'Tokens refreshed successfully',
      );

      // 检查新的 Cookie 是否设置
      const newCookies = refreshResponse.headers['set-cookie'];
      expect(newCookies).toBeDefined();
    });

    it('当刷新令牌无效时应该返回错误', async () => {
      const response = await request(fastifyInstance.server)
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('应该成功登出', async () => {
      const user = await testDataFactory.createUser();

      // 先登录
      const loginResponse = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Password123!',
        })
        .expect(201); // 登录接口返回 201 Created

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies)
        ? cookies
        : [cookies].filter(Boolean);
      const refreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.includes('refreshToken'),
      );

      // 登出
      const logoutResponse = await request(fastifyInstance.server)
        .post('/api/v1/auth/logout')
        .set('Cookie', refreshTokenCookie)
        .expect(201); // 登录接口返回 201 Created

      expect(logoutResponse.body).toHaveProperty('success', true);
      expect(logoutResponse.body.data).toHaveProperty(
        'message',
        'Logged out successfully',
      );
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('应该返回当前用户信息', async () => {
      const user = await testDataFactory.createUser();

      // 先登录获取访问令牌
      const loginResponse = await request(fastifyInstance.server)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Password123!',
        })
        .expect(201); // 登录接口返回 201 Created

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies)
        ? cookies
        : [cookies].filter(Boolean);
      const accessTokenCookie = cookieArray.find((cookie: string) =>
        cookie.includes('accessToken'),
      );

      // 获取当前用户信息
      const meResponse = await request(fastifyInstance.server)
        .get('/api/v1/auth/me')
        .set('Cookie', accessTokenCookie)
        .expect(200); // GET 请求返回 200 OK

      expect(meResponse.body).toHaveProperty('success', true);
      expect(meResponse.body.data).toHaveProperty('id', user.id);
      expect(meResponse.body.data).toHaveProperty('email', user.email);
      expect(meResponse.body.data).toHaveProperty('fullName', user.fullName);
    });

    it('当未提供访问令牌时应该返回错误', async () => {
      const response = await request(fastifyInstance.server)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
