import { Invoice, TransactionType, FinancialSummary } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const calculateSummary = (invoices: Invoice[]): FinancialSummary => {
  let totalRevenue = 0;
  let totalCost = 0;
  let vatInput = 0;
  let vatOutput = 0;

  invoices.forEach(inv => {
    const taxAmount = inv.amount * (inv.taxRate / 100);
    
    if (inv.type === TransactionType.OUTPUT) {
      totalRevenue += inv.amount;
      vatOutput += taxAmount;
    } else {
      totalCost += inv.amount;
      vatInput += taxAmount;
    }
  });

  const grossProfit = totalRevenue - totalCost;
  
  // Thuế GTGT phải nộp = VAT đầu ra - VAT đầu vào
  // Nếu âm thì được khấu trừ chuyển kỳ sau (ở đây hiển thị 0 hoặc số âm để biết)
  const vatPayable = vatOutput - vatInput;

  // Thuế Thu nhập doanh nghiệp (TNDN) - Giả sử mức phổ thông 20% trên lợi nhuận chịu thuế
  // Chỉ tính khi có lợi nhuận dương
  const citRate = 20; 
  const citPayable = grossProfit > 0 ? grossProfit * (citRate / 100) : 0;

  const netProfit = grossProfit - (vatPayable > 0 ? 0 : 0) - citPayable; 
  // Note: VAT thường không tính vào chi phí để trừ lợi nhuận ròng trực tiếp theo cách này trong kế toán chuẩn 
  // (nó là khoản thu hộ/trả hộ), nhưng ở đây ta tính dòng tiền thực tế còn lại cho chủ doanh nghiệp 
  // sau khi đã hoàn thành nghĩa vụ thuế cơ bản (giả định đơn giản hóa).
  // Công thức chuẩn hơn cho Net Profit: Lợi nhuận trước thuế - Thuế TNDN.

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    vatInput,
    vatOutput,
    vatPayable,
    citPayable,
    netProfit: grossProfit - citPayable // Lợi nhuận sau khi đóng thuế TNDN
  };
};