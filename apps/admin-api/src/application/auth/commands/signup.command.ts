import { ICommand } from '@nestjs/cqrs';

export class SignupCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly tenantName: string,
  ) {}
}
