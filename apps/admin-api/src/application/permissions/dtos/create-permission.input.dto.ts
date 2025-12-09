export class CreatePermissionInputDto {
  tenantId: string;
  resource: string;
  action: string;
  description?: string;
}

export class CreatePermissionOutputDto {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    Object.assign(this, data);
  }
}
