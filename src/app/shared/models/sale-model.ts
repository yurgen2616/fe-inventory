import { SaleDetailModel } from "./saleDetail-model";
import { UserModel } from "./user-model";

export class SaleModel {

    id: number = 0 ;
    total: number = 0;
    createdAt: string = '';
    details : SaleDetailModel[]= [];
    user: UserModel = new UserModel();
  }
  