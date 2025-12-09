import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantRolePermissionCommand } from '../../../application/roles/commands/grant-role-permission.command';
import { GetRolePermissionsQuery } from '../../../application/roles/queries/get-role-permissions.query';
import type { ITenantResolver } from '../../../application/shared/interfaces/tenant-resolver.interface';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AddRolePermissionDto } from '../../../dtos/roles/add-role-permission.dto';
import { CreateRoleDto } from '../../../dtos/roles/create-role.dto';
import { AuthZGuard } from '../../../lib/casbin/authz.guard';
import { RolesController } from './roles.controller';

/**
 * 角色控制器单元测试
 *
 * 测试角色控制器的所有端点。
 *
 * @describe RolesController
 */
describe('RolesController', () => {
  let controller: RolesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn(),
      resolveTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: 'ITenantResolver',
          useValue: mockTenantResolver,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      } as any)
      .overrideGuard(AuthZGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      } as any)
      .compile();

    controller = module.get<RolesController>(RolesController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    tenantResolver = module.get('ITenantResolver');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllRoles', () => {
    it('应该返回角色列表', async () => {
      const mockResult = {
        data: [
          {
            id: validRoleId,
            name: 'admin',
            displayName: 'Administrator',
            description: 'Admin role',
            isActive: true,
          },
        ],
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.findAllRoles();

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: validTenantId,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createRole', () => {
    it('应该创建新角色', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Admin role',
        isActive: true,
      };

      const mockResult = {
        id: validRoleId,
        name: createRoleDto.name,
        displayName: createRoleDto.displayName,
        description: createRoleDto.description,
        isActive: createRoleDto.isActive,
        tenantId: validTenantId,
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      commandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.createRole(createRoleDto);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: validTenantId,
          name: createRoleDto.name,
          displayName: createRoleDto.displayName,
          description: createRoleDto.description,
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findRolePermissions', () => {
    it('应该返回角色的权限列表', async () => {
      const mockResult = {
        permissions: [
          {
            id: 'permission-1',
            resource: 'users',
            action: 'read',
            description: 'Read users',
          },
        ],
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      queryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.findRolePermissions(validRoleId);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetRolePermissionsQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findRolePermissionsWithDetails', () => {
    it('应该返回角色的权限列表（包含完整信息）', async () => {
      const mockResult = {
        permissions: [
          {
            id: 'permission-1',
            resource: 'users',
            action: 'read',
            description: 'Read users',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      queryBus.execute.mockResolvedValue(mockResult);

      const result =
        await controller.findRolePermissionsWithDetails(validRoleId);

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetRolePermissionsQuery),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('addRolePermission', () => {
    it('应该为角色授予权限', async () => {
      const addRolePermissionDto: AddRolePermissionDto = {
        resource: 'users',
        operation: 'read:any',
        description: 'Read users',
      };

      const mockResult = {
        message: 'Permission granted successfully',
      };

      tenantResolver.getCurrentTenantId.mockReturnValue(validTenantId);
      commandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.addRolePermission(
        validRoleId,
        addRolePermissionDto,
      );

      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(GrantRolePermissionCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });
});
