import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { GetProfileInputDto } from '../dtos/get-profile.input.dto';
import { GetProfileUseCase } from './get-profile.use-case';

/**
 * 获取用户个人资料用例单元测试
 *
 * 测试获取用户个人资料用例的所有场景。
 *
 * @describe GetProfileUseCase
 */
describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileUseCase,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
      ],
    }).compile();

    useCase = module.get<GetProfileUseCase>(GetProfileUseCase);
    userProfileRepository = module.get('IUserProfileRepository');
    tenantResolver = module.get('ITenantResolver');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input = new GetProfileInputDto(validUserId);

    it('应该返回用户个人资料', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
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
      userProfileRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(input);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(result).toHaveProperty('id', validUserId);
      expect(result).toHaveProperty('email', 'user@example.com');
      expect(result).toHaveProperty('fullName', 'Test User');
      expect(result).toHaveProperty('role', 'USER');
      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('isEmailVerified', true);
    });

    it('应该处理用户不存在的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userProfileRepository.findById).toHaveBeenCalled();
    });

    it('应该使用正确的用户ID和租户ID', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
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
      userProfileRepository.findById.mockResolvedValue(mockUser);

      await useCase.execute(input);

      const findByIdCall = userProfileRepository.findById.mock.calls[0];
      expect(findByIdCall[0].toString()).toBe(validUserId);
      expect(findByIdCall[1].toString()).toBe(validTenantId);
    });
  });
});
