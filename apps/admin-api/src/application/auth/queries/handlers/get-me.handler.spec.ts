import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import { GetMeQuery } from '../get-me.query';
import { GetMeHandler } from './get-me.handler';

/**
 * 获取当前用户查询处理器单元测试
 *
 * 测试 GetMeHandler 的所有场景。
 *
 * @describe GetMeHandler
 */
describe('GetMeHandler', () => {
  let handler: GetMeHandler;
  let userRepository: jest.Mocked<IUserRepository>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      emailExists: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMeHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<GetMeHandler>(GetMeHandler);
    userRepository = module.get('IUserRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const query = new GetMeQuery(validUserId);

    beforeEach(() => {
      (query as any).tenantId = validTenantId;
    });

    it('应该返回当前用户信息', async () => {
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

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await handler.execute(query);

      expect(userRepository.findById).toHaveBeenCalled();
      expect(result.id).toBe(validUserId);
      expect(result.email).toBe('user@example.com');
      expect(result.fullName).toBe('Test User');
      expect(result.role).toBe(UserRole.USER);
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('用户不存在');

      expect(userRepository.findById).toHaveBeenCalled();
    });
  });
});
