import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { DeleteRoleCommand } from '../delete-role.command';
import { DeleteRoleHandler } from './delete-role.handler';

/**
 * 删除角色命令处理器单元测试
 *
 * 测试 DeleteRoleHandler 的所有场景。
 *
 * @describe DeleteRoleHandler
 */
describe('DeleteRoleHandler', () => {
  let handler: DeleteRoleHandler;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRoleName = 'admin';

  beforeEach(async () => {
    const mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteRoleHandler,
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<DeleteRoleHandler>(DeleteRoleHandler);
    roleRepository = module.get('IRoleRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该成功删除角色', async () => {
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

      const command = new DeleteRoleCommand(validRoleId, validTenantId);

      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.delete.mockResolvedValue(undefined);
      const deleteSpy = jest.spyOn(mockRole, 'delete');
      jest.spyOn(mockRole, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(deleteSpy).toHaveBeenCalled();
      expect(roleRepository.delete).toHaveBeenCalled();
      expect(result.message).toBe('角色删除成功');
    });

    it('应该抛出 NotFoundException 当角色不存在时', async () => {
      const command = new DeleteRoleCommand(validRoleId, validTenantId);

      roleRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow('角色不存在');

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(roleRepository.delete).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
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

      const command = new DeleteRoleCommand(validRoleId, validTenantId);

      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.delete.mockResolvedValue(undefined);
      jest.spyOn(mockRole, 'delete').mockImplementation(() => {});
      const mockEvents = [{ type: 'RoleDeletedEvent' }];
      jest
        .spyOn(mockRole, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
