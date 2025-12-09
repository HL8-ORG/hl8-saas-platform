import { Test, TestingModule } from '@nestjs/testing';
import type { IPermissionReadRepository } from '../../../../domain/permissions/repositories/permission-read.repository.interface';
import { GetPermissionsQuery } from '../get-permissions.query';
import { GetPermissionsHandler } from './get-permissions.handler';

/**
 * 获取权限列表查询处理器单元测试
 *
 * 测试 GetPermissionsHandler 的所有场景。
 *
 * @describe GetPermissionsHandler
 */
describe('GetPermissionsHandler', () => {
  let handler: GetPermissionsHandler;
  let permissionReadRepository: jest.Mocked<IPermissionReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockPermissionReadRepository = {
      findById: jest.fn(),
      findByResourceAndAction: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPermissionsHandler,
        {
          provide: 'IPermissionReadRepository',
          useValue: mockPermissionReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPermissionsHandler>(GetPermissionsHandler);
    permissionReadRepository = module.get('IPermissionReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该返回权限列表', async () => {
      const mockPermissions = [
        {
          id: validPermissionId,
          resource: 'users',
          action: 'read',
          description: 'Read users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'permission2',
          resource: 'users',
          action: 'write',
          description: 'Write users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const query = new GetPermissionsQuery(validTenantId);

      permissionReadRepository.findAll.mockResolvedValue(
        mockPermissions as any,
      );

      const result = await handler.execute(query);

      expect(permissionReadRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(validPermissionId);
      expect(result[0].resource).toBe('users');
      expect(result[0].action).toBe('read');
    });

    it('应该返回空列表当没有权限时', async () => {
      const query = new GetPermissionsQuery(validTenantId);

      permissionReadRepository.findAll.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toHaveLength(0);
    });
  });
});
