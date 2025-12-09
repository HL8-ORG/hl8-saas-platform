import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import type { IPasswordHasher } from '../../application/shared/interfaces/password-hasher.interface';
import { RefreshToken as OrmRefreshToken } from '../persistence/typeorm/entities/refresh-token.entity';
import { RefreshTokenRepositoryService } from './refresh-token-repository.service';

/**
 * 刷新令牌仓储服务单元测试
 *
 * 测试 RefreshTokenRepositoryService 的所有方法。
 *
 * @describe RefreshTokenRepositoryService
 */
describe('RefreshTokenRepositoryService', () => {
  let service: RefreshTokenRepositoryService;
  let ormRepository: jest.Mocked<Repository<OrmRefreshToken>>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validTokenId = '01ARZ3NDEKTSV4RRFFQ69G5FAY';
  const validToken = 'hashed-refresh-token';
  const plainToken = 'plain-refresh-token';
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1天前

  const mockOrmToken: OrmRefreshToken = {
    id: validTokenId,
    token: validToken,
    userId: validUserId,
    tenantId: validTenantId,
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    expiresAt: futureDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OrmRefreshToken;

  beforeEach(async () => {
    const mockOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenRepositoryService,
        {
          provide: getRepositoryToken(OrmRefreshToken),
          useValue: mockOrmRepository,
        },
        {
          provide: 'IPasswordHasher',
          useValue: mockPasswordHasher,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenRepositoryService>(
      RefreshTokenRepositoryService,
    );
    ormRepository = module.get(getRepositoryToken(OrmRefreshToken));
    passwordHasher = module.get('IPasswordHasher');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该创建刷新令牌', async () => {
      const createData = {
        token: validToken,
        userId: validUserId,
        tenantId: validTenantId,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        expiresAt: futureDate,
      };

      const createdEntity = { ...mockOrmToken };
      ormRepository.create.mockReturnValue(createdEntity);
      ormRepository.save.mockResolvedValue(createdEntity);

      const result = await service.create(createData);

      expect(ormRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: validToken,
          userId: validUserId,
          tenantId: validTenantId,
          deviceInfo: 'Test Device',
          ipAddress: '127.0.0.1',
          expiresAt: futureDate,
        }),
      );
      expect(ormRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toMatchObject({
        id: validTokenId,
        token: validToken,
        userId: validUserId,
        tenantId: validTenantId,
        deviceInfo: 'Test Device',
        ipAddress: '127.0.0.1',
        expiresAt: futureDate,
      });
    });

    it('应该创建没有可选字段的刷新令牌', async () => {
      const createData = {
        token: validToken,
        userId: validUserId,
        tenantId: validTenantId,
        expiresAt: futureDate,
      };

      const createdEntity = {
        ...mockOrmToken,
        deviceInfo: null,
        ipAddress: null,
      };
      ormRepository.create.mockReturnValue(createdEntity);
      ormRepository.save.mockResolvedValue(createdEntity);

      const result = await service.create(createData);

      expect(ormRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token: validToken,
          userId: validUserId,
          tenantId: validTenantId,
          deviceInfo: null,
          ipAddress: null,
          expiresAt: futureDate,
        }),
      );
      expect(result.deviceInfo).toBeNull();
      expect(result.ipAddress).toBeNull();
    });
  });

  describe('findValidTokens', () => {
    it('应该查找有效令牌', async () => {
      ormRepository.find.mockResolvedValue([mockOrmToken]);

      const result = await service.findValidTokens(validUserId, validTenantId);

      expect(ormRepository.find).toHaveBeenCalledWith({
        where: {
          userId: validUserId,
          tenantId: validTenantId,
          expiresAt: expect.any(Object),
        },
        select: ['id', 'token', 'expiresAt'],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: validTokenId,
        token: validToken,
        expiresAt: futureDate,
      });
    });

    it('应该返回空数组当没有有效令牌时', async () => {
      ormRepository.find.mockResolvedValue([]);

      const result = await service.findValidTokens(validUserId, validTenantId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findAllTokens', () => {
    it('应该查找所有令牌', async () => {
      ormRepository.find.mockResolvedValue([mockOrmToken]);

      const result = await service.findAllTokens(validUserId, validTenantId);

      expect(ormRepository.find).toHaveBeenCalledWith({
        where: {
          userId: validUserId,
          tenantId: validTenantId,
        },
        select: ['id', 'token', 'expiresAt'],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: validTokenId,
        token: validToken,
        expiresAt: futureDate,
      });
    });

    it('应该返回空数组当没有令牌时', async () => {
      ormRepository.find.mockResolvedValue([]);

      const result = await service.findAllTokens(validUserId, validTenantId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findAndVerifyToken', () => {
    it('应该验证并查找匹配的令牌', async () => {
      const validTokens = [
        {
          id: validTokenId,
          token: validToken,
          expiresAt: futureDate,
        },
      ];

      jest.spyOn(service, 'findValidTokens').mockResolvedValue(validTokens);
      passwordHasher.verify.mockResolvedValue(true);

      const result = await service.findAndVerifyToken(
        validUserId,
        validTenantId,
        plainToken,
      );

      expect(service.findValidTokens).toHaveBeenCalledWith(
        validUserId,
        validTenantId,
      );
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        plainToken,
        validToken,
      );
      expect(result).toBe(validTokenId);
    });

    it('应该返回 null 当令牌不匹配时', async () => {
      const validTokens = [
        {
          id: validTokenId,
          token: validToken,
          expiresAt: futureDate,
        },
      ];

      jest.spyOn(service, 'findValidTokens').mockResolvedValue(validTokens);
      passwordHasher.verify.mockResolvedValue(false);

      const result = await service.findAndVerifyToken(
        validUserId,
        validTenantId,
        plainToken,
      );

      expect(passwordHasher.verify).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('应该返回 null 当没有有效令牌时', async () => {
      jest.spyOn(service, 'findValidTokens').mockResolvedValue([]);

      const result = await service.findAndVerifyToken(
        validUserId,
        validTenantId,
        plainToken,
      );

      expect(service.findValidTokens).toHaveBeenCalled();
      expect(passwordHasher.verify).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('应该验证多个令牌直到找到匹配的', async () => {
      const validTokens = [
        {
          id: 'token1',
          token: 'hash1',
          expiresAt: futureDate,
        },
        {
          id: validTokenId,
          token: validToken,
          expiresAt: futureDate,
        },
      ];

      jest.spyOn(service, 'findValidTokens').mockResolvedValue(validTokens);
      passwordHasher.verify
        .mockResolvedValueOnce(false) // 第一个不匹配
        .mockResolvedValueOnce(true); // 第二个匹配

      const result = await service.findAndVerifyToken(
        validUserId,
        validTenantId,
        plainToken,
      );

      expect(passwordHasher.verify).toHaveBeenCalledTimes(2);
      expect(result).toBe(validTokenId);
    });
  });

  describe('update', () => {
    it('应该更新刷新令牌', async () => {
      const updateData = {
        token: 'new-token',
        deviceInfo: 'New Device',
        expiresAt: futureDate,
      };

      ormRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.update(validTokenId, updateData);

      expect(ormRepository.update).toHaveBeenCalledWith(
        validTokenId,
        updateData,
      );
    });

    it('应该更新部分字段', async () => {
      const updateData = {
        token: 'new-token',
      };

      await service.update(validTokenId, updateData);

      expect(ormRepository.update).toHaveBeenCalledWith(
        validTokenId,
        updateData,
      );
    });
  });

  describe('delete', () => {
    it('应该删除刷新令牌', async () => {
      ormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete(validTokenId);

      expect(ormRepository.delete).toHaveBeenCalledWith(validTokenId);
    });
  });

  describe('deleteAll', () => {
    it('应该删除用户所有令牌', async () => {
      ormRepository.delete.mockResolvedValue({ affected: 2 } as any);

      await service.deleteAll(validUserId, validTenantId);

      expect(ormRepository.delete).toHaveBeenCalledWith({
        userId: validUserId,
        tenantId: validTenantId,
      });
    });
  });

  describe('cleanupExpired', () => {
    it('应该清理过期令牌并保留最多5个最新令牌', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };

      ormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<OrmRefreshToken>,
      );

      // 模拟有7个令牌，需要删除2个（保留5个）
      const tokens = Array.from({ length: 7 }, (_, i) => ({
        ...mockOrmToken,
        id: `token${i}`,
      }));
      ormRepository.find.mockResolvedValue(tokens.slice(5)); // 返回需要删除的2个
      ormRepository.delete.mockResolvedValue({ affected: 2 } as any);

      await service.cleanupExpired(validUserId, validTenantId);

      expect(ormRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'userId = :userId AND tenantId = :tenantId AND expiresAt < :now',
        {
          userId: validUserId,
          tenantId: validTenantId,
          now: expect.any(Date),
        },
      );
      expect(ormRepository.find).toHaveBeenCalledWith({
        where: { userId: validUserId, tenantId: validTenantId },
        order: { createdAt: 'DESC' },
        skip: 5,
        take: 100,
      });
      expect(ormRepository.delete).toHaveBeenCalledWith({
        id: In(tokens.slice(5).map((t) => t.id)),
      });
    });

    it('应该只清理过期令牌当令牌数量少于5个时', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      ormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as SelectQueryBuilder<OrmRefreshToken>,
      );

      // 模拟只有3个令牌
      ormRepository.find.mockResolvedValue([]); // 没有需要删除的

      await service.cleanupExpired(validUserId, validTenantId);

      expect(ormRepository.createQueryBuilder).toHaveBeenCalled();
      expect(ormRepository.find).toHaveBeenCalled();
      expect(ormRepository.delete).not.toHaveBeenCalled();
    });
  });
});
