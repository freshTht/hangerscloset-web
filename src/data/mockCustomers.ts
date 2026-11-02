import type { Customer } from '../types/customer';

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'คุณพลอย รัตนากร',
    phone: '081-234-5678',
    lineId: '@ploy_r',
    note: 'ลูกค้าประจำ ชอบโทนสีพาสเทล ส่งแมสเซนเจอร์แถวทองหล่อ',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'cust-2',
    name: 'คุณมายด์ พิมพ์ชนก',
    phone: '089-999-1234',
    lineId: 'mind.pim',
    note: 'รับชุดเองที่หน้าร้าน',
    createdAt: '2026-01-15T11:30:00.000Z',
  },
  {
    id: 'cust-3',
    name: 'คุณแพรว สุภัสสรา',
    phone: '086-555-4321',
    lineId: 'praew_s',
    note: 'ส่ง EMS ต่างจังหวัด (เชียงใหม่)',
    createdAt: '2026-02-01T14:20:00.000Z',
  },
  {
    id: 'cust-4',
    name: 'คุณฟ้า ณัฐชา',
    phone: '092-888-7766',
    lineId: 'fah_natcha',
    note: null,
    createdAt: '2026-02-12T16:45:00.000Z',
  },
  {
    id: 'cust-5',
    name: 'คุณเนย วริศรา',
    phone: '095-111-2233',
    lineId: 'noey.w',
    note: 'เช่าไปถ่ายพรีเวดดิ้งริมทะเล',
    createdAt: '2026-03-01T10:15:00.000Z',
  },
];
