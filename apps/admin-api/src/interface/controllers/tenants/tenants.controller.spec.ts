import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTenantCommand } from '../../../application/tenants/commands/create-tenant.command';
import { DeleteTenantCommand } from '../../../application/tenants/commands/delete-tenant.command';
import { UpdateTenantCommand } from '../../../application/tenants/commands/update-tenant.command';
import { GetTenantByDomainQuery } from '../../../application/tenants/queries/get-tenant-by-domain.query';
import { GetTenantByIdQuery } from '../../../application/tenants/queries/get-tenant-by-id.query';
import { GetTenantsQuery } from '../../../application/tenants/queries/get-tenants.query';
import { CreateTenantDto } from '../../dtos/tenants/create-tenant.dto';
import { UpdateTenantDto } from '../../dtos/tenants/update-tenant.dto';
import { TenantsController } from './tenants.controller';

/**
 * 租户控制器单元测试
 *
 * 测试租户控制器的所有端点。
 *
 * @describe TenantsController
 */
describe('TenantsController', () => {
  let controller: TenantsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validDomain = 'test-tenant';

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('应该获取所有租户', async () => {
      const mockTenants = {
        data: [
          {
            id: validTenantId,
            name: 'Test Tenant',
            domain: validDomain,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      queryBus.execute.mockResolvedValue(mockTenants);

      const result = await controller.findAll();

      expect(result).toEqual(mockTenants);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetTenantsQuery),
      );
    });
  });

  describe('findOne', () => {
    it('应该根据ID获取租户', async () => {
      const mockTenant = {
        id: validTenantId,
        name: 'Test Tenant',
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryBus.execute.mockResolvedValue(mockTenant);

      const result = await controller.findOne(validTenantId);

      expect(result).toEqual(mockTenant);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetTenantByIdQuery),
      );
    });
  });

  describe('findByDomain', () => {
    it('应该根据域名获取租户', async () => {
      const mockTenant = {
        id: validTenantId,
        name: 'Test Tenant',
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryBus.execute.mockResolvedValue(mockTenant);

      const result = await controller.findByDomain(validDomain);

      expect(result).toEqual(mockTenant);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetTenantByDomainQuery),
      );
    });
  });

  describe('create', () => {
    it('应该创建租户', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'Test Tenant',
        domain: validDomain,
        isActive: true,
      };
      const mockTenant = {
        id: validTenantId,
        name: 'Test Tenant',
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(mockTenant);

      const result = await controller.create(createTenantDto);

      expect(result).toEqual(mockTenant);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateTenantCommand),
      );
    });
  });

  describe('update', () => {
    it('应该更新租户', async () => {
      const updateTenantDto: UpdateTenantDto = {
        name: 'Updated Tenant',
        domain: validDomain,
        isActive: true,
      };
      const mockUpdatedTenant = {
        id: validTenantId,
        name: 'Updated Tenant',
        domain: validDomain,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(mockUpdatedTenant);

      const result = await controller.update(validTenantId, updateTenantDto);

      expect(result).toEqual(mockUpdatedTenant);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateTenantCommand),
      );
    });
  });

  describe('remove', () => {
    it('应该删除租户', async () => {
      const mockDeleteResult = {
        message: '租户删除成功',
      };

      commandBus.execute.mockResolvedValue(mockDeleteResult);

      const result = await controller.remove(validTenantId);

      expect(result).toEqual(mockDeleteResult);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteTenantCommand),
      );
    });
  });
});
