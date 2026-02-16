export interface PurchaseLog {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shop: string;
  purchasedAt: Date;
}
