import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { CreatePermissionCommand } from '../../../application/permissions/commands/create-permission.command';
import { GetPermissionsQuery } from '../../../application/permissions/queries/get-permissions.query';
import type { ITenantResolver } from '../../../application/shared/interfaces/tenant-resolver.interface';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuthZGuard } from '../../../lib/casbin/authz.guard';
import { CreatePermissionDto } from '../../dtos/permissions/create-permission.dto';
import { PermissionsController } from './permissions.controller';

/**
 * 权限控制器单元测试
 *
 * 测试权限控制器的所有端点。
 *
 * @describe PermissionsController
 */
describe('PermissionsController', () => {
  let controller: PermissionsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockTenantResolver = {
      getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
      resolveTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
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

    controller = module.get<PermissionsController>(PermissionsController);
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

  describe('createPermission', () => {
    it('应该创建权限', async () => {
      const createPermissionDto: CreatePermissionDto = {
        resource: 'users',
        action: 'create',
        description: 'Create users',
      };
      const mockPermission = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
        resource: 'users',
        action: 'create',
        description: 'Create users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(mockPermission);

      const result = await controller.createPermission(createPermissionDto);

      expect(result).toEqual(mockPermission);
      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreatePermissionCommand),
      );
    });
  });

  describe('getPermissions', () => {
    it('应该获取所有权限', async () => {
      const mockPermissions = [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
          resource: 'users',
          action: 'create',
          description: 'Create users',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
          resource: 'users',
          action: 'read',
          description: 'Read users',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      queryBus.execute.mockResolvedValue(mockPermissions);

      const result = await controller.getPermissions();

      expect(result).toEqual(mockPermissions);
      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetPermissionsQuery),
      );
    });
  });
});
