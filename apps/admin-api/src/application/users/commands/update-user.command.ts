import { ICommand } from '@nestjs/cqrs';
import { UserRole } from '../../../domain/users/entities/user.aggregate';

export class UpdateUserCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly fullName?: string,
    public readonly role?: UserRole,
    public readonly isActive?: boolean,
  ) {}
}
