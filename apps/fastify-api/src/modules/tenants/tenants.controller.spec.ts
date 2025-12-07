import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '../../entities/tenant.entity';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

/**
 * 租户控制器单元测试
 *
 * 测试租户控制器的 HTTP 请求处理逻辑。
 *
 * @describe TenantsController
 */
describe('TenantsController', () => {
  let controller: TenantsController;
  let tenantsService: jest.Mocked<TenantsService>;

  const mockTenant: Tenant = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: '测试租户',
    domain: 'test',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tenant;

  beforeEach(async () => {
    const mockTenantsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    tenantsService = module.get(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('应该返回所有租户', async () => {
      const tenants = [mockTenant];
      tenantsService.findAll.mockResolvedValue(tenants);

      const result = await controller.findAll();

      expect(tenantsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(tenants);
    });

    it('应该返回空数组当没有租户时', async () => {
      tenantsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const tenantId = '550e8400-e29b-41d4-a716-446655440000';

    it('应该返回租户信息', async () => {
      tenantsService.findOne.mockResolvedValue(mockTenant);

      const result = await controller.findOne(tenantId);

      expect(tenantsService.findOne).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(mockTenant);
    });

    it('当租户不存在时应该抛出 NotFoundException', async () => {
      tenantsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(tenantId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne(tenantId)).rejects.toThrow('租户不存在');
    });
  });

  describe('create', () => {
    const createTenantDto: CreateTenantDto = {
      name: '新租户',
      domain: 'new-tenant',
      isActive: true,
    };

    it('应该成功创建租户', async () => {
      tenantsService.create.mockResolvedValue(mockTenant);

      const result = await controller.create(createTenantDto);

      expect(tenantsService.create).toHaveBeenCalledWith(createTenantDto);
      expect(result).toEqual(mockTenant);
    });

    it('应该支持不提供域名的创建', async () => {
      const dtoWithoutDomain: CreateTenantDto = {
        name: '新租户',
      };
      tenantsService.create.mockResolvedValue(mockTenant);

      const result = await controller.create(dtoWithoutDomain);

      expect(tenantsService.create).toHaveBeenCalledWith(dtoWithoutDomain);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('update', () => {
    const tenantId = '550e8400-e29b-41d4-a716-446655440000';
    const updateTenantDto: UpdateTenantDto = {
      name: '更新后的租户名称',
    };

    it('应该成功更新租户', async () => {
      const updatedTenant = { ...mockTenant, ...updateTenantDto };
      tenantsService.update.mockResolvedValue(updatedTenant);

      const result = await controller.update(tenantId, updateTenantDto);

      expect(tenantsService.update).toHaveBeenCalledWith(
        tenantId,
        updateTenantDto,
      );
      expect(result).toEqual(updatedTenant);
    });

    it('应该支持部分更新', async () => {
      const partialUpdate: UpdateTenantDto = {
        isActive: false,
      };
      const updatedTenant = { ...mockTenant, isActive: false };
      tenantsService.update.mockResolvedValue(updatedTenant);

      const result = await controller.update(tenantId, partialUpdate);

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    const tenantId = '550e8400-e29b-41d4-a716-446655440000';

    it('应该成功删除租户', async () => {
      tenantsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(tenantId);

      expect(tenantsService.remove).toHaveBeenCalledWith(tenantId);
      expect(result).toHaveProperty('message', '租户删除成功');
    });
  });
});
