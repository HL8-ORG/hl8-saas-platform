import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { FastifyRequest } from 'fastify';
import { Repository } from 'typeorm';
import { TENANT_CONTEXT_KEY } from '../../common/constants/tenant.constants';
import { Tenant } from '../persistence/typeorm/entities/tenant.entity';
import { TenantResolverService } from './tenant-resolver.service';

/**
 * 租户解析器服务单元测试
 *
 * 测试租户解析器的所有方法。
 *
 * @describe TenantResolverService
 */
describe('TenantResolverService', () => {
  let service: TenantResolverService;
  let request: jest.Mocked<FastifyRequest>;
  let configService: jest.Mocked<ConfigService>;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  beforeEach(async () => {
    const mockRequest = {
      headers: {},
    } as unknown as FastifyRequest;

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockTenantRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantResolverService,
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
      ],
    }).compile();

    service = module.get<TenantResolverService>(TenantResolverService);
    request = module.get(REQUEST);
    configService = module.get(ConfigService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
  });

  afterEach(() => {
    jest.clearAllMocks();
    // 清除请求上下文
    (request as any)[TENANT_CONTEXT_KEY] = undefined;
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentTenantId', () => {
    it('应该从请求上下文返回租户ID', () => {
      (request as any)[TENANT_CONTEXT_KEY] = validTenantId;

      const result = service.getCurrentTenantId();

      expect(result).toBe(validTenantId);
    });

    it('应该抛出 BadRequestException 当租户上下文缺失时', () => {
      (request as any)[TENANT_CONTEXT_KEY] = undefined;

      expect(() => service.getCurrentTenantId()).toThrow(BadRequestException);
      expect(() => service.getCurrentTenantId()).toThrow('租户上下文缺失');
    });
  });

  describe('resolveTenantId', () => {
    it('应该从请求上下文返回租户ID', async () => {
      (request as any)[TENANT_CONTEXT_KEY] = validTenantId;

      const result = await service.resolveTenantId();

      expect(result).toBe(validTenantId);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });

    it('应该从传入请求的上下文返回租户ID', async () => {
      const req = {
        headers: {},
      } as unknown as FastifyRequest;
      (req as any)[TENANT_CONTEXT_KEY] = validTenantId;

      const result = await service.resolveTenantId(req);

      expect(result).toBe(validTenantId);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });

    it('应该从请求头返回租户ID', async () => {
      const req = {
        headers: {
          'x-tenant-id': validTenantId,
        },
      } as unknown as FastifyRequest;

      const result = await service.resolveTenantId(req);

      expect(result).toBe(validTenantId);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });

    it('应该从默认租户返回租户ID', async () => {
      const defaultTenant = {
        id: validTenantId,
        domain: 'default',
        name: 'Default Tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      configService.get.mockReturnValue('default');
      tenantRepository.findOne.mockResolvedValue(defaultTenant as Tenant);

      const result = await service.resolveTenantId();

      expect(configService.get).toHaveBeenCalledWith(
        'DEFAULT_TENANT_DOMAIN',
        'default',
      );
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'default' },
      });
      expect(result).toBe(validTenantId);
    });

    it('应该从第一个租户返回租户ID（当默认租户不存在时）', async () => {
      const firstTenant = {
        id: validTenantId,
        domain: 'first',
        name: 'First Tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      configService.get.mockReturnValue('default');
      tenantRepository.findOne
        .mockResolvedValueOnce(null) // 默认租户不存在
        .mockResolvedValueOnce(firstTenant as Tenant); // 第一个租户

      const result = await service.resolveTenantId();

      expect(tenantRepository.findOne).toHaveBeenCalledTimes(2);
      expect(tenantRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { domain: 'default' },
      });
      expect(tenantRepository.findOne).toHaveBeenNthCalledWith(2, {
        order: { createdAt: 'ASC' },
      });
      expect(result).toBe(validTenantId);
    });

    it('应该抛出 BadRequestException 当没有可用租户时', async () => {
      configService.get.mockReturnValue('default');
      tenantRepository.findOne
        .mockResolvedValueOnce(null) // 默认租户不存在
        .mockResolvedValueOnce(null); // 第一个租户也不存在

      await expect(service.resolveTenantId()).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resolveTenantId()).rejects.toThrow(
        '租户上下文缺失，且系统中没有可用租户',
      );
    });

    it('应该优先使用请求上下文而不是请求头', async () => {
      (request as any)[TENANT_CONTEXT_KEY] = validTenantId;
      const req = {
        headers: {
          'x-tenant-id': 'other-tenant-id',
        },
      } as unknown as FastifyRequest;

      const result = await service.resolveTenantId(req);

      expect(result).toBe(validTenantId);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
