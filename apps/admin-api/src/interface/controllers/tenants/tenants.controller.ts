import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTenantCommand } from '../../../application/tenants/commands/create-tenant.command';
import { DeleteTenantCommand } from '../../../application/tenants/commands/delete-tenant.command';
import { UpdateTenantCommand } from '../../../application/tenants/commands/update-tenant.command';
import { GetTenantByDomainQuery } from '../../../application/tenants/queries/get-tenant-by-domain.query';
import { GetTenantByIdQuery } from '../../../application/tenants/queries/get-tenant-by-id.query';
import { GetTenantsQuery } from '../../../application/tenants/queries/get-tenants.query';
import { PublicTenant } from '../../../common/decorators/tenant.decorator';
import { CreateTenantDto } from '../../dtos/tenants/create-tenant.dto';
import { UpdateTenantDto } from '../../dtos/tenants/update-tenant.dto';

/**
 * 租户控制器
 *
 * 处理租户相关的 REST API 请求。
 * 使用 CQRS 架构，通过 CommandBus 和 QueryBus 处理请求。
 *
 * **权限控制**：
 * - 创建租户：公共接口，不需要租户上下文
 * - 其他路由：需要管理员权限（由 RolesGuard 控制）
 *
 * @class TenantsController
 * @description 租户管理的 REST API 控制器（CQRS）
 */
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 获取所有租户
   *
   * 查询系统中的所有租户。
   * 需要管理员权限。
   *
   * @returns {Promise<any>} 租户列表
   */
  @Get()
  async findAll() {
    return this.queryBus.execute(new GetTenantsQuery());
  }

  /**
   * 根据 ID 获取租户
   *
   * 查询指定租户的详细信息。
   * 需要管理员权限。
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<any>} 租户信息
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetTenantByIdQuery(id));
  }

  /**
   * 根据域名获取租户
   *
   * 查询指定域名的租户信息。
   * 此接口为公共接口，不需要租户上下文。
   *
   * @param {string} domain - 租户域名
   * @returns {Promise<any>} 租户信息
   */
  @Get('domain/:domain')
  @PublicTenant()
  async findByDomain(@Param('domain') domain: string) {
    return this.queryBus.execute(new GetTenantByDomainQuery(domain));
  }

  /**
   * 创建租户
   *
   * 创建新的租户。
   * 此接口为公共接口，不需要租户上下文。
   *
   * @param {CreateTenantDto} createTenantDto - 创建租户的 DTO
   * @returns {Promise<any>} 创建的租户
   */
  @Post()
  @PublicTenant()
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.commandBus.execute(
      new CreateTenantCommand(
        createTenantDto.name,
        createTenantDto.domain,
        createTenantDto.isActive,
      ),
    );
  }

  /**
   * 更新租户
   *
   * 更新指定租户的信息。
   * 需要管理员权限。
   *
   * @param {string} id - 租户 ID
   * @param {UpdateTenantDto} updateTenantDto - 更新租户的 DTO
   * @returns {Promise<any>} 更新后的租户
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.commandBus.execute(
      new UpdateTenantCommand(
        id,
        updateTenantDto.name,
        updateTenantDto.domain,
        updateTenantDto.isActive,
      ),
    );
  }

  /**
   * 删除租户
   *
   * 删除指定租户。
   * 需要管理员权限。
   *
   * **注意**：删除租户前应确保该租户下没有用户或其他关联数据。
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<any>} 删除成功消息
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteTenantCommand(id));
  }
}
