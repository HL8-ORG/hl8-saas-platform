import { ICommand } from '@nestjs/cqrs';

export class VerifyEmailCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly code: string,
  ) {}
}
