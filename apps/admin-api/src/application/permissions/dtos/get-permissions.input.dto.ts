export class GetPermissionsInputDto {
  tenantId: string;
}

export class GetPermissionsOutputDto {
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
