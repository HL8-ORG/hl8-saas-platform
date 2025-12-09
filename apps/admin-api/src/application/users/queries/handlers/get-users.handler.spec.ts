import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import { GetUsersQuery } from '../get-users.query';
import { GetUsersHandler } from './get-users.handler';

/**
 * 获取用户列表查询处理器单元测试
 *
 * 测试 GetUsersHandler 的所有场景。
 *
 * @describe GetUsersHandler
 */
describe('GetUsersHandler', () => {
  let handler: GetUsersHandler;
  let userReadRepository: jest.Mocked<IUserReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserReadRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersHandler,
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUsersHandler>(GetUsersHandler);
    userReadRepository = module.get('IUserReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该返回用户列表', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetUsersQuery(validTenantId, 1, 10);

      userReadRepository.findMany.mockResolvedValue({
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      const result = await handler.execute(query);

      expect(userReadRepository.findMany).toHaveBeenCalledWith({
        tenantId: validTenantId,
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(validUserId);
      expect(result.data[0].email).toBe('user@example.com');
      expect(result.meta.total).toBe(1);
    });

    it('应该支持分页参数', async () => {
      const query = new GetUsersQuery(validTenantId, 2, 20);

      userReadRepository.findMany.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 20,
          totalPages: 0,
        },
      });

      const result = await handler.execute(query);

      expect(userReadRepository.findMany).toHaveBeenCalledWith({
        tenantId: validTenantId,
        page: 2,
        limit: 20,
        isActive: undefined,
        search: undefined,
      });
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(20);
    });

    it('应该支持过滤和搜索', async () => {
      const query = new GetUsersQuery(validTenantId, 1, 10, true, 'test');

      userReadRepository.findMany.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });

      await handler.execute(query);

      expect(userReadRepository.findMany).toHaveBeenCalledWith({
        tenantId: validTenantId,
        page: 1,
        limit: 10,
        isActive: true,
        search: 'test',
      });
    });
  });
});
