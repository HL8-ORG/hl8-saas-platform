import { CreateTenantInputDto } from '../../application/tenants/dtos/create-tenant.input.dto';
import { DeleteTenantInputDto } from '../../application/tenants/dtos/delete-tenant.input.dto';
import { GetTenantByDomainInputDto } from '../../application/tenants/dtos/get-tenant-by-domain.input.dto';
import { GetTenantByIdInputDto } from '../../application/tenants/dtos/get-tenant-by-id.input.dto';
import { GetTenantsInputDto } from '../../application/tenants/dtos/get-tenants.input.dto';
import { UpdateTenantInputDto } from '../../application/tenants/dtos/update-tenant.input.dto';
import { CreateTenantDto as HttpCreateTenantDto } from '../dtos/tenants/create-tenant.dto';
import { UpdateTenantDto as HttpUpdateTenantDto } from '../dtos/tenants/update-tenant.dto';

/**
 * 租户HTTP DTO映射器
 *
 * 负责HTTP层的DTO和应用层用例DTO之间的映射转换。
 * 处理HTTP请求到用例输入参数的转换。
 *
 * @class TenantsMapper
 * @description HTTP DTO ↔ 用例DTO映射器
 */
export class TenantsMapper {
  /**
   * 将HTTP创建租户DTO转换为用例输入DTO
   *
   * @param {HttpCreateTenantDto} httpDto - HTTP创建租户DTO
   * @returns {CreateTenantInputDto} 用例输入DTO
   */
  static toCreateTenantInput(
    httpDto: HttpCreateTenantDto,
  ): CreateTenantInputDto {
    return new CreateTenantInputDto({
      name: httpDto.name,
      domain: httpDto.domain,
      isActive: httpDto.isActive,
    });
  }

  /**
   * 转换为获取租户列表用例输入DTO
   *
   * @returns {GetTenantsInputDto} 用例输入DTO
   */
  static toGetTenantsInput(): GetTenantsInputDto {
    return new GetTenantsInputDto();
  }

  /**
   * 将租户ID转换为根据ID获取租户用例输入DTO
   *
   * @param {string} tenantId - 租户ID
   * @returns {GetTenantByIdInputDto} 用例输入DTO
   */
  static toGetTenantByIdInput(tenantId: string): GetTenantByIdInputDto {
    return new GetTenantByIdInputDto({ tenantId });
  }

  /**
   * 将域名转换为根据域名获取租户用例输入DTO
   *
   * @param {string} domain - 租户域名
   * @returns {GetTenantByDomainInputDto} 用例输入DTO
   */
  static toGetTenantByDomainInput(domain: string): GetTenantByDomainInputDto {
    return new GetTenantByDomainInputDto({ domain });
  }

  /**
   * 将HTTP更新租户DTO转换为用例输入DTO
   *
   * @param {string} tenantId - 租户ID
   * @param {HttpUpdateTenantDto} httpDto - HTTP更新租户DTO
   * @returns {UpdateTenantInputDto} 用例输入DTO
   */
  static toUpdateTenantInput(
    tenantId: string,
    httpDto: HttpUpdateTenantDto,
  ): UpdateTenantInputDto {
    return new UpdateTenantInputDto({
      tenantId,
      name: httpDto.name,
      domain: httpDto.domain,
      isActive: httpDto.isActive,
    });
  }

  /**
   * 将租户ID转换为删除租户用例输入DTO
   *
   * @param {string} tenantId - 租户ID
   * @returns {DeleteTenantInputDto} 用例输入DTO
   */
  static toDeleteTenantInput(tenantId: string): DeleteTenantInputDto {
    return new DeleteTenantInputDto({ tenantId });
  }
}
