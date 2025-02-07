import { PermissionModel } from "./permission-model";

export class RoleModel {
    id: number = 0;
    name: string = '';
    description: string = '';
    permissions: PermissionModel[] = [];
    createdAt: string = '';
    updatedAt: string = '';
}