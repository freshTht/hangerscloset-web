export interface Customer {
  id: string;
  name: string;
  phone: string;
  lineId?: string | null;
  note?: string | null;
  createdAt: string;
}
