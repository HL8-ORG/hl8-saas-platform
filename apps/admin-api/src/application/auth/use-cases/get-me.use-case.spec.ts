import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { GetMeInputDto } from '../dtos/get-me.input.dto';
import { GetMeUseCase } from './get-me.use-case';

/**
 * 获取当前用户用例单元测试
 *
 * 测试获取当前用户用例的所有场景。
 *
 * @describe GetMeUseCase
 */
describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
  const validEmail = 'user@example.com';

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      emailExists: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMeUseCase,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
      ],
    }).compile();

    useCase = module.get<GetMeUseCase>(GetMeUseCase);
    userRepository = module.get('IUserRepository');
    tenantResolver = module.get('ITenantResolver');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    const input: GetMeInputDto = {
      userId: validUserId,
    };

    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功获取当前用户信息', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(input);

      expect(result).toEqual({
        id: validUserId,
        email: validEmail,
        fullName: 'Test User',
        role: UserRole.USER,
      });

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('应该处理用户不存在的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userRepository.findById).toHaveBeenCalled();
    });
  });
});
