import { ICommand } from '@nestjs/cqrs';

export class ResendVerificationCommand implements ICommand {
  constructor(public readonly userId: string) {}
}
