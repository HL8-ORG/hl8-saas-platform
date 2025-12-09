import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  resource: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}
