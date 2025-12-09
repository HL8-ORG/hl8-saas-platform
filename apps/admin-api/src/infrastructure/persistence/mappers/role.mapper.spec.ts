import { Role as DomainRole } from '../../../domain/roles/entities/role.aggregate';
import { Role as OrmRole } from '../typeorm/entities/role.entity';
import { RoleMapper } from './role.mapper';

/**
 * 角色映射器单元测试
 *
 * 测试角色领域实体和 ORM 实体之间的映射。
 *
 * @describe RoleMapper
 */
describe('RoleMapper', () => {
  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  describe('toDomain', () => {
    it('应该将 ORM 实体转换为领域实体', () => {
      const ormRole: OrmRole = {
        id: validRoleId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: [],
      };

      const domainRole = RoleMapper.toDomain(ormRole);

      expect(domainRole).toBeInstanceOf(DomainRole);
      expect(domainRole.id.toString()).toBe(validRoleId);
      expect(domainRole.name.value).toBe('admin');
      expect(domainRole.displayName).toBe('Administrator');
      expect(domainRole.description).toBe('Administrator role');
      expect(domainRole.isActive).toBe(true);
      expect(domainRole.tenantId.toString()).toBe(validTenantId);
    });

    it('应该处理没有 displayName 的情况', () => {
      const ormRole: OrmRole = {
        id: validRoleId,
        name: 'user',
        displayName: null,
        description: null,
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: [],
      };

      const domainRole = RoleMapper.toDomain(ormRole);

      expect(domainRole.displayName).toBe('user');
      expect(domainRole.description).toBeNull();
    });

    it('应该处理未激活角色', () => {
      const ormRole: OrmRole = {
        id: validRoleId,
        name: 'inactive',
        displayName: 'Inactive Role',
        description: null,
        isActive: false,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: [],
      };

      const domainRole = RoleMapper.toDomain(ormRole);

      expect(domainRole.isActive).toBe(false);
    });
  });

  describe('toOrm', () => {
    it('应该将领域实体转换为 ORM 实体', () => {
      const domainRole = DomainRole.reconstitute({
        id: validRoleId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormRole = RoleMapper.toOrm(domainRole);

      expect(ormRole.id).toBe(validRoleId);
      expect(ormRole.name).toBe('admin');
      expect(ormRole.displayName).toBe('Administrator');
      expect(ormRole.description).toBe('Administrator role');
      expect(ormRole.isActive).toBe(true);
      expect(ormRole.tenantId).toBe(validTenantId);
    });

    it('应该处理 null 描述', () => {
      const domainRole = DomainRole.reconstitute({
        id: validRoleId,
        name: 'user',
        displayName: 'User',
        description: null,
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormRole = RoleMapper.toOrm(domainRole);

      expect(ormRole.description).toBeUndefined();
    });
  });

  describe('updateOrm', () => {
    it('应该更新 ORM 实体', () => {
      const ormRole: OrmRole = {
        id: validRoleId,
        name: 'old-name',
        displayName: 'Old Display Name',
        description: 'Old description',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: [],
      };

      const domainRole = DomainRole.reconstitute({
        id: validRoleId,
        name: 'new-name',
        displayName: 'New Display Name',
        description: 'New description',
        isActive: false,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      RoleMapper.updateOrm(ormRole, domainRole);

      expect(ormRole.name).toBe('new-name');
      expect(ormRole.displayName).toBe('New Display Name');
      expect(ormRole.description).toBe('New description');
      expect(ormRole.isActive).toBe(false);
      expect(ormRole.updatedAt).toEqual(new Date('2024-01-02'));
    });
  });

  describe('往返转换', () => {
    it('应该能够往返转换（ORM -> Domain -> ORM）', () => {
      const originalOrm: OrmRole = {
        id: validRoleId,
        name: 'test-role',
        displayName: 'Test Role',
        description: 'Test description',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        permissions: [],
      };

      const domain = RoleMapper.toDomain(originalOrm);
      const convertedOrm = RoleMapper.toOrm(domain);

      expect(convertedOrm.id).toBe(originalOrm.id);
      expect(convertedOrm.name).toBe(originalOrm.name);
      expect(convertedOrm.displayName).toBe(originalOrm.displayName);
      expect(convertedOrm.description).toBe(originalOrm.description);
      expect(convertedOrm.isActive).toBe(originalOrm.isActive);
      expect(convertedOrm.tenantId).toBe(originalOrm.tenantId);
    });
  });
});
