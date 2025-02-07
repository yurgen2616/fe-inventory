export class SaleDetailModel {
  product!: {
    id: number;
    name: string;
    purchasePrice: number;
  };
    quantity: number=0;
    price: number=0;
    purchasePriceAtSale: number=0;
    location: string='';
  }