import { UserRole } from '@/domain/users/entities/user.aggregate';
import type { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';
import { DeleteUserInputDto } from '../../application/users/dtos/delete-user.input.dto';
import { GetProfileInputDto } from '../../application/users/dtos/get-profile.input.dto';
import { GetUserByIdInputDto } from '../../application/users/dtos/get-user-by-id.input.dto';
import { GetUsersInputDto } from '../../application/users/dtos/get-users.input.dto';
import { UpdateProfileInputDto } from '../../application/users/dtos/update-profile.input.dto';
import { UpdateUserInputDto } from '../../application/users/dtos/update-user.input.dto';
import { PaginationDto } from '../dtos/users/pagination.dto';
import { UpdateProfileDto } from '../dtos/users/update-profile.dto';
import { UpdateUserDto } from '../dtos/users/update-user.dto';
import { UsersMapper } from './users.mapper';

/**
 * 用户HTTP DTO映射器单元测试
 *
 * 测试 UsersMapper 的所有静态方法。
 *
 * @describe UsersMapper
 */
describe('UsersMapper', () => {
  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  describe('toGetProfileInput', () => {
    it('应该将用户ID转换为获取个人资料用例输入DTO', () => {
      const result = UsersMapper.toGetProfileInput(validUserId);

      expect(result).toBeInstanceOf(GetProfileInputDto);
      expect(result.userId.toString()).toBe(validUserId);
    });
  });

  describe('toUpdateProfileInput', () => {
    it('应该将HTTP更新个人资料DTO转换为用例输入DTO', () => {
      const httpDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };

      const result = UsersMapper.toUpdateProfileInput(validUserId, httpDto);

      expect(result).toBeInstanceOf(UpdateProfileInputDto);
      expect(result.userId.toString()).toBe(validUserId);
      expect(result.fullName).toBe(httpDto.fullName);
    });
  });

  describe('toGetUsersInput', () => {
    it('应该将分页参数和租户ID转换为获取用户列表用例输入DTO', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };

      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await UsersMapper.toGetUsersInput(
        paginationDto,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(GetUsersInputDto);
      expect(result.tenantId).toBe(validTenantId);
      expect(result.page).toBe(paginationDto.page);
      expect(result.limit).toBe(paginationDto.limit);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toGetUserByIdInput', () => {
    it('应该将用户ID和租户ID转换为根据ID获取用户用例输入DTO', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await UsersMapper.toGetUserByIdInput(
        validUserId,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(GetUserByIdInputDto);
      expect(result.userId.toString()).toBe(validUserId);
      expect(result.tenantId.toString()).toBe(validTenantId);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toUpdateUserInput', () => {
    it('应该将HTTP更新用户DTO转换为用例输入DTO', async () => {
      const httpDto: UpdateUserDto = {
        fullName: 'Updated Name',
        role: UserRole.ADMIN,
        isActive: true,
      };

      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await UsersMapper.toUpdateUserInput(
        validUserId,
        httpDto,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(UpdateUserInputDto);
      expect(result.userId.toString()).toBe(validUserId);
      expect(result.tenantId.toString()).toBe(validTenantId);
      expect(result.fullName).toBe(httpDto.fullName);
      expect(result.role).toBe(httpDto.role);
      expect(result.isActive).toBe(httpDto.isActive);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });

  describe('toDeleteUserInput', () => {
    it('应该将用户ID和租户ID转换为删除用户用例输入DTO', async () => {
      const mockTenantResolver: ITenantResolver = {
        getCurrentTenantId: jest.fn().mockReturnValue(validTenantId),
        resolveTenantId: jest.fn(),
      };

      const result = await UsersMapper.toDeleteUserInput(
        validUserId,
        mockTenantResolver,
      );

      expect(result).toBeInstanceOf(DeleteUserInputDto);
      expect(result.userId.toString()).toBe(validUserId);
      expect(result.tenantId.toString()).toBe(validTenantId);
      expect(mockTenantResolver.getCurrentTenantId).toHaveBeenCalled();
    });
  });
});
