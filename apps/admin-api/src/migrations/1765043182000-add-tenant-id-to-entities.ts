import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

/**
 * 为实体添加 tenant_id 字段迁移
 *
 * 为以下表添加 tenant_id 字段：
 * - users: 添加 tenant_id (UUID, 索引, 外键)
 * - roles: 添加 tenant_id (UUID, 索引, 外键)，移除 name 的 unique 约束，添加 (tenant_id, name) 复合唯一约束
 * - permissions: 修改 tenant_id 为 UUID 类型，添加 (tenant_id, resource, action) 复合唯一约束
 * - refresh_tokens: 添加 tenant_id (UUID, 索引)
 *
 * @class AddTenantIdToEntities1765043182000
 * @implements {MigrationInterface}
 */
export class AddTenantIdToEntities1765043182000 implements MigrationInterface {
  /**
   * 执行迁移（向上）
   *
   * @param {QueryRunner} queryRunner - 查询运行器
   * @returns {Promise<void>}
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 为 users 表添加 tenant_id（先设为可空，以便处理现有数据）
    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true, // 先设为可空，处理现有数据后再设为非空
        }),
      );

      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          name: 'FK_users_tenant_id',
        }),
      );

      // 注意：现有数据的 tenant_id 需要手动更新
      // 建议在迁移后通过脚本为现有用户分配租户
    }

    // 2. 为 roles 表添加 tenant_id
    const rolesTable = await queryRunner.getTable('roles');
    if (rolesTable) {
      // 首先移除 name 的 unique 约束
      const nameUniqueConstraint = rolesTable.indices.find(
        (index) => index.columnNames.includes('name') && index.isUnique,
      );
      if (nameUniqueConstraint) {
        await queryRunner.dropIndex('roles', nameUniqueConstraint);
      }

      await queryRunner.addColumn(
        'roles',
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true, // 先设为可空，处理现有数据后再设为非空
        }),
      );

      await queryRunner.createIndex(
        'roles',
        new TableIndex({
          name: 'IDX_roles_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'roles',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          name: 'FK_roles_tenant_id',
        }),
      );

      // 添加 (tenant_id, name) 复合唯一约束
      await queryRunner.createUniqueConstraint(
        'roles',
        new TableUnique({
          name: 'UQ_roles_tenant_id_name',
          columnNames: ['tenant_id', 'name'],
        }),
      );
    }

    // 3. 为 permissions 表修改 tenant_id
    const permissionsTable = await queryRunner.getTable('permissions');
    if (permissionsTable) {
      // 首先检查 tenant_id 列是否存在
      const existingTenantIdColumn =
        permissionsTable.findColumnByName('tenant_id');

      if (existingTenantIdColumn) {
        // 如果存在，先删除旧的约束和列
        const tenantIdIndex = permissionsTable?.indices.find((index) =>
          index.columnNames.includes('tenant_id'),
        );
        if (tenantIdIndex) {
          await queryRunner.dropIndex('permissions', tenantIdIndex);
        }

        // 删除旧的 unique 约束（如果存在）
        const oldUniqueConstraint = permissionsTable?.uniques.find(
          (unique) =>
            unique.columnNames.includes('resource') &&
            unique.columnNames.includes('action') &&
            !unique.columnNames.includes('tenant_id'),
        );
        if (oldUniqueConstraint) {
          await queryRunner.dropUniqueConstraint(
            'permissions',
            oldUniqueConstraint,
          );
        }

        await queryRunner.dropColumn('permissions', 'tenant_id');
      }

      // 添加新的 tenant_id 列（UUID 类型）
      await queryRunner.addColumn(
        'permissions',
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true, // 先设为可空，处理现有数据后再设为非空
        }),
      );

      await queryRunner.createIndex(
        'permissions',
        new TableIndex({
          name: 'IDX_permissions_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'permissions',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          name: 'FK_permissions_tenant_id',
        }),
      );

      // 添加 (tenant_id, resource, action) 复合唯一约束
      await queryRunner.createUniqueConstraint(
        'permissions',
        new TableUnique({
          name: 'UQ_permissions_tenant_id_resource_action',
          columnNames: ['tenant_id', 'resource', 'action'],
        }),
      );
    }

    // 4. 为 refresh_tokens 表添加 tenant_id
    const refreshTokensTable = await queryRunner.getTable('refresh_tokens');
    if (refreshTokensTable) {
      await queryRunner.addColumn(
        'refresh_tokens',
        new TableColumn({
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true, // 先设为可空，处理现有数据后再设为非空
        }),
      );

      await queryRunner.createIndex(
        'refresh_tokens',
        new TableIndex({
          name: 'IDX_refresh_tokens_tenant_id',
          columnNames: ['tenant_id'],
        }),
      );
    }
  }

  /**
   * 回滚迁移（向下）
   *
   * @param {QueryRunner} queryRunner - 查询运行器
   * @returns {Promise<void>}
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 4. 回滚 refresh_tokens
    const refreshTokensTable = await queryRunner.getTable('refresh_tokens');
    if (refreshTokensTable) {
      await queryRunner.dropIndex(
        'refresh_tokens',
        'IDX_refresh_tokens_tenant_id',
      );
      await queryRunner.dropColumn('refresh_tokens', 'tenant_id');
    }

    // 3. 回滚 permissions
    const permissionsTable = await queryRunner.getTable('permissions');
    if (permissionsTable) {
      await queryRunner.dropForeignKey(
        'permissions',
        'FK_permissions_tenant_id',
      );
      await queryRunner.dropIndex('permissions', 'IDX_permissions_tenant_id');
      await queryRunner.dropUniqueConstraint(
        'permissions',
        'UQ_permissions_tenant_id_resource_action',
      );
      await queryRunner.dropColumn('permissions', 'tenant_id');
      // 恢复旧的 unique 约束
      await queryRunner.createUniqueConstraint(
        'permissions',
        new TableUnique({
          name: 'UQ_permissions_resource_action',
          columnNames: ['resource', 'action'],
        }),
      );
    }

    // 2. 回滚 roles
    const rolesTable = await queryRunner.getTable('roles');
    if (rolesTable) {
      await queryRunner.dropUniqueConstraint(
        'roles',
        'UQ_roles_tenant_id_name',
      );
      await queryRunner.dropForeignKey('roles', 'FK_roles_tenant_id');
      await queryRunner.dropIndex('roles', 'IDX_roles_tenant_id');
      await queryRunner.dropColumn('roles', 'tenant_id');
      // 恢复 name 的 unique 约束
      await queryRunner.createUniqueConstraint(
        'roles',
        new TableUnique({
          name: 'UQ_roles_name',
          columnNames: ['name'],
        }),
      );
    }

    // 1. 回滚 users
    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      await queryRunner.dropForeignKey('users', 'FK_users_tenant_id');
      await queryRunner.dropIndex('users', 'IDX_users_tenant_id');
      await queryRunner.dropColumn('users', 'tenant_id');
    }
  }
}
