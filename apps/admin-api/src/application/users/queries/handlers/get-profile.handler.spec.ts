import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import type { ITenantResolver } from '../../../shared/interfaces/tenant-resolver.interface';
import { GetProfileQuery } from '../get-profile.query';
import { GetProfileHandler } from './get-profile.handler';

/**
 * 获取个人资料查询处理器单元测试
 *
 * 测试 GetProfileHandler 的所有场景。
 *
 * @describe GetProfileHandler
 */
describe('GetProfileHandler', () => {
  let handler: GetProfileHandler;
  let userReadRepository: jest.Mocked<IUserReadRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserReadRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileHandler,
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
      ],
    }).compile();

    handler = module.get<GetProfileHandler>(GetProfileHandler);
    userReadRepository = module.get('IUserReadRepository');
    tenantResolver = module.get('ITenantResolver');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该返回用户个人资料', async () => {
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

      const query = new GetProfileQuery(validUserId);

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userReadRepository.findById.mockResolvedValue(mockUser);

      const result = await handler.execute(query);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userReadRepository.findById).toHaveBeenCalled();
      expect(result.id).toBe(validUserId);
      expect(result.email).toBe('user@example.com');
      expect(result.fullName).toBe('Test User');
      expect(result.role).toBe(UserRole.USER);
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      const query = new GetProfileQuery(validUserId);

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userReadRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('用户不存在');

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userReadRepository.findById).toHaveBeenCalled();
    });
  });
});
