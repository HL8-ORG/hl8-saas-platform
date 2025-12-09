import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import { GetMeOutputDto } from '../../dtos/get-me.output.dto';
import { GetMeQuery } from '../get-me.query';

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetMeQuery): Promise<GetMeOutputDto> {
    const { userId } = query;
    // TODO: 临时修复
    const tenantIdStr = (query as any).tenantId || 'default';
    const tenantIdVo = new TenantId(tenantIdStr);
    const userIdVo = new UserId(userId);

    const user = await this.userRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const dto = new GetMeOutputDto();
    dto.id = user.id.toString();
    dto.email = user.email.value;
    dto.fullName = user.fullName;
    dto.role = user.role;
    return dto;
  }
}
