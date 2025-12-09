import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import { GetUserByIdQuery } from '../get-user-by-id.query';
import { GetUserByIdHandler } from './get-user-by-id.handler';

/**
 * 根据ID获取用户查询处理器单元测试
 *
 * 测试 GetUserByIdHandler 的所有场景。
 *
 * @describe GetUserByIdHandler
 */
describe('GetUserByIdHandler', () => {
  let handler: GetUserByIdHandler;
  let userReadRepository: jest.Mocked<IUserReadRepository>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserByIdHandler,
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUserByIdHandler>(GetUserByIdHandler);
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
    it('应该返回用户信息', async () => {
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

      const query = new GetUserByIdQuery(validUserId, validTenantId);

      userReadRepository.findById.mockResolvedValue(mockUser);

      const result = await handler.execute(query);

      expect(userReadRepository.findById).toHaveBeenCalled();
      expect(result.id).toBe(validUserId);
      expect(result.email).toBe('user@example.com');
      expect(result.fullName).toBe('Test User');
      expect(result.role).toBe(UserRole.USER);
      expect(result.isActive).toBe(true);
      expect(result.isEmailVerified).toBe(true);
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      const query = new GetUserByIdQuery(validUserId, validTenantId);

      userReadRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('用户不存在');

      expect(userReadRepository.findById).toHaveBeenCalled();
    });
  });
});
