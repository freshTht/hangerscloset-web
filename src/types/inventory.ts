export type InventoryStatus = 'available' | 'reserved' | 'laundry';

export interface RentalPrices {
  oneDay: number;
  threeDays: number;
  fiveDays: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  brand: string;
  color: string;
  size: string;
  type?: string;
  tags?: string[];
  note?: string | null;
  accessories?: string | null;
  owner?: string | null;
  imageFile?: string;
  imageUrl: string;
  rentalPrices: RentalPrices;
  status: InventoryStatus;
}
