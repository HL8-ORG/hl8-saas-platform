import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import { IEventBus } from '../../../infrastructure/events';
import { UpdateUserInputDto } from '../dtos/update-user.input.dto';
import { UpdateUserUseCase } from './update-user.use-case';

/**
 * 更新用户用例单元测试
 *
 * 测试更新用户用例的所有场景。
 *
 * @describe UpdateUserUseCase
 */
describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
      ],
    }).compile();

    useCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    userProfileRepository = module.get('IUserProfileRepository');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('应该更新用户信息', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Original Name',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new UpdateUserInputDto(validUserId, validTenantId, {
        fullName: 'Updated Name',
        role: UserRole.ADMIN,
        isActive: false,
      });

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      mockUser.getUncommittedEvents = jest.fn().mockReturnValue([]);
      (eventBus.publishAll as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', validUserId);
    });

    it('应该处理用户不存在的情况', async () => {
      const input = new UpdateUserInputDto(validUserId, validTenantId, {
        fullName: 'Updated Name',
      });

      userProfileRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('应该只更新提供的字段', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Original Name',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new UpdateUserInputDto(validUserId, validTenantId, {
        fullName: 'Updated Name',
      });

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      mockUser.getUncommittedEvents = jest.fn().mockReturnValue([]);
      (eventBus.publishAll as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute(input);

      expect(userProfileRepository.save).toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Original Name',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new UpdateUserInputDto(validUserId, validTenantId, {
        isActive: false,
      });

      const mockEvents = [{ type: 'UserDeactivatedEvent' }];
      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      mockUser.getUncommittedEvents = jest.fn().mockReturnValue(mockEvents);
      eventBus.publishAll.mockResolvedValue(undefined);

      await useCase.execute(input);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
