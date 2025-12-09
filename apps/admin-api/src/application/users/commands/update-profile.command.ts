import { ICommand } from '@nestjs/cqrs';

export class UpdateProfileCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly fullName: string,
  ) {}
}
