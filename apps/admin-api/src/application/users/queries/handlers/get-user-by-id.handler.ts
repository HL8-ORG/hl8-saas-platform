import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import { GetUserByIdOutputDto } from '../../dtos/get-user-by-id.output.dto';
import { GetUserByIdQuery } from '../get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<GetUserByIdOutputDto> {
    const { userId, tenantId } = query;

    const userIdVo = new UserId(userId);
    const tenantIdVo = new TenantId(tenantId);

    const user = await this.userReadRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return new GetUserByIdOutputDto({
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
