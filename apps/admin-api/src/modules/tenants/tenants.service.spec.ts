import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantsService } from './tenants.service';

/**
 * 租户服务单元测试
 *
 * 测试租户服务的核心业务逻辑，包括租户的创建、查询、更新和删除功能。
 *
 * @describe TenantsService
 */
describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;

  const mockTenant: Tenant = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: '测试租户',
    domain: 'test',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tenant;

  beforeEach(async () => {
    const mockTenantRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('应该返回所有租户', async () => {
      const tenants = [mockTenant];
      tenantRepository.find.mockResolvedValue(tenants);

      const result = await service.findAll();

      expect(tenantRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(tenants);
    });

    it('应该返回空数组当没有租户时', async () => {
      tenantRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('应该根据 ID 返回租户', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findOne(mockTenant.id);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
      });
      expect(result).toEqual(mockTenant);
    });

    it('当租户不存在时应该返回 null', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByDomain', () => {
    it('应该根据域名返回租户', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findByDomain('test');

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'test' },
      });
      expect(result).toEqual(mockTenant);
    });

    it('当域名不存在时应该返回 null', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      const result = await service.findByDomain('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('validateTenant', () => {
    it('应该返回激活的租户', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.validateTenant(mockTenant.id);

      expect(result).toEqual(mockTenant);
    });

    it('当租户不存在时应该抛出 NotFoundException', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.validateTenant('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateTenant('non-existent-id')).rejects.toThrow(
        '租户 non-existent-id 不存在',
      );
    });

    it('当租户未激活时应该抛出 NotFoundException', async () => {
      const inactiveTenant = { ...mockTenant, isActive: false };
      tenantRepository.findOne.mockResolvedValue(inactiveTenant);

      await expect(service.validateTenant(mockTenant.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateTenant(mockTenant.id)).rejects.toThrow(
        `租户 ${mockTenant.id} 未激活`,
      );
    });
  });

  describe('create', () => {
    const createTenantDto: CreateTenantDto = {
      name: '新租户',
      domain: 'new-tenant',
      isActive: true,
    };

    it('应该成功创建租户', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      const result = await service.create(createTenantDto);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { name: createTenantDto.name },
      });
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { domain: createTenantDto.domain },
      });
      expect(tenantRepository.create).toHaveBeenCalledWith({
        name: createTenantDto.name,
        domain: createTenantDto.domain,
        isActive: true,
      });
      expect(tenantRepository.save).toHaveBeenCalledWith(mockTenant);
      expect(result).toEqual(mockTenant);
    });

    it('应该使用默认的 isActive 值', async () => {
      const dtoWithoutActive: CreateTenantDto = {
        name: '新租户',
        domain: 'new-tenant',
      };
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      await service.create(dtoWithoutActive);

      expect(tenantRepository.create).toHaveBeenCalledWith({
        name: dtoWithoutActive.name,
        domain: dtoWithoutActive.domain,
        isActive: true,
      });
    });

    it('当租户名称已存在时应该抛出 BadRequestException', async () => {
      tenantRepository.findOne.mockResolvedValueOnce(mockTenant);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createTenantDto)).rejects.toThrow(
        `租户名称 ${createTenantDto.name} 已存在`,
      );
      expect(tenantRepository.create).not.toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('当租户域名已存在时应该抛出 BadRequestException', async () => {
      tenantRepository.findOne
        .mockResolvedValueOnce(null) // 名称检查通过
        .mockResolvedValueOnce(mockTenant); // 域名检查失败

      await expect(service.create(createTenantDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createTenantDto)).rejects.toThrow(
        `租户域名 ${createTenantDto.domain} 已存在`,
      );
      expect(tenantRepository.create).not.toHaveBeenCalled();
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('当不提供域名时应该跳过域名检查', async () => {
      const dtoWithoutDomain: CreateTenantDto = {
        name: '新租户',
      };
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      await service.create(dtoWithoutDomain);

      expect(tenantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { name: dtoWithoutDomain.name },
      });
    });
  });

  describe('update', () => {
    const updateTenantDto: UpdateTenantDto = {
      name: '更新后的租户名称',
    };

    it('应该成功更新租户', async () => {
      const updatedTenant = { ...mockTenant, ...updateTenantDto };
      tenantRepository.findOne
        .mockResolvedValueOnce(mockTenant) // 查找租户
        .mockResolvedValueOnce(null); // 检查名称唯一性
      tenantRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.update(mockTenant.id, updateTenantDto);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
      });
      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateTenantDto),
      );
      expect(result).toEqual(updatedTenant);
    });

    it('当租户不存在时应该抛出 NotFoundException', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateTenantDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent-id', updateTenantDto),
      ).rejects.toThrow('租户 non-existent-id 不存在');
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('当更新后的名称已存在时应该抛出 BadRequestException', async () => {
      const existingTenant = {
        ...mockTenant,
        id: 'different-id',
        name: updateTenantDto.name,
      };
      tenantRepository.findOne
        .mockResolvedValueOnce(mockTenant) // 查找租户
        .mockResolvedValueOnce(existingTenant); // 检查名称唯一性

      await expect(
        service.update(mockTenant.id, updateTenantDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(mockTenant.id, updateTenantDto),
      ).rejects.toThrow(`租户名称 ${updateTenantDto.name} 已存在`);
    });

    it('当名称未改变时应该跳过名称唯一性检查', async () => {
      const dtoWithSameName: UpdateTenantDto = {
        name: mockTenant.name,
      };
      tenantRepository.findOne.mockResolvedValueOnce(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      await service.update(mockTenant.id, dtoWithSameName);

      expect(tenantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(tenantRepository.save).toHaveBeenCalled();
    });

    it('当更新域名且域名已存在时应该抛出 BadRequestException', async () => {
      const updateDto: UpdateTenantDto = {
        domain: 'existing-domain',
      };
      const existingTenant = {
        ...mockTenant,
        id: 'different-id',
        domain: 'existing-domain',
      };
      tenantRepository.findOne
        .mockResolvedValueOnce(mockTenant) // 查找租户
        .mockResolvedValueOnce(existingTenant); // 检查域名唯一性

      await expect(service.update(mockTenant.id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(mockTenant.id, updateDto)).rejects.toThrow(
        '租户域名 existing-domain 已存在',
      );
    });

    it('应该支持部分更新', async () => {
      const partialUpdate: UpdateTenantDto = {
        isActive: false,
      };
      const updatedTenant = { ...mockTenant, isActive: false };
      tenantRepository.findOne.mockResolvedValueOnce(mockTenant);
      tenantRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.update(mockTenant.id, partialUpdate);

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('应该成功删除租户', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.remove.mockResolvedValue(mockTenant);

      await service.remove(mockTenant.id);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
      });
      expect(tenantRepository.remove).toHaveBeenCalledWith(mockTenant);
    });

    it('当租户不存在时应该抛出 NotFoundException', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        '租户 non-existent-id 不存在',
      );
      expect(tenantRepository.remove).not.toHaveBeenCalled();
    });
  });
});
