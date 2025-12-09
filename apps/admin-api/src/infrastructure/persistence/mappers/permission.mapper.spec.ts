import { Permission as DomainPermission } from '../../../domain/permissions/entities/permission.aggregate';
import { Permission as OrmPermission } from '../typeorm/entities/permission.entity';
import { PermissionMapper } from './permission.mapper';

/**
 * 权限映射器单元测试
 *
 * 测试权限领域实体和 ORM 实体之间的映射。
 *
 * @describe PermissionMapper
 */
describe('PermissionMapper', () => {
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  describe('toDomain', () => {
    it('应该将 ORM 实体转换为领域实体', () => {
      const ormPermission: OrmPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        description: 'Read users permission',
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        roles: [],
      };

      const domainPermission = PermissionMapper.toDomain(ormPermission);

      expect(domainPermission).toBeInstanceOf(DomainPermission);
      expect(domainPermission.id.toString()).toBe(validPermissionId);
      expect(domainPermission.resource).toBe('users');
      expect(domainPermission.action).toBe('read');
      expect(domainPermission.description).toBe('Read users permission');
      expect(domainPermission.tenantId.toString()).toBe(validTenantId);
    });

    it('应该处理 null 描述', () => {
      const ormPermission: OrmPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'write',
        description: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        roles: [],
      };

      const domainPermission = PermissionMapper.toDomain(ormPermission);

      expect(domainPermission.description).toBeNull();
    });
  });

  describe('toOrm', () => {
    it('应该将领域实体转换为 ORM 实体', () => {
      const domainPermission = DomainPermission.reconstitute({
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        description: 'Read users permission',
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormPermission = PermissionMapper.toOrm(domainPermission);

      expect(ormPermission.id).toBe(validPermissionId);
      expect(ormPermission.resource).toBe('users');
      expect(ormPermission.action).toBe('read');
      expect(ormPermission.description).toBe('Read users permission');
      expect(ormPermission.tenantId).toBe(validTenantId);
    });

    it('应该处理 null 描述', () => {
      const domainPermission = DomainPermission.reconstitute({
        id: validPermissionId,
        resource: 'users',
        action: 'write',
        description: null,
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormPermission = PermissionMapper.toOrm(domainPermission);

      expect(ormPermission.description).toBeUndefined();
    });
  });

  describe('updateOrm', () => {
    it('应该更新 ORM 实体', () => {
      const ormPermission: OrmPermission = {
        id: validPermissionId,
        resource: 'old-resource',
        action: 'old-action',
        description: 'Old description',
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        roles: [],
      };

      const domainPermission = DomainPermission.reconstitute({
        id: validPermissionId,
        resource: 'new-resource',
        action: 'new-action',
        description: 'New description',
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      PermissionMapper.updateOrm(ormPermission, domainPermission);

      expect(ormPermission.resource).toBe('new-resource');
      expect(ormPermission.action).toBe('new-action');
      expect(ormPermission.description).toBe('New description');
      expect(ormPermission.updatedAt).toEqual(new Date('2024-01-02'));
    });
  });

  describe('往返转换', () => {
    it('应该能够往返转换（ORM -> Domain -> ORM）', () => {
      const originalOrm: OrmPermission = {
        id: validPermissionId,
        resource: 'users',
        action: 'read',
        description: 'Read users permission',
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        roles: [],
      };

      const domain = PermissionMapper.toDomain(originalOrm);
      const convertedOrm = PermissionMapper.toOrm(domain);

      expect(convertedOrm.id).toBe(originalOrm.id);
      expect(convertedOrm.resource).toBe(originalOrm.resource);
      expect(convertedOrm.action).toBe(originalOrm.action);
      expect(convertedOrm.description).toBe(originalOrm.description);
      expect(convertedOrm.tenantId).toBe(originalOrm.tenantId);
    });

    it('应该能够往返转换（Domain -> ORM -> Domain）', () => {
      const originalDomain = DomainPermission.reconstitute({
        id: validPermissionId,
        resource: 'users',
        action: 'write',
        description: 'Write users permission',
        tenantId: validTenantId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const orm = PermissionMapper.toOrm(originalDomain);
      const convertedDomain = PermissionMapper.toDomain({
        ...orm,
        roles: [],
      } as OrmPermission);

      expect(convertedDomain.id.toString()).toBe(originalDomain.id.toString());
      expect(convertedDomain.resource).toBe(originalDomain.resource);
      expect(convertedDomain.action).toBe(originalDomain.action);
      expect(convertedDomain.description).toBe(originalDomain.description);
      expect(convertedDomain.tenantId.toString()).toBe(
        originalDomain.tenantId.toString(),
      );
    });
  });
});
