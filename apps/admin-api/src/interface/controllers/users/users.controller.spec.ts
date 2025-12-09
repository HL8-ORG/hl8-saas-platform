import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { ITenantResolver } from '../../../application/shared/interfaces/tenant-resolver.interface';
import { DeleteUserCommand } from '../../../application/users/commands/delete-user.command';
import { UpdateProfileCommand } from '../../../application/users/commands/update-profile.command';
import { UpdateUserCommand } from '../../../application/users/commands/update-user.command';
import { GetProfileQuery } from '../../../application/users/queries/get-profile.query';
import { GetUserByIdQuery } from '../../../application/users/queries/get-user-by-id.query';
import { GetUsersQuery } from '../../../application/users/queries/get-users.query';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PaginationDto } from '../../dtos/users/pagination.dto';
import { UpdateProfileDto } from '../../dtos/users/update-profile.dto';
import { UpdateUserDto } from '../../dtos/users/update-user.dto';
import { UsersController } from './users.controller';

/**
 * 用户控制器单元测试
 *
 * 测试用户控制器的所有端点。
 *
 * @describe UsersController
 */
describe('UsersController', () => {
  let controller: UsersController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let tenantResolver: jest.Mocked<ITenantResolver>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

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
      controllers: [UsersController],
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
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      } as any)
      .compile();

    controller = module.get<UsersController>(UsersController);
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

  describe('getProfile', () => {
    it('应该获取当前用户的个人资料', async () => {
      const mockProfile = {
        id: validUserId,
        email: 'user@example.com',
        fullName: 'Test User',
        role: 'USER',
      };

      queryBus.execute.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(validUserId);

      expect(result).toEqual(mockProfile);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetProfileQuery),
      );
    });
  });

  describe('updateProfile', () => {
    it('应该更新当前用户的个人资料', async () => {
      const updateProfileDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };
      const mockUpdatedProfile = {
        id: validUserId,
        email: 'user@example.com',
        fullName: 'Updated Name',
        role: 'USER',
      };

      commandBus.execute.mockResolvedValue(mockUpdatedProfile);

      const result = await controller.updateProfile(
        validUserId,
        updateProfileDto,
      );

      expect(result).toEqual(mockUpdatedProfile);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateProfileCommand),
      );
    });
  });

  describe('getAllUsers', () => {
    it('应该获取所有用户列表', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };
      const mockUsers = {
        data: [
          {
            id: validUserId,
            email: 'user@example.com',
            fullName: 'Test User',
            role: 'USER',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      queryBus.execute.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers(paginationDto);

      expect(result).toEqual(mockUsers);
      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetUsersQuery));
    });
  });

  describe('getUserById', () => {
    it('应该根据ID获取用户', async () => {
      const mockUser = {
        id: validUserId,
        email: 'user@example.com',
        fullName: 'Test User',
        role: 'USER',
      };

      queryBus.execute.mockResolvedValue(mockUser);

      const result = await controller.getUserById(validUserId);

      expect(result).toEqual(mockUser);
      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetUserByIdQuery),
      );
    });
  });

  describe('updateUserById', () => {
    it('应该根据ID更新用户', async () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'Updated Name',
        role: 'ADMIN',
        isActive: true,
      };
      const mockUpdatedUser = {
        id: validUserId,
        email: 'user@example.com',
        fullName: 'Updated Name',
        role: 'ADMIN',
        isActive: true,
      };

      commandBus.execute.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUserById(
        validUserId,
        updateUserDto,
      );

      expect(result).toEqual(mockUpdatedUser);
      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateUserCommand),
      );
    });
  });

  describe('deleteUserById', () => {
    it('应该根据ID删除用户', async () => {
      const mockDeleteResult = {
        message: '用户删除成功',
      };

      commandBus.execute.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteUserById(validUserId);

      expect(result).toEqual(mockDeleteResult);
      expect(tenantResolver.getCurrentTenantId).toHaveBeenCalled();
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteUserCommand),
      );
    });
  });
});
