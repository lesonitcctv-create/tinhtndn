export enum TransactionType {
  INPUT = 'INPUT',   // Hóa đơn đầu vào (Chi phí)
  OUTPUT = 'OUTPUT'  // Hóa đơn đầu ra (Doanh thu)
}

export interface InvoiceItem {
  id: string;
  name: string;      // Tên hàng hóa, dịch vụ
  unit: string;      // Đơn vị tính (kg, cái, bộ...)
  quantity: number;  // Số lượng
  price: number;     // Đơn giá
  total: number;     // Thành tiền (quantity * price)
}

export interface Invoice {
  id: string;
  date: string;
  customerName: string; // Tên khách hàng hoặc nhà cung cấp
  description: string;  // Diễn giải chung (tự động tạo từ items nếu cần)
  items: InvoiceItem[]; // Danh sách hàng hóa
  amount: number;       // Tổng giá trị hàng hóa trước thuế (Tổng của items.total)
  taxRate: number;      // Thuế suất VAT (%)
  type: TransactionType;
  category: string;     
}

export interface FinancialSummary {
  totalRevenue: number;     // Tổng doanh thu (trước thuế)
  totalCost: number;        // Tổng chi phí (trước thuế)
  grossProfit: number;      // Lợi nhuận gộp
  vatInput: number;         // Tổng VAT đầu vào được khấu trừ
  vatOutput: number;        // Tổng VAT đầu ra phải thu
  vatPayable: number;       // Thuế GTGT phải nộp
  citPayable: number;       // Thuế TNDN tạm tính
  netProfit: number;        // Lợi nhuận sau thuế
}

export const CATEGORIES = [
  "Bán hàng hóa",
  "Cung cấp dịch vụ",
  "Nhập nguyên liệu",
  "Chi phí vận hành",
  "Marketing",
  "Lương nhân viên",
  "Khác"
];