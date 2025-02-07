import { RoleModel } from "./role-model";

export class UserModel {
    id: number = 0;
    name: string = '';
    lastName: string = '';
    username: string = '';
    email: string = '';
    phoneNumber: string = '';
    password: string = '';
    roles: RoleModel[] = [];
    createdAt: string = '';
    updatedAt: string = '';
}