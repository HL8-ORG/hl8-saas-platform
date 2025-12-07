import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';

/**
 * 租户服务类
 *
 * 负责处理租户相关的业务逻辑，包括租户的创建、查询、更新和验证。
 *
 * @class TenantsService
 * @description 租户业务逻辑处理服务
 */
@Injectable()
export class TenantsService {
  /**
   * 构造函数
   *
   * 注入租户仓库依赖。
   *
   * @param {Repository<Tenant>} tenantRepository - 租户仓库
   */
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * 查找所有租户
   *
   * 查询系统中的所有租户。
   *
   * @returns {Promise<Tenant[]>} 租户数组
   */
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 查找租户
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<Tenant | null>} 租户或 null
   */
  async findOne(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id } });
  }

  /**
   * 根据域名查找租户
   *
   * @param {string} domain - 租户域名
   * @returns {Promise<Tenant | null>} 租户或 null
   */
  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { domain } });
  }

  /**
   * 验证租户是否存在且激活
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<Tenant>} 租户实体
   * @throws {NotFoundException} 当租户不存在或未激活时抛出
   */
  async validateTenant(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!tenant) {
      throw new NotFoundException(`租户 ${id} 不存在`);
    }
    if (!tenant.isActive) {
      throw new NotFoundException(`租户 ${id} 未激活`);
    }
    return tenant;
  }

  /**
   * 创建租户
   *
   * 创建新的租户。
   *
   * **业务规则**：
   * - 租户名称必须唯一
   * - 租户域名必须唯一（如果提供）
   * - 新租户默认状态为激活
   *
   * @param {CreateTenantDto} createTenantDto - 租户创建 DTO
   * @returns {Promise<Tenant>} 创建的租户
   * @throws {BadRequestException} 当租户名称或域名已存在时抛出
   */
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const { name, domain, isActive = true } = createTenantDto;

    // 检查名称是否已存在
    const existingByName = await this.tenantRepository.findOne({
      where: { name },
    });
    if (existingByName) {
      throw new BadRequestException(`租户名称 ${name} 已存在`);
    }

    // 检查域名是否已存在（如果提供）
    if (domain) {
      const existingByDomain = await this.tenantRepository.findOne({
        where: { domain },
      });
      if (existingByDomain) {
        throw new BadRequestException(`租户域名 ${domain} 已存在`);
      }
    }

    const tenant = this.tenantRepository.create({
      name,
      domain,
      isActive,
    });

    return this.tenantRepository.save(tenant);
  }

  /**
   * 更新租户
   *
   * 更新租户信息。
   *
   * **业务规则**：
   * - 租户名称必须唯一（如果更新）
   * - 租户域名必须唯一（如果更新）
   *
   * @param {string} id - 租户 ID
   * @param {UpdateTenantDto} updateTenantDto - 租户更新 DTO
   * @returns {Promise<Tenant>} 更新后的租户
   * @throws {NotFoundException} 当租户不存在时抛出
   * @throws {BadRequestException} 当租户名称或域名已存在时抛出
   */
  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!tenant) {
      throw new NotFoundException(`租户 ${id} 不存在`);
    }

    // 检查名称是否已存在（如果更新名称）
    if (updateTenantDto.name && updateTenantDto.name !== tenant.name) {
      const existingByName = await this.tenantRepository.findOne({
        where: { name: updateTenantDto.name },
      });
      if (existingByName) {
        throw new BadRequestException(
          `租户名称 ${updateTenantDto.name} 已存在`,
        );
      }
    }

    // 检查域名是否已存在（如果更新域名）
    if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
      const existingByDomain = await this.tenantRepository.findOne({
        where: { domain: updateTenantDto.domain },
      });
      if (existingByDomain) {
        throw new BadRequestException(
          `租户域名 ${updateTenantDto.domain} 已存在`,
        );
      }
    }

    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  /**
   * 删除租户
   *
   * 删除指定租户。
   *
   * **注意**：删除租户前应确保该租户下没有用户或其他关联数据。
   *
   * @param {string} id - 租户 ID
   * @returns {Promise<void>}
   * @throws {NotFoundException} 当租户不存在时抛出
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    if (!tenant) {
      throw new NotFoundException(`租户 ${id} 不存在`);
    }

    await this.tenantRepository.remove(tenant);
  }
}
