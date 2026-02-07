import React, { useState, useMemo, useRef } from 'react';
import { Invoice, InvoiceItem, TransactionType, CATEGORIES } from '../types';
import { formatCurrency } from '../utils/calculations';
import { parseInvoiceFromText, parseInvoiceFromImage } from '../services/geminiService';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Search, ShoppingCart, Sparkles, Loader2, X, Image as ImageIcon, Upload, Eye } from 'lucide-react';

interface TransactionManagerProps {
  invoices: Invoice[];
  onAdd: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({ invoices, onAdd, onDelete }) => {
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.OUTPUT);
  
  // Invoice General Info
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [taxRate, setTaxRate] = useState(10);

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // Current Line Item Form
  const [currentItem, setCurrentItem] = useState({
    name: '',
    unit: 'Cái',
    quantity: 1,
    price: 0
  });

  const [searchTerm, setSearchTerm] = useState('');

  // AI Analysis State
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Detail State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Derived Calculations
  const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const vatAmount = subTotal * (taxRate / 100);
  const totalDue = subTotal + vatAmount;

  const handleAddItem = () => {
    if (!currentItem.name || currentItem.price < 0 || currentItem.quantity <= 0) return;

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: currentItem.name,
      unit: currentItem.unit,
      quantity: currentItem.quantity,
      price: currentItem.price,
      total: currentItem.quantity * currentItem.price
    };

    setItems([...items, newItem]);
    setCurrentItem({ name: '', unit: 'Cái', quantity: 1, price: 0 }); // Reset item form
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || items.length === 0) return;

    // Auto-generate description based on first few items
    const description = items.map(i => i.name).join(', ').substring(0, 50) + (items.length > 1 ? '...' : '');

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      type: activeTab,
      customerName,
      description,
      items,
      amount: subTotal,
      taxRate: Number(taxRate),
      category: category,
      date: date
    };

    onAdd(newInvoice);
    
    // Reset Form
    setCustomerName('');
    setItems([]);
    setTaxRate(10);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const populateForm = (result: any) => {
    if (result) {
        if (result.type) setActiveTab(result.type as TransactionType);
        if (result.customerName) setCustomerName(result.customerName);
        if (result.date) setDate(result.date);
        if (result.taxRate !== undefined) setTaxRate(result.taxRate);
        if (result.category) setCategory(result.category);
        
        if (result.items && Array.isArray(result.items)) {
            const newItems = result.items.map((i: any) => ({
                id: Date.now().toString() + Math.random(),
                name: i.name || 'Sản phẩm',
                unit: i.unit || 'Cái',
                quantity: Number(i.quantity) || 1,
                price: Number(i.price) || 0,
                total: (Number(i.quantity) || 1) * (Number(i.price) || 0)
            }));
            setItems(newItems);
        }
        setShowAiInput(false);
        setAiText('');
    } else {
        alert('Không thể trích xuất thông tin. Vui lòng thử lại.');
    }
  };

  const handleAIParseText = async () => {
    if (!aiText.trim()) return;
    setIsAnalyzing(true);
    try {
        const result = await parseInvoiceFromText(aiText);
        populateForm(result);
    } catch (error) {
        console.error(error);
        alert('Có lỗi xảy ra khi phân tích văn bản.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to ~10MB to avoid browser freeze on large conversions
    if (file.size > 10 * 1024 * 1024) {
        alert("File quá lớn. Vui lòng chọn file dưới 10MB");
        return;
    }

    setIsAnalyzing(true);
    setShowAiInput(true); // Ensure the AI panel is open to show loading

    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            // Remove data:image/...;base64, prefix
            const base64Data = base64String.split(',')[1];
            const mimeType = file.type;

            const result = await parseInvoiceFromImage(base64Data, mimeType);
            populateForm(result);
            
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsAnalyzing(false);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("File parsing error", error);
        alert("Không thể đọc file. Vui lòng thử lại.");
        setIsAnalyzing(false);
    }
  };

  const filteredInvoices = invoices
    .filter(inv => inv.type === activeTab)
    .filter(inv => 
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full relative">
      {/* Form Section (Wider now) */}
      <div className="xl:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
        
        {/* AI Input Section */}
        <div className="mb-6">
            {!showAiInput ? (
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setShowAiInput(true)}
                        className="py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        Nhập bằng Văn Bản
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
                        <Upload className="w-4 h-4" />
                        Tải Ảnh/PDF Hóa Đơn
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="image/*,application/pdf"
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-fade-in relative">
                    <button 
                        onClick={() => !isAnalyzing && setShowAiInput(false)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={16} />
                    </button>
                    
                    {isAnalyzing ? (
                         <div className="flex flex-col items-center justify-center py-6 text-indigo-600">
                             <Loader2 className="animate-spin w-8 h-8 mb-2" />
                             <p className="text-sm font-medium">AI đang đọc hóa đơn...</p>
                         </div>
                    ) : (
                        <>
                            <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                <Sparkles size={16} />
                                Nhập nội dung hóa đơn
                            </h4>
                            <textarea 
                                className="w-full p-3 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                rows={3}
                                placeholder="Ví dụ: Mua 10 cái ghế văn phòng từ Hòa Phát, giá 1 triệu/cái, thuế 10% vào ngày hôm qua..."
                                value={aiText}
                                onChange={(e) => setAiText(e.target.value)}
                            ></textarea>
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={handleAIParseText}
                                    disabled={!aiText.trim()}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    Phân tích Text
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ImageIcon size={16} />
                                    Tải File Khác
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 pt-4 border-t border-slate-100">
          {activeTab === TransactionType.OUTPUT ? (
            <ArrowUpCircle className="text-blue-500" />
          ) : (
            <ArrowDownCircle className="text-rose-500" />
          )}
          {activeTab === TransactionType.OUTPUT ? 'Lập Hóa Đơn Bán Ra' : 'Nhập Hóa Đơn Mua Vào'}
        </h3>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
                onClick={() => setActiveTab(TransactionType.OUTPUT)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === TransactionType.OUTPUT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Doanh Thu (Bán Ra)
            </button>
            <button 
                onClick={() => setActiveTab(TransactionType.INPUT)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === TransactionType.INPUT ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Chi Phí (Mua Vào)
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày chứng từ</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">
                 {activeTab === TransactionType.OUTPUT ? 'Khách hàng' : 'Nhà cung cấp'}
               </label>
               <input 
                 type="text" 
                 required
                 placeholder="Tên đối tác..."
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={customerName}
                 onChange={e => setCustomerName(e.target.value)}
               />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Danh mục</label>
                <select 
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   value={category}
                   onChange={e => setCategory(e.target.value)}
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Thuế suất VAT (%)</label>
                <select 
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   value={taxRate}
                   onChange={e => setTaxRate(parseFloat(e.target.value))}
                >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="8">8%</option>
                    <option value="10">10%</option>
                </select>
             </div>
          </div>

          {/* Item Entry Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
               <ShoppingCart size={16} /> Chi tiết hàng hóa
            </h4>
            <div className="space-y-3">
               <div>
                  <input 
                    type="text"
                    placeholder="Tên hàng hóa/dịch vụ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-2"
                    value={currentItem.name}
                    onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                  />
               </div>
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="ĐVT"
                    className="w-16 px-2 py-2 border border-slate-300 rounded-md text-sm"
                    value={currentItem.unit}
                    onChange={e => setCurrentItem({...currentItem, unit: e.target.value})}
                  />
                  <input 
                    type="number" 
                    min="1"
                    placeholder="SL"
                    className="w-20 px-2 py-2 border border-slate-300 rounded-md text-sm"
                    value={currentItem.quantity}
                    onChange={e => setCurrentItem({...currentItem, quantity: parseFloat(e.target.value)})}
                  />
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Đơn giá"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    value={currentItem.price || ''}
                    onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value)})}
                  />
               </div>
               <button 
                 type="button"
                 onClick={handleAddItem}
                 className="w-full py-2 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700 transition-colors"
               >
                 + Thêm dòng hàng
               </button>
            </div>
          </div>

          {/* Items List Preview */}
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
             {items.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">Chưa có hàng hóa nào</p>
             ) : (
                <table className="w-full text-xs">
                   <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                         <th className="p-2 text-left">Hàng hóa</th>
                         <th className="p-2 text-right">SL</th>
                         <th className="p-2 text-right">Đơn giá</th>
                         <th className="p-2 text-right">Thành tiền</th>
                         <th className="p-2"></th>
                      </tr>
                   </thead>
                   <tbody>
                      {items.map(item => (
                         <tr key={item.id} className="border-b border-slate-100">
                            <td className="p-2 truncate max-w-[120px]">{item.name}</td>
                            <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                            <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                            <td className="p-2 text-right">{formatCurrency(item.total)}</td>
                            <td className="p-2 text-center">
                               <button type="button" onClick={() => handleDeleteItem(item.id)} className="text-rose-500">
                                  <Trash2 size={12} />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>

          {/* Summary Box */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-1">
             <div className="flex justify-between text-sm text-slate-600">
                <span>Cộng tiền hàng:</span>
                <span>{formatCurrency(subTotal)}</span>
             </div>
             <div className="flex justify-between text-sm text-slate-600">
                <span>Tiền thuế GTGT ({taxRate}%):</span>
                <span>{formatCurrency(vatAmount)}</span>
             </div>
             <div className="flex justify-between font-bold text-base text-blue-800 pt-2 border-t border-blue-200 mt-2">
                <span>Tổng thanh toán:</span>
                <span>{formatCurrency(totalDue)}</span>
             </div>
             <div className="text-[10px] text-slate-400 text-right italic mt-1">
                (Công thức: Tổng tiền hàng + Tiền thuế)
             </div>
          </div>

          <button 
            type="submit" 
            disabled={items.length === 0}
            className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2
                ${items.length === 0 ? 'bg-slate-300 cursor-not-allowed' : (activeTab === TransactionType.OUTPUT ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700')}
            `}
          >
            <Plus size={18} />
            {items.length === 0 ? 'Vui lòng thêm hàng hóa' : 'Lưu Hóa Đơn'}
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="xl:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Danh Sách Hóa Đơn</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-auto flex-1">
            {filteredInvoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <p>Chưa có dữ liệu hóa đơn nào.</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="py-3 px-4">Ngày</th>
                            <th className="py-3 px-4">Đối tác</th>
                            <th className="py-3 px-4">Nội dung hàng hóa</th>
                            <th className="py-3 px-4 text-right">Tổng tiền hàng</th>
                            <th className="py-3 px-4 text-right">VAT</th>
                            <th className="py-3 px-4 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{inv.date}</td>
                                <td className="py-3 px-4 font-medium text-slate-800">{inv.customerName}</td>
                                <td className="py-3 px-4 text-slate-600">
                                    <div className="max-w-[150px] truncate" title={inv.items?.map(i => i.name).join(', ')}>
                                      {inv.items && inv.items.length > 0 
                                        ? `${inv.items[0].name} ${inv.items.length > 1 ? `(+${inv.items.length - 1})` : ''}` 
                                        : inv.description}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{inv.items?.length || 0} mục</div>
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${inv.type === TransactionType.OUTPUT ? 'text-blue-600' : 'text-rose-600'}`}>
                                    {formatCurrency(inv.amount)}
                                </td>
                                <td className="py-3 px-4 text-right text-slate-500">
                                    {formatCurrency(inv.amount * (inv.taxRate/100))}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => setSelectedInvoice(inv)}
                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(inv.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                            title="Xóa hóa đơn"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className={`p-5 border-b flex items-center justify-between ${selectedInvoice.type === TransactionType.OUTPUT ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'} rounded-t-xl`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${selectedInvoice.type === TransactionType.OUTPUT ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                {selectedInvoice.type === TransactionType.OUTPUT ? 'Hóa Đơn Bán Ra' : 'Hóa Đơn Mua Vào'}
                            </span>
                            <span className="text-slate-400 text-xs">#{selectedInvoice.id.slice(-6)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{selectedInvoice.customerName}</h3>
                    </div>
                    <button 
                        onClick={() => setSelectedInvoice(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Ngày lập</p>
                            <p className="text-sm font-medium text-slate-800">{selectedInvoice.date}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Danh mục</p>
                            <p className="text-sm font-medium text-slate-800">{selectedInvoice.category}</p>
                        </div>
                        <div className="col-span-2">
                             <p className="text-xs text-slate-500 mb-1">Diễn giải</p>
                             <p className="text-sm text-slate-800">{selectedInvoice.description}</p>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="py-2 px-3 text-left">Hàng hóa/Dịch vụ</th>
                                    <th className="py-2 px-3 text-right">SL</th>
                                    <th className="py-2 px-3 text-right">Đơn giá</th>
                                    <th className="py-2 px-3 text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedInvoice.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2 px-3">
                                            <p className="text-slate-800">{item.name}</p>
                                            <p className="text-[10px] text-slate-400">{item.unit}</p>
                                        </td>
                                        <td className="py-2 px-3 text-right align-top">{item.quantity}</td>
                                        <td className="py-2 px-3 text-right align-top">{formatCurrency(item.price)}</td>
                                        <td className="py-2 px-3 text-right font-medium align-top">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col items-end space-y-2 text-sm">
                        <div className="flex justify-between w-full max-w-xs text-slate-600">
                            <span>Tổng tiền hàng:</span>
                            <span>{formatCurrency(selectedInvoice.amount)}</span>
                        </div>
                         <div className="flex justify-between w-full max-w-xs text-slate-600">
                            <span>Thuế suất GTGT:</span>
                            <span>{selectedInvoice.taxRate}%</span>
                        </div>
                        <div className="flex justify-between w-full max-w-xs text-slate-600">
                            <span>Tiền thuế VAT:</span>
                            <span>{formatCurrency(selectedInvoice.amount * (selectedInvoice.taxRate / 100))}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-xs pt-3 mt-1 border-t border-slate-100 font-bold text-lg text-slate-800">
                            <span>Tổng thanh toán:</span>
                            <span>{formatCurrency(selectedInvoice.amount * (1 + selectedInvoice.taxRate / 100))}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 rounded-b-xl">
                    <button 
                        onClick={() => setSelectedInvoice(null)}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Đóng
                    </button>
                    <button 
                        onClick={() => {
                            onDelete(selectedInvoice.id);
                            setSelectedInvoice(null);
                        }}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 flex items-center gap-2"
                    >
                        <Trash2 size={16} /> Xóa Hóa Đơn
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;