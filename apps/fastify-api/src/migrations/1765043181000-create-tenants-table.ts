import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * 创建 tenants 表迁移
 *
 * 创建租户表，用于存储租户信息。
 *
 * @class CreateTenantsTable1765043181000
 * @implements {MigrationInterface}
 */
export class CreateTenantsTable1765043181000 implements MigrationInterface {
  /**
   * 执行迁移（向上）
   *
   * 创建 tenants 表，包含以下字段：
   * - id: UUID 主键
   * - name: 租户名称（唯一）
   * - domain: 租户域名（唯一，可选）
   * - is_active: 是否激活
   * - created_at: 创建时间
   * - updated_at: 更新时间
   *
   * @param {QueryRunner} queryRunner - 查询运行器
   * @returns {Promise<void>}
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'domain',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 创建域名索引
    await queryRunner.createIndex(
      'tenants',
      new TableIndex({
        name: 'IDX_tenants_domain',
        columnNames: ['domain'],
      }),
    );
  }

  /**
   * 回滚迁移（向下）
   *
   * 删除 tenants 表。
   *
   * @param {QueryRunner} queryRunner - 查询运行器
   * @returns {Promise<void>}
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants');
  }
}
