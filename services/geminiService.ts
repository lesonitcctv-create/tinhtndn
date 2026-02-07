import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, FinancialSummary, TransactionType, CATEGORIES } from "../types";
import { formatCurrency } from "../utils/calculations";

export const generateFinancialAnalysis = async (
  invoices: Invoice[],
  summary: FinancialSummary
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Vui lòng cung cấp API Key để sử dụng tính năng phân tích AI.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare data context for AI with DETAILED ITEMS
  const recentTransactions = invoices.slice(0, 15).map(inv => {
    const itemDetails = inv.items?.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ');
    return `- ${inv.date} [${inv.type === TransactionType.OUTPUT ? 'BÁN' : 'MUA'}]: ${inv.customerName}. Chi tiết: ${itemDetails}. Trị giá: ${formatCurrency(inv.amount)} (Thuế ${inv.taxRate}%)`;
  }).join('\n');

  const prompt = `
    Bạn là một chuyên gia tư vấn tài chính doanh nghiệp cấp cao (CFO).
    Hãy phân tích dữ liệu tài chính chi tiết dưới đây của doanh nghiệp và đưa ra báo cáo ngắn gọn, súc tích bằng tiếng Việt.

    TỔNG QUAN TÀI CHÍNH:
    - Tổng doanh thu (Chưa VAT): ${formatCurrency(summary.totalRevenue)}
    - Tổng chi phí (Chưa VAT): ${formatCurrency(summary.totalCost)}
    - Lợi nhuận gộp: ${formatCurrency(summary.grossProfit)}
    - Thuế GTGT phải nộp (VAT đầu ra - đầu vào): ${formatCurrency(summary.vatPayable)}
    - Thuế TNDN phải nộp (ước tính 20%): ${formatCurrency(summary.citPayable)}
    - Lợi nhuận ròng thực tế: ${formatCurrency(summary.netProfit)}

    DANH SÁCH GIAO DỊCH CHI TIẾT (Hàng hóa/Dịch vụ):
    ${recentTransactions}

    YÊU CẦU PHÂN TÍCH:
    1. **Đánh giá hiệu quả kinh doanh**: Dựa trên các mặt hàng đã bán và mua, đánh giá xem doanh nghiệp đang kinh doanh mặt hàng nào hiệu quả nhất? Tỷ suất lợi nhuận có tốt không?
    2. **Phân tích chi phí**: Có khoản mục mua sắm nào bất thường hoặc chiếm tỷ trọng quá cao trong chi phí đầu vào không?
    3. **Tư vấn tối ưu**: Đưa ra 3 lời khuyên cụ thể để giảm thiểu tiền thuế phải đóng hợp pháp hoặc tăng biên lợi nhuận (ví dụ: cần đẩy mạnh bán mặt hàng nào, cắt giảm chi phí nào).
    
    Hãy trình bày chuyên nghiệp, sử dụng định dạng Markdown, in đậm các con số quan trọng.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Không thể tạo báo cáo vào lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
  }
};

const INVOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    customerName: { type: Type.STRING, description: "Tên đối tác (khách hàng hoặc nhà cung cấp)" },
    date: { type: Type.STRING, description: "Định dạng YYYY-MM-DD" },
    description: { type: Type.STRING, description: "Mô tả ngắn gọn hóa đơn" },
    taxRate: { type: Type.NUMBER, description: "Thuế suất VAT (0, 5, 8, 10...)" },
    type: { type: Type.STRING, enum: ["INPUT", "OUTPUT"] },
    category: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          unit: { type: Type.STRING, description: "Đơn vị tính (Cái, Bộ, Gói...)" },
          quantity: { type: Type.NUMBER },
          price: { type: Type.NUMBER, description: "Đơn giá trước thuế" },
        }
      }
    }
  }
};

export const parseInvoiceFromText = async (text: string): Promise<any> => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
    Bạn là trợ lý nhập liệu kế toán. Hãy trích xuất thông tin hóa đơn từ văn bản sau thành định dạng JSON.
    
    Thông tin ngữ cảnh:
    - Hôm nay là ngày: ${today} (Dùng để suy luận ngày nếu văn bản ghi "hôm nay", "hôm qua").
    - Danh mục hợp lệ: ${CATEGORIES.join(', ')}. Hãy chọn danh mục phù hợp nhất.
    
    Văn bản cần xử lý: "${text}"
    
    Yêu cầu logic:
    - Nếu nội dung là bán hàng, thu tiền -> type: "OUTPUT".
    - Nếu nội dung là mua hàng, chi tiền -> type: "INPUT".
    - TaxRate (VAT): Nếu không tìm thấy, mặc định là 0.
    - Items: Trích xuất chi tiết từng dòng hàng hóa, số lượng, đơn giá. Nếu chỉ có tổng tiền, hãy ước lượng hoặc để đơn giá = tổng tiền, số lượng = 1.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: INVOICE_SCHEMA
      }
    });

    const jsonText = response.text;
    return jsonText ? JSON.parse(jsonText) : null;
  } catch (error) {
    console.error("Gemini Parse Text Error:", error);
    return null;
  }
};

export const parseInvoiceFromImage = async (base64Data: string, mimeType: string): Promise<any> => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
    Hãy phân tích hình ảnh hóa đơn/chứng từ này và trích xuất thông tin thành JSON.
    
    Lưu ý:
    - Hôm nay là: ${today}.
    - Cố gắng đọc tên đơn vị bán/mua hàng.
    - Đọc chi tiết từng dòng hàng hóa (Tên, ĐVT, Số lượng, Đơn giá).
    - Xác định đây là hóa đơn đầu vào (Mua hàng/INPUT) hay đầu ra (Bán hàng/OUTPUT).
    - Chọn danh mục phù hợp nhất trong: ${CATEGORIES.join(', ')}.
    - Nếu không thấy thuế suất, mặc định 0.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: INVOICE_SCHEMA
      }
    });

    const jsonText = response.text;
    return jsonText ? JSON.parse(jsonText) : null;
  } catch (error) {
    console.error("Gemini Parse Image Error:", error);
    return null;
  }
};