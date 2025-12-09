import { Logger } from '@hl8/logger';
import { Test, TestingModule } from '@nestjs/testing';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { LogoutInputDto } from '../dtos/logout.input.dto';
import { LogoutUseCase } from './logout.use-case';

/**
 * 用户登出用例单元测试
 *
 * 测试用户登出用例的所有场景。
 *
 * @describe LogoutUseCase
 */
describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let tenantResolver: jest.Mocked<ITenantResolver>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let logger: jest.Mocked<Logger>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRefreshToken = 'valid-refresh-token';
  const validTokenId = '01ARZ3NDEKTSV4RRFFQ69G5FAY';

  beforeEach(async () => {
    const mockRefreshTokenRepository = {
      findAndVerifyToken: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
      save: jest.fn(),
      findByToken: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: 'IPasswordHasher',
          useValue: mockPasswordHasher,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<LogoutUseCase>(LogoutUseCase);
    refreshTokenRepository = module.get('IRefreshTokenRepository');
    tenantResolver = module.get('ITenantResolver');
    passwordHasher = module.get('IPasswordHasher');
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: LogoutInputDto = {
      userId: validUserId,
      refreshToken: validRefreshToken,
    };

    it('应该删除刷新令牌并成功登出（单设备登出）', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(validTokenId);
      refreshTokenRepository.delete.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
        validRefreshToken,
      );
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith(validTokenId);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(logger.log).toHaveBeenCalledWith({
        message: 'User logged out',
        userId: validUserId,
        singleDevice: true,
      });
    });

    it('应该处理找不到令牌的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(refreshTokenRepository.findAndVerifyToken).toHaveBeenCalled();
      expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('应该在没有提供刷新令牌时删除用户的所有令牌（全设备登出）', async () => {
      const inputWithoutToken: LogoutInputDto = {
        userId: validUserId,
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      refreshTokenRepository.deleteAll.mockResolvedValue(undefined);

      const result = await useCase.execute(inputWithoutToken);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(refreshTokenRepository.deleteAll).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(logger.log).toHaveBeenCalledWith({
        message: 'User logged out',
        userId: validUserId,
        singleDevice: false,
      });
    });

    it('应该处理删除令牌失败的情况', async () => {
      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      refreshTokenRepository.findAndVerifyToken.mockResolvedValue(validTokenId);
      refreshTokenRepository.delete.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(useCase.execute(input)).rejects.toThrow('Delete failed');
      expect(refreshTokenRepository.delete).toHaveBeenCalled();
    });
  });
});
