import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import { GetProfileOutputDto } from '../../dtos/get-profile.output.dto';
import { GetUsersOutputDto } from '../../dtos/get-users.output.dto';
import { GetUsersQuery } from '../get-users.query';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUsersQuery): Promise<GetUsersOutputDto> {
    const { tenantId, page, limit, isActive, search } = query;

    const result = await this.userReadRepository.findMany({
      tenantId,
      page,
      limit,
      isActive,
      search,
    });

    const data = result.data.map(
      (user) =>
        new GetProfileOutputDto({
          id: user.id.toString(),
          email: user.email.value,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
    );

    return new GetUsersOutputDto({
      data,
      meta: result.meta,
    });
  }
}
