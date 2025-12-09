import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import { GetRoleByIdQuery } from '../get-role-by-id.query';
import { GetRoleByIdHandler } from './get-role-by-id.handler';

/**
 * 根据ID获取角色查询处理器单元测试
 *
 * 测试 GetRoleByIdHandler 的所有场景。
 *
 * @describe GetRoleByIdHandler
 */
describe('GetRoleByIdHandler', () => {
  let handler: GetRoleByIdHandler;
  let roleReadRepository: jest.Mocked<IRoleReadRepository>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
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
        GetRoleByIdHandler,
        {
          provide: 'IRoleReadRepository',
          useValue: mockRoleReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetRoleByIdHandler>(GetRoleByIdHandler);
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
    it('应该返回角色信息', async () => {
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

      const query = new GetRoleByIdQuery(validRoleId, validTenantId);

      roleReadRepository.findById.mockResolvedValue(mockRole);

      const result = await handler.execute(query);

      expect(roleReadRepository.findById).toHaveBeenCalled();
      expect(result.id).toBe(validRoleId);
      expect(result.name).toBe(validRoleName);
      expect(result.displayName).toBe('Administrator');
      expect(result.description).toBe('Administrator role');
      expect(result.isActive).toBe(true);
    });

    it('应该抛出 NotFoundException 当角色不存在时', async () => {
      const query = new GetRoleByIdQuery(validRoleId, validTenantId);

      roleReadRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('角色不存在');

      expect(roleReadRepository.findById).toHaveBeenCalled();
    });
  });
});
