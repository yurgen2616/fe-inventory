import { CategoryModel } from "./category-model";
import { DistributorModel } from "./distributor-models";
import { SalesFormModel } from "./salesForm-model";
import { StockModel } from "./stock-model";


export class ProductModel {
    id: number = 0;
    barcode: string = '';
    name: string = '';
    purchasePrice: number = 0;
    salePrice: number = 0;
    wholesalePrice: number = 0;
    stock: number = 0;
    minimumStock: number = 0;
    location: string = '';
    category: CategoryModel = new CategoryModel();
    distributor: DistributorModel = new DistributorModel();
    salesForm: SalesFormModel = new SalesFormModel();
    stocks: StockModel[] = [];
    createdAt: string = '';
    updatedAt: string = '';
    expirationDate: string = '';
  }
  export class Stocks {
    id: number = 0;
    quantity: number = 0;
    unitPrice: number = 0;
    unitSalePrice: number = 0;
    expirationDate: string = '';
    createdAt: string = '';
  }