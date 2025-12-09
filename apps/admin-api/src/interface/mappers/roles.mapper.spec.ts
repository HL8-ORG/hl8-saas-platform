import { CreateRoleInputDto } from '../../application/roles/dtos/create-role.input.dto';
import { DeleteRoleInputDto } from '../../application/roles/dtos/delete-role.input.dto';
import { GetRoleByIdInputDto } from '../../application/roles/dtos/get-role-by-id.input.dto';
import { GetRolePermissionsInputDto } from '../../application/roles/dtos/get-role-permissions.input.dto';
import { GetRolesInputDto } from '../../application/roles/dtos/get-roles.input.dto';
import { GrantRolePermissionInputDto } from '../../application/roles/dtos/grant-role-permission.input.dto';
import type { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';
import { AddRolePermissionDto } from '../dtos/roles/add-role-permission.dto';
import { CreateRoleDto } from '../dtos/roles/create-role.dto';
import { RolesMapper } from './roles.mapper';

/**
 * 角色HTTP DTO映射器单元测试
 *
 * 测试 RolesMapper 的所有静态方法。
 *
 * @describe RolesMapper
 */
describe('RolesMapper', () => {
  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  describe('toCreateRoleInput', () => {
    it('应该将HTTP创建角色DTO转换为用例输入DTO', async () => {
      const httpDto: CreateRoleDto = {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
      };

      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toCreateRoleInput(
        httpDto,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(CreateRoleInputDto);
      expect(result.tenantId).toBe(validTenantId);
      expect(result.name).toBe(httpDto.name);
      expect(result.displayName).toBe(httpDto.displayName);
      expect(result.description).toBe(httpDto.description);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toGetRolesInput', () => {
    it('应该转换为获取角色列表用例输入DTO', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toGetRolesInput(mockTenantResolver);

      expect(result).toBeInstanceOf(GetRolesInputDto);
      expect(result.tenantId).toBe(validTenantId);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toGetRoleByIdInput', () => {
    it('应该将角色ID转换为根据ID获取角色用例输入DTO', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toGetRoleByIdInput(
        validRoleId,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(GetRoleByIdInputDto);
      expect(result.roleId).toBe(validRoleId);
      expect(result.tenantId).toBe(validTenantId);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toDeleteRoleInput', () => {
    it('应该将角色ID转换为删除角色用例输入DTO', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toDeleteRoleInput(
        validRoleId,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(DeleteRoleInputDto);
      expect(result.roleId).toBe(validRoleId);
      expect(result.tenantId).toBe(validTenantId);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toGrantRolePermissionInput', () => {
    it('应该将HTTP添加角色权限DTO转换为用例输入DTO', async () => {
      const httpDto: AddRolePermissionDto = {
        resource: 'users',
        operation: 'read',
        description: 'Read users',
      };

      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toGrantRolePermissionInput(
        validRoleId,
        httpDto,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(GrantRolePermissionInputDto);
      expect(result.roleId).toBe(validRoleId);
      expect(result.tenantId).toBe(validTenantId);
      expect(result.resource).toBe(httpDto.resource);
      expect(result.action).toBe(httpDto.operation);
      expect(result.description).toBe(httpDto.description);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toGetRolePermissionsInput', () => {
    it('应该将角色ID转换为获取角色权限用例输入DTO（默认withDetails=false）', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toGetRolePermissionsInput(
        validRoleId,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(GetRolePermissionsInputDto);
      expect(result.roleId).toBe(validRoleId);
      expect(result.tenantId).toBe(validTenantId);
      expect(result.withDetails).toBe(false);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });

    it('应该将角色ID转换为获取角色权限用例输入DTO（withDetails=true）', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await RolesMapper.toGetRolePermissionsInput(
        validRoleId,
        mockTenantResolver,
        true,
      );

      expect(result).toBeInstanceOf(GetRolePermissionsInputDto);
      expect(result.roleId).toBe(validRoleId);
      expect(result.tenantId).toBe(validTenantId);
      expect(result.withDetails).toBe(true);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });
});
