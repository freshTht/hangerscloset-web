export type InventoryStatus = 'available' | 'reserved' | 'laundry';

export interface RentalPriceTier {
  durationDays: number;
  price: number;
}

export type RentalPrices = RentalPriceTier[];

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
