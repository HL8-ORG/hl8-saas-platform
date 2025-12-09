import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { User } from '../../../domain/users/entities/user.aggregate';
import type { IJwtService } from '../../shared/interfaces/jwt-service.interface';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { RefreshTokenInputDto } from '../dtos/refresh-token.input.dto';
import { RefreshTokenUseCase } from './refresh-token.use-case';

/**
 * 刷新令牌用例单元测试
 *
 * 测试刷新令牌用例的所有场景。
 *
 * @describe RefreshTokenUseCase
 */
describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let jwtService: jest.Mocked<IJwtService>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let userRepository: jest.Mocked<IUserRepository>;
  let configService: jest.Mocked<ConfigService>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRefreshToken = 'valid-refresh-token';
  const validTokenId = '01ARZ3NDEKTSV4RRFFQ69G5FAY';
  const validAccessToken = 'new-access-token';
  const validNewRefreshToken = 'new-refresh-token';

  beforeEach(async () => {
    const mockRefreshTokenRepository = {
      findAndVerifyToken: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
      findValidTokens: jest.fn(),
      findAllTokens: jest.fn(),
      cleanupExpired: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockJwtService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verify: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      emailExists: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
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
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    userRepository = module.get('IUserRepository');
    passwordHasher = module.get('IPasswordHasher');
    jwtService = module.get('IJwtService');
    tenantResolver = module.get('ITenantResolver');
    refreshTokenRepository = module.get('IRefreshTokenRepository');
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const validBcryptHash =
      '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

    const input: RefreshTokenInputDto = {
      userId: validUserId,
      refreshToken: validRefreshToken,
    };

    it('应该成功刷新令牌', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: 'USER',
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
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(validTokenId);
      jwtService.signAccessToken.mockResolvedValue(validAccessToken);
      jwtService.signRefreshToken.mockResolvedValue(validNewRefreshToken);
      passwordHasher.hash.mockResolvedValue('hashed-token');
      configService.get.mockReturnValue('30d');

      const result = await useCase.execute(input);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
        validRefreshToken,
      );
      expect(jwtService.signAccessToken).toHaveBeenCalled();
      expect(jwtService.signRefreshToken).toHaveBeenCalled();
      expect(passwordHasher.hash).toHaveBeenCalledWith(validNewRefreshToken);
      expect(refreshTokenRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', validAccessToken);
      expect(result).toHaveProperty('refreshToken', validNewRefreshToken);
    });

    it('应该处理用户不存在的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(
        'Invalid refresh token',
      );

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).not.toHaveBeenCalled();
    });

    it('应该处理用户未激活的情况', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: 'USER',
        isActive: false,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      userRepository.findById.mockResolvedValue(mockUser);

      await expect(useCase.execute(input)).rejects.toThrow(
        'Invalid refresh token',
      );

      expect(userRepository.findById).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).not.toHaveBeenCalled();
    });

    it('应该处理无效的刷新令牌', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: 'USER',
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
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(
        'Invalid refresh token',
      );

      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalled();
      expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    });

    it('应该更新刷新令牌记录', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: 'USER',
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
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(validTokenId);
      jwtService.signAccessToken.mockResolvedValue(validAccessToken);
      jwtService.signRefreshToken.mockResolvedValue(validNewRefreshToken);
      passwordHasher.hash.mockResolvedValue('hashed-token');
      configService.get.mockReturnValue('30d');

      await useCase.execute(input);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        validTokenId,
        expect.objectContaining({
          token: 'hashed-token',
          expiresAt: expect.any(Date),
          deviceInfo: 'Unknown Device',
          ipAddress: 'Unknown IP',
        }),
      );
    });
  });
});
