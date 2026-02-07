import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, TransactionType, FinancialSummary } from './types';
import { calculateSummary } from './utils/calculations';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import AIAnalyst from './components/AIAnalyst';
import { LayoutDashboard, FileText, PieChart, Menu, X } from 'lucide-react';

// Mock Data for initial view
const MOCK_INVOICES: Invoice[] = [
  { 
    id: '1', 
    date: '2023-10-01', 
    customerName: 'Công ty ABC', 
    description: 'Bán phần mềm quản lý',
    items: [
      { id: 'i1', name: 'License Phần mềm Pro', unit: 'Năm', quantity: 2, price: 25000000, total: 50000000 }
    ],
    amount: 50000000, 
    taxRate: 10, 
    type: TransactionType.OUTPUT, 
    category: 'Bán hàng hóa' 
  },
  { 
    id: '2', 
    date: '2023-10-05', 
    customerName: 'Nhà cung cấp XYZ', 
    description: 'Mua server',
    items: [
      { id: 'i2', name: 'Máy chủ Dell PowerEdge', unit: 'Cái', quantity: 1, price: 15000000, total: 15000000 }
    ], 
    amount: 15000000, 
    taxRate: 10, 
    type: TransactionType.INPUT, 
    category: 'Nhập nguyên liệu' 
  },
  { 
    id: '3', 
    date: '2023-10-10', 
    customerName: 'Khách lẻ Nguyễn Văn A', 
    description: 'Phí bảo trì',
    items: [
       { id: 'i3', name: 'Dịch vụ bảo trì tháng 10', unit: 'Gói', quantity: 1, price: 5000000, total: 5000000 }
    ],
    amount: 5000000, 
    taxRate: 8, 
    type: TransactionType.OUTPUT, 
    category: 'Cung cấp dịch vụ' 
  },
  { 
    id: '4', 
    date: '2023-10-12', 
    customerName: 'Văn phòng phẩm Minh Châu', 
    description: 'Giấy in, mực in',
    items: [
       { id: 'i4a', name: 'Giấy A4 Double A', unit: 'Ram', quantity: 20, price: 50000, total: 1000000 },
       { id: 'i4b', name: 'Mực in Canon 2900', unit: 'Hộp', quantity: 2, price: 500000, total: 1000000 }
    ],
    amount: 2000000, 
    taxRate: 10, 
    type: TransactionType.INPUT, 
    category: 'Văn phòng phẩm' 
  },
  { 
    id: '5', 
    date: '2023-10-15', 
    customerName: 'Công ty Global Tech', 
    description: 'Dự án outsource tháng 10', 
    items: [
        { id: 'i5', name: 'Phát triển module React', unit: 'Giờ', quantity: 200, price: 600000, total: 120000000 }
    ],
    amount: 120000000, 
    taxRate: 0, 
    type: TransactionType.OUTPUT, 
    category: 'Cung cấp dịch vụ' 
  },
];

enum Tab {
  DASHBOARD = 'dashboard',
  INVOICES = 'invoices',
  AI_REPORT = 'ai_report'
}

interface NavItemProps {
  tab: Tab;
  label: string;
  icon: any;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ tab, label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium mb-1
      ${isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Recalculate summary whenever invoices change
  const summary: FinancialSummary = useMemo(() => calculateSummary(invoices), [invoices]);

  const handleAddInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const handleNavClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <PieChart className="text-blue-500" />
            BizFinance<span className="text-blue-500">Pro</span>
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <NavItem 
            tab={Tab.DASHBOARD} 
            label="Tổng Quan" 
            icon={LayoutDashboard} 
            isActive={activeTab === Tab.DASHBOARD}
            onClick={() => handleNavClick(Tab.DASHBOARD)}
          />
          <NavItem 
            tab={Tab.INVOICES} 
            label="Quản Lý Hóa Đơn" 
            icon={FileText} 
            isActive={activeTab === Tab.INVOICES}
            onClick={() => handleNavClick(Tab.INVOICES)}
          />
          <NavItem 
            tab={Tab.AI_REPORT} 
            label="Phân Tích AI" 
            icon={PieChart} 
            isActive={activeTab === Tab.AI_REPORT}
            onClick={() => handleNavClick(Tab.AI_REPORT)}
          />
        </nav>
        <div className="p-4 text-xs text-slate-500 border-t border-slate-800">
            <p>&copy; 2024 BizFinance App</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-20 flex items-center justify-between p-4 shadow-md">
         <h1 className="text-lg font-bold flex items-center gap-2">
            <PieChart className="text-blue-500 w-5 h-5" />
            BizFinance
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-10 pt-16 px-4 pb-4 md:hidden">
            <nav className="space-y-2">
                <NavItem 
                  tab={Tab.DASHBOARD} 
                  label="Tổng Quan" 
                  icon={LayoutDashboard} 
                  isActive={activeTab === Tab.DASHBOARD}
                  onClick={() => handleNavClick(Tab.DASHBOARD)}
                />
                <NavItem 
                  tab={Tab.INVOICES} 
                  label="Quản Lý Hóa Đơn" 
                  icon={FileText} 
                  isActive={activeTab === Tab.INVOICES}
                  onClick={() => handleNavClick(Tab.INVOICES)}
                />
                <NavItem 
                  tab={Tab.AI_REPORT} 
                  label="Phân Tích AI" 
                  icon={PieChart} 
                  isActive={activeTab === Tab.AI_REPORT}
                  onClick={() => handleNavClick(Tab.AI_REPORT)}
                />
            </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-8 pt-20 md:pt-8 md:ml-64 transition-all duration-300`}>
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    {activeTab === Tab.DASHBOARD && 'Bảng Điều Khiển'}
                    {activeTab === Tab.INVOICES && 'Sổ Sách Kế Toán'}
                    {activeTab === Tab.AI_REPORT && 'Trợ Lý Tài Chính'}
                </h2>
                <p className="text-slate-500 mt-1">Quản lý dòng tiền và tính toán lợi nhuận hiệu quả.</p>
            </div>
        </header>

        <div className="animate-fade-in">
            {activeTab === Tab.DASHBOARD && (
                <Dashboard summary={summary} />
            )}

            {activeTab === Tab.INVOICES && (
                <TransactionManager 
                    invoices={invoices} 
                    onAdd={handleAddInvoice} 
                    onDelete={handleDeleteInvoice} 
                />
            )}

            {activeTab === Tab.AI_REPORT && (
                <AIAnalyst invoices={invoices} summary={summary} />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;