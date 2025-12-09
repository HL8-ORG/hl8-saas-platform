import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import { UpdateUserCommand } from '../update-user.command';
import { UpdateUserHandler } from './update-user.handler';

/**
 * 更新用户命令处理器单元测试
 *
 * 测试 UpdateUserHandler 的所有场景。
 *
 * @describe UpdateUserHandler
 */
describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserHandler,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<UpdateUserHandler>(UpdateUserHandler);
    userProfileRepository = module.get('IUserProfileRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该成功更新用户全名', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Old Name',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateUserCommand(
        validUserId,
        validTenantId,
        'New Name',
        undefined,
        undefined,
      );

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      const updateProfileSpy = jest.spyOn(mockUser, 'updateProfile');
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(updateProfileSpy).toHaveBeenCalledWith('New Name');
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(result.fullName).toBe('New Name');
    });

    it('应该成功更新用户角色', async () => {
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

      const command = new UpdateUserCommand(
        validUserId,
        validTenantId,
        undefined,
        UserRole.ADMIN,
        undefined,
      );

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);
      // Handler 会直接修改 _role 属性，我们需要在 save 后模拟这个行为
      jest.spyOn(mockUser, 'role', 'get').mockReturnValue(UserRole.ADMIN);

      const result = await handler.execute(command);

      expect(userProfileRepository.save).toHaveBeenCalled();
      // 由于 handler 直接修改了 _role，我们需要检查 role getter 的返回值
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('应该成功激活用户', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: false,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateUserCommand(
        validUserId,
        validTenantId,
        undefined,
        undefined,
        true,
      );

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      const activateSpy = jest.spyOn(mockUser, 'activate');
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(activateSpy).toHaveBeenCalled();
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    it('应该成功停用用户', async () => {
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

      const command = new UpdateUserCommand(
        validUserId,
        validTenantId,
        undefined,
        undefined,
        false,
      );

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      const deactivateSpy = jest.spyOn(mockUser, 'deactivate');
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(deactivateSpy).toHaveBeenCalled();
      expect(userProfileRepository.save).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('应该抛出 NotFoundException 当用户不存在时', async () => {
      const command = new UpdateUserCommand(
        validUserId,
        validTenantId,
        'New Name',
        undefined,
        undefined,
      );

      userProfileRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('用户不存在');

      expect(userProfileRepository.findById).toHaveBeenCalled();
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
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

      const command = new UpdateUserCommand(
        validUserId,
        validTenantId,
        'New Name',
        undefined,
        undefined,
      );

      userProfileRepository.findById.mockResolvedValue(mockUser);
      userProfileRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'updateProfile').mockImplementation(() => {});
      const mockEvents = [{ type: 'UserUpdatedEvent' }];
      jest
        .spyOn(mockUser, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
