import { Tenant as DomainTenant } from '../../../domain/tenants/entities/tenant.aggregate';
import { Tenant as OrmTenant } from '../typeorm/entities/tenant.entity';
import { TenantMapper } from './tenant.mapper';

/**
 * 租户映射器单元测试
 *
 * 测试租户领域实体和 ORM 实体之间的映射。
 *
 * @describe TenantMapper
 */
describe('TenantMapper', () => {
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  describe('toDomain', () => {
    it('应该将 ORM 实体转换为领域实体', () => {
      const ormTenant: OrmTenant = {
        id: validTenantId,
        name: 'Test Tenant',
        domain: 'test-example', // 有效的域名格式（只包含字母、数字和连字符）
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        users: [],
        roles: [],
      };

      const domainTenant = TenantMapper.toDomain(ormTenant);

      expect(domainTenant).toBeInstanceOf(DomainTenant);
      expect(domainTenant.id.toString()).toBe(validTenantId);
      expect(domainTenant.name.value).toBe('Test Tenant');
      expect(domainTenant.domain?.value).toBe('test-example');
      expect(domainTenant.isActive).toBe(true);
    });

    it('应该处理 null 域名', () => {
      const ormTenant: OrmTenant = {
        id: validTenantId,
        name: 'Test Tenant',
        domain: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        users: [],
        roles: [],
      };

      const domainTenant = TenantMapper.toDomain(ormTenant);

      expect(domainTenant.domain).toBeNull();
    });

    it('应该处理未激活租户', () => {
      const ormTenant: OrmTenant = {
        id: validTenantId,
        name: 'Inactive Tenant',
        domain: 'inactive-tenant', // 有效的域名格式
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        users: [],
        roles: [],
      };

      const domainTenant = TenantMapper.toDomain(ormTenant);

      expect(domainTenant.isActive).toBe(false);
    });
  });

  describe('toOrm', () => {
    it('应该将领域实体转换为 ORM 实体', () => {
      const domainTenant = DomainTenant.reconstitute({
        id: validTenantId,
        name: 'Test Tenant',
        domain: 'test-example', // 有效的域名格式
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormTenant = TenantMapper.toOrm(domainTenant);

      expect(ormTenant.id).toBe(validTenantId);
      expect(ormTenant.name).toBe('Test Tenant');
      expect(ormTenant.domain).toBe('test-example');
      expect(ormTenant.isActive).toBe(true);
    });

    it('应该处理 null 域名', () => {
      const domainTenant = DomainTenant.reconstitute({
        id: validTenantId,
        name: 'Test Tenant',
        domain: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const ormTenant = TenantMapper.toOrm(domainTenant);

      expect(ormTenant.domain).toBeUndefined();
    });
  });

  describe('updateOrm', () => {
    it('应该更新 ORM 实体', () => {
      const ormTenant: OrmTenant = {
        id: validTenantId,
        name: 'Old Name',
        domain: 'old-tenant', // 有效的域名格式
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        users: [],
        roles: [],
      };

      const domainTenant = DomainTenant.reconstitute({
        id: validTenantId,
        name: 'New Name',
        domain: 'new-tenant', // 有效的域名格式
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      TenantMapper.updateOrm(ormTenant, domainTenant);

      expect(ormTenant.name).toBe('New Name');
      expect(ormTenant.domain).toBe('new-tenant');
      expect(ormTenant.isActive).toBe(false);
      expect(ormTenant.updatedAt).toEqual(new Date('2024-01-02'));
    });
  });

  describe('往返转换', () => {
    it('应该能够往返转换（ORM -> Domain -> ORM）', () => {
      const originalOrm: OrmTenant = {
        id: validTenantId,
        name: 'Test Tenant',
        domain: 'test-tenant', // 有效的域名格式
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        users: [],
        roles: [],
      };

      const domain = TenantMapper.toDomain(originalOrm);
      const convertedOrm = TenantMapper.toOrm(domain);

      expect(convertedOrm.id).toBe(originalOrm.id);
      expect(convertedOrm.name).toBe(originalOrm.name);
      expect(convertedOrm.domain).toBe(originalOrm.domain);
      expect(convertedOrm.isActive).toBe(originalOrm.isActive);
    });

    it('应该能够往返转换（Domain -> ORM -> Domain）', () => {
      const originalDomain = DomainTenant.reconstitute({
        id: validTenantId,
        name: 'Test Tenant',
        domain: 'test-tenant', // 有效的域名格式
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const orm = TenantMapper.toOrm(originalDomain);
      const convertedDomain = TenantMapper.toDomain({
        ...orm,
        users: [],
        roles: [],
      } as OrmTenant);

      expect(convertedDomain.id.toString()).toBe(originalDomain.id.toString());
      expect(convertedDomain.name.value).toBe(originalDomain.name.value);
      expect(convertedDomain.domain?.value).toBe(originalDomain.domain?.value);
      expect(convertedDomain.isActive).toBe(originalDomain.isActive);
    });
  });
});
