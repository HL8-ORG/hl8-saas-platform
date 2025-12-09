import { Logger } from '@hl8/logger';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IJwtService } from '../../shared/interfaces/jwt-service.interface';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { LoginInputDto } from '../dtos/login.input.dto';
import { LoginUseCase } from './login.use-case';

/**
 * 用户登录用例单元测试
 *
 * 测试用户登录用例的业务逻辑。
 *
 * @describe LoginUseCase
 */
describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let jwtService: jest.Mocked<IJwtService>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;

  const validBcryptHash =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqBWVHxkd0';
  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      emailExists: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockJwtService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockRefreshTokenRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      delete: jest.fn(),
      cleanupExpired: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LoginUseCase,
          useFactory: (
            userRepo: IUserRepository,
            passwordHasher: IPasswordHasher,
            jwtService: IJwtService,
            tenantResolver: ITenantResolver,
            refreshTokenRepo: IRefreshTokenRepository,
            config: ConfigService,
            logger: Logger,
          ) => {
            return new LoginUseCase(
              userRepo,
              passwordHasher,
              jwtService,
              tenantResolver,
              refreshTokenRepo,
              config,
              logger,
            );
          },
          inject: [
            'IUserRepository',
            'IPasswordHasher',
            'IJwtService',
            'ITenantResolver',
            'IRefreshTokenRepository',
            ConfigService,
            Logger,
          ],
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IPasswordHasher',
          useValue: mockPasswordHasher,
        },
        {
          provide: 'IJwtService',
          useValue: mockJwtService,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepository = module.get('IUserRepository');
    passwordHasher = module.get('IPasswordHasher');
    jwtService = module.get('IJwtService');
    tenantResolver = module.get('ITenantResolver');
    refreshTokenRepository = module.get('IRefreshTokenRepository');
    configService = module.get(ConfigService);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: LoginInputDto = {
      email: 'test@example.com',
      password: 'password123',
      deviceInfo: 'Test Device',
      ipAddress: '127.0.0.1',
    };

    let mockUser: User;

    beforeEach(() => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      configService.get.mockReturnValue('30d');

      mockUser = User.reconstitute({
        id: validUserId,
        email: input.email,
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

      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(true);
      passwordHasher.hash.mockResolvedValue(validBcryptHash);
      jwtService.signAccessToken.mockResolvedValue('access-token');
      jwtService.signRefreshToken.mockResolvedValue('refresh-token');
      refreshTokenRepository.create.mockResolvedValue(undefined);
      refreshTokenRepository.cleanupExpired.mockResolvedValue(undefined);
    });

    it('应该成功登录用户', async () => {
      const result = await useCase.execute(input);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        expect.any(Email),
        expect.any(TenantId),
      );
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        input.password,
        validBcryptHash,
      );
      expect(jwtService.signAccessToken).toHaveBeenCalledWith({
        sub: validUserId,
        role: UserRole.USER,
        email: input.email,
        tenantId: validTenantId,
      });
      expect(jwtService.signRefreshToken).toHaveBeenCalledWith({
        sub: validUserId,
        role: UserRole.USER,
        email: input.email,
        tenantId: validTenantId,
      });
      expect(refreshTokenRepository.create).toHaveBeenCalled();
      expect(refreshTokenRepository.cleanupExpired).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.id).toBe(validUserId);
    });

    it('当用户不存在时应该抛出 UnauthorizedException', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue(validBcryptHash);

      await expect(useCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(useCase.execute(input)).rejects.toThrow(
        'Invalid email or password',
      );

      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    });

    it('当密码错误时应该抛出 UnauthorizedException', async () => {
      passwordHasher.verify.mockResolvedValue(false);

      await expect(useCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    });

    it('当用户未激活时应该抛出 UnauthorizedException', async () => {
      const inactiveUser = User.reconstitute({
        id: validUserId,
        email: input.email,
        passwordHash: validBcryptHash,
        fullName: 'Inactive User',
        role: UserRole.USER,
        isActive: false,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.findByEmail.mockResolvedValue(inactiveUser);

      await expect(useCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该防止时序攻击（即使用户不存在也进行密码比较）', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue(validBcryptHash);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(useCase.execute(input)).rejects.toThrow(
        UnauthorizedException,
      );

      // 验证即使用户不存在，也进行了密码哈希和验证
      expect(passwordHasher.hash).toHaveBeenCalled();
      expect(passwordHasher.verify).toHaveBeenCalled();
    });

    it('应该创建刷新令牌记录', async () => {
      await useCase.execute(input);

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: validUserId,
          tenantId: validTenantId,
          deviceInfo: input.deviceInfo,
          ipAddress: input.ipAddress,
        }),
      );
    });

    it('应该清理过期的刷新令牌', async () => {
      await useCase.execute(input);

      expect(refreshTokenRepository.cleanupExpired).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
      );
    });

    it('应该记录登录日志', async () => {
      await useCase.execute(input);

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User logged in',
          userId: validUserId,
          role: UserRole.USER,
        }),
      );
    });

    it('应该处理可选的设备信息和IP地址', async () => {
      const inputWithoutDevice: LoginInputDto = {
        email: input.email,
        password: input.password,
      };

      await useCase.execute(inputWithoutDevice);

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Unknown Device',
          ipAddress: 'Unknown IP',
        }),
      );
    });

    it('应该使用配置的刷新令牌过期时间', async () => {
      configService.get.mockReturnValue('7d');

      await useCase.execute(input);

      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('应该处理管理员用户', async () => {
      const adminUser = User.reconstitute({
        id: validUserId,
        email: input.email,
        passwordHash: validBcryptHash,
        fullName: 'Admin User',
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.findByEmail.mockResolvedValue(adminUser);

      const result = await useCase.execute(input);

      expect(jwtService.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });
});
