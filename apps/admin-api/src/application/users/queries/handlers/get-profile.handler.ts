import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import type { ITenantResolver } from '../../../shared/interfaces/tenant-resolver.interface';
import { GetProfileOutputDto } from '../../dtos/get-profile.output.dto';
import { GetProfileQuery } from '../get-profile.query';

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  async execute(query: GetProfileQuery): Promise<GetProfileOutputDto> {
    const { userId } = query;
    const tenantId = this.tenantResolver.getCurrentTenantId();

    const userIdVo = new UserId(userId);
    const tenantIdVo = new TenantId(tenantId);

    const user = await this.userReadRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return new GetProfileOutputDto({
      id: user.id.toString(),
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
