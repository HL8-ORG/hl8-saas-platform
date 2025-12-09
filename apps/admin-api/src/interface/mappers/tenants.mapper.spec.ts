import { CreateTenantInputDto } from '../../application/tenants/dtos/create-tenant.input.dto';
import { DeleteTenantInputDto } from '../../application/tenants/dtos/delete-tenant.input.dto';
import { GetTenantByDomainInputDto } from '../../application/tenants/dtos/get-tenant-by-domain.input.dto';
import { GetTenantByIdInputDto } from '../../application/tenants/dtos/get-tenant-by-id.input.dto';
import { GetTenantsInputDto } from '../../application/tenants/dtos/get-tenants.input.dto';
import { UpdateTenantInputDto } from '../../application/tenants/dtos/update-tenant.input.dto';
import { CreateTenantDto } from '../dtos/tenants/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/tenants/update-tenant.dto';
import { TenantsMapper } from './tenants.mapper';

/**
 * 租户HTTP DTO映射器单元测试
 *
 * 测试 TenantsMapper 的所有静态方法。
 *
 * @describe TenantsMapper
 */
describe('TenantsMapper', () => {
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validDomain = 'test-tenant';

  describe('toCreateTenantInput', () => {
    it('应该将HTTP创建租户DTO转换为用例输入DTO', () => {
      const httpDto: CreateTenantDto = {
        name: 'Test Tenant',
        domain: validDomain,
        isActive: true,
      };

      const result = TenantsMapper.toCreateTenantInput(httpDto);

      expect(result).toBeInstanceOf(CreateTenantInputDto);
      expect(result.name).toBe(httpDto.name);
      expect(result.domain).toBe(httpDto.domain);
      expect(result.isActive).toBe(httpDto.isActive);
    });
  });

  describe('toGetTenantsInput', () => {
    it('应该转换为获取租户列表用例输入DTO', () => {
      const result = TenantsMapper.toGetTenantsInput();

      expect(result).toBeInstanceOf(GetTenantsInputDto);
    });
  });

  describe('toGetTenantByIdInput', () => {
    it('应该将租户ID转换为根据ID获取租户用例输入DTO', () => {
      const result = TenantsMapper.toGetTenantByIdInput(validTenantId);

      expect(result).toBeInstanceOf(GetTenantByIdInputDto);
      expect(result.tenantId).toBe(validTenantId);
    });
  });

  describe('toGetTenantByDomainInput', () => {
    it('应该将域名转换为根据域名获取租户用例输入DTO', () => {
      const result = TenantsMapper.toGetTenantByDomainInput(validDomain);

      expect(result).toBeInstanceOf(GetTenantByDomainInputDto);
      expect(result.domain).toBe(validDomain);
    });
  });

  describe('toUpdateTenantInput', () => {
    it('应该将HTTP更新租户DTO转换为用例输入DTO', () => {
      const httpDto: UpdateTenantDto = {
        name: 'Updated Tenant',
        domain: validDomain,
        isActive: false,
      };

      const result = TenantsMapper.toUpdateTenantInput(validTenantId, httpDto);

      expect(result).toBeInstanceOf(UpdateTenantInputDto);
      expect(result.tenantId).toBe(validTenantId);
      expect(result.name).toBe(httpDto.name);
      expect(result.domain).toBe(httpDto.domain);
      expect(result.isActive).toBe(httpDto.isActive);
    });
  });

  describe('toDeleteTenantInput', () => {
    it('应该将租户ID转换为删除租户用例输入DTO', () => {
      const result = TenantsMapper.toDeleteTenantInput(validTenantId);

      expect(result).toBeInstanceOf(DeleteTenantInputDto);
      expect(result.tenantId).toBe(validTenantId);
    });
  });
});
