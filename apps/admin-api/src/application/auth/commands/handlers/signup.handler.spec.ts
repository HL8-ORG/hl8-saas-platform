import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import {
  User,
  UserRole,
} from '../../../../domain/users/entities/user.aggregate';
import type { IPasswordHasher } from '../../../shared/interfaces/password-hasher.interface';
import { SignupCommand } from '../signup.command';
import { SignupHandler } from './signup.handler';

/**
 * 注册命令处理器单元测试
 *
 * 测试 SignupHandler 的所有场景。
 *
 * @describe SignupHandler
 */
describe('SignupHandler', () => {
  let handler: SignupHandler;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let eventBus: jest.Mocked<EventBus>;
  let configService: jest.Mocked<ConfigService>;

  const validEmail = 'user@example.com';
  const validPassword = 'password123';
  const validFullName = 'Test User';
  const validTenantName = 'test-tenant';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
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

    const mockTenantRepository = {
      findByName: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByDomain: jest.fn(),
      delete: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupHandler,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'ITenantRepository',
          useValue: mockTenantRepository,
        },
        {
          provide: 'IPasswordHasher',
          useValue: mockPasswordHasher,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    handler = module.get<SignupHandler>(SignupHandler);
    userRepository = module.get('IUserRepository');
    tenantRepository = module.get('ITenantRepository');
    passwordHasher = module.get('IPasswordHasher');
    eventBus = module.get(EventBus);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const command = new SignupCommand(
      validEmail,
      validPassword,
      validFullName,
      validTenantName,
    );

    it('应该成功注册新用户（租户已存在）', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: validFullName,
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantRepository.findByName.mockResolvedValue(mockTenant);
      userRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue(validBcryptHash);
      configService.get.mockReturnValue(UserRole.USER);
      userRepository.save.mockResolvedValue(undefined);
      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(passwordHasher.hash).toHaveBeenCalledWith(validPassword);
      expect(User.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.userId).toBe(validUserId);
      expect(result.email).toBe(validEmail);
      expect(result.fullName).toBe(validFullName);
      expect(result.message).toBe('注册成功');
    });

    it('应该创建新租户并注册用户（租户不存在）', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: validFullName,
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantRepository.findByName.mockResolvedValue(null);
      jest.spyOn(Tenant, 'create').mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockTenant, 'getUncommittedEvents').mockReturnValue([]);
      passwordHasher.hash.mockResolvedValue(validBcryptHash);
      configService.get.mockReturnValue(UserRole.USER);
      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(Tenant.create).toHaveBeenCalled();
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.userId).toBe(validUserId);
    });

    it('应该抛出 ConflictException 当邮箱已被注册时', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const existingUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: 'Existing User',
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantRepository.findByName.mockResolvedValue(mockTenant);
      userRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow('该邮箱已被注册');

      expect(tenantRepository.findByName).toHaveBeenCalled();
      expect(userRepository.findByEmail).toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockTenant = Tenant.reconstitute({
        id: validTenantId,
        name: validTenantName,
        domain: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockUser = User.reconstitute({
        id: validUserId,
        email: validEmail,
        passwordHash: validBcryptHash,
        fullName: validFullName,
        role: UserRole.USER,
        tenantId: validTenantId,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantRepository.findByName.mockResolvedValue(mockTenant);
      userRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue(validBcryptHash);
      configService.get.mockReturnValue(UserRole.USER);
      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(undefined);
      const mockEvents = [{ type: 'UserRegisteredEvent' }];
      jest
        .spyOn(mockUser, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
