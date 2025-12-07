import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PublicTenant } from '../../common/decorators/tenant.decorator';
import { Tenant } from '../../entities/tenant.entity';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantsService } from './tenants.service';

/**
 * 租户控制器
 *
 * 处理租户相关的 REST API 请求。
 * 包含租户的创建、查询、更新和删除端点。
 *
 * **多租户支持**：
 * - 租户注册等公共路由使用 @PublicTenant() 装饰器
 * - 租户管理接口需要管理员权限（由 RolesGuard 控制）
 *
 * @class TenantsController
 * @description 租户管理的 REST API 控制器
 */
@Controller('tenants')
export class TenantsController {
  /**
   * 构造函数
   *
   * 注入租户服务依赖。
   *
   * @param {TenantsService} tenantsService - 租户服务，处理租户业务逻辑
   */
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * 获取所有租户
   *
   * 查询系统中的所有租户。
   * 需要管理员权限。
   *
   * @returns {Promise<Tenant[]>} 租户数组
   */
  @Get()
  async findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  /**
   * 根据 ID 获取租户
   *
   * 查询指定租户的详细信息。
   * 需要管理员权限。
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<Tenant>} 租户实体
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tenant> {
    const tenant = await this.tenantsService.findOne(id);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }
    return tenant;
  }

  /**
   * 创建租户
   *
   * 创建新的租户。
   * 此接口为公共接口，不需要租户上下文。
   *
   * @param {CreateTenantDto} createTenantDto - 创建租户的 DTO
   * @returns {Promise<Tenant>} 创建的租户
   */
  @Post()
  @PublicTenant()
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }

  /**
   * 更新租户
   *
   * 更新指定租户的信息。
   * 需要管理员权限。
   *
   * @param {string} id - 租户 ID
   * @param {UpdateTenantDto} updateTenantDto - 更新租户的 DTO
   * @returns {Promise<Tenant>} 更新后的租户
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
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
   * @returns {Promise<{ message: string }>} 删除成功消息
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.tenantsService.remove(id);
    return { message: '租户删除成功' };
  }
}
