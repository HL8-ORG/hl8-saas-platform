import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import { GetRolesQuery } from '../get-roles.query';
import { GetRolesHandler } from './get-roles.handler';

/**
 * 获取角色列表查询处理器单元测试
 *
 * 测试 GetRolesHandler 的所有场景。
 *
 * @describe GetRolesHandler
 */
describe('GetRolesHandler', () => {
  let handler: GetRolesHandler;
  let roleReadRepository: jest.Mocked<IRoleReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRoleName = 'admin';

  beforeEach(async () => {
    const mockRoleReadRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRolesHandler,
        {
          provide: 'IRoleReadRepository',
          useValue: mockRoleReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetRolesHandler>(GetRolesHandler);
    roleReadRepository = module.get('IRoleReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该返回角色列表', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const query = new GetRolesQuery(validTenantId);

      roleReadRepository.findAll.mockResolvedValue([mockRole]);

      const result = await handler.execute(query);

      expect(roleReadRepository.findAll).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(validRoleId);
      expect(result.data[0].name).toBe(validRoleName);
      expect(result.data[0].displayName).toBe('Administrator');
    });

    it('应该返回空列表当没有角色时', async () => {
      const query = new GetRolesQuery(validTenantId);

      roleReadRepository.findAll.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result.data).toHaveLength(0);
    });
  });
});
