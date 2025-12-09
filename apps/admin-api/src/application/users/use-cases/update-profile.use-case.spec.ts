import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { UpdateProfileInputDto } from '../dtos/update-profile.input.dto';
import { UpdateProfileUseCase } from './update-profile.use-case';

/**
 * 更新个人资料用例单元测试
 *
 * 测试更新个人资料用例的所有场景。
 *
 * @describe UpdateProfileUseCase
 */
describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let eventBus: jest.Mocked<IEventBus>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
  const validEmail = 'user@example.com';

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
      ],
    }).compile();

    useCase = module.get<UpdateProfileUseCase>(UpdateProfileUseCase);
    userProfileRepository = module.get('IUserProfileRepository');
    eventBus = module.get('IEventBus');
    tenantResolver = module.get('ITenantResolver');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功更新个人资料', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Old Name',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new UpdateProfileInputDto(validUserId, {
        fullName: 'New Name',
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(validUserId);
      expect(result.email).toBe(validEmail);
      expect(result.fullName).toBe('New Name');
      expect(result.role).toBe('USER');

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理用户不存在的情况', async () => {
      const input = new UpdateProfileInputDto(validUserId, {
        fullName: 'New Name',
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });

    it('应该处理 fullName 为 undefined 的情况', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Old Name',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new UpdateProfileInputDto(validUserId, {});

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(validUserId);
      expect(result.email).toBe(validEmail);
      expect(result.fullName).toBe('Old Name'); // 未更新

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).toHaveBeenCalled();
      // 当 fullName 为 undefined 时，不会触发 updateProfile，因此不会发布事件
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
