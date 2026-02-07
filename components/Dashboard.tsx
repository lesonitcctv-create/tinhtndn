import React from 'react';
import { FinancialSummary } from '../types';
import { formatCurrency } from '../utils/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Scale } from 'lucide-react';

interface DashboardProps {
  summary: FinancialSummary;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

const SummaryCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend?: string;
  colorClass: string; 
}> = ({ title, value, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
    </div>
    <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-').replace('700', '100').replace('600', '100')}`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ summary }) => {
  
  const barData = [
    { name: 'Tổng quan', DoanhThu: summary.totalRevenue, ChiPhi: summary.totalCost, LoiNhuan: summary.grossProfit }
  ];

  const taxData = [
    { name: 'VAT Phải Nộp', value: Math.max(0, summary.vatPayable) },
    { name: 'Thuế TNDN', value: Math.max(0, summary.citPayable) },
    { name: 'Lợi Nhuận Ròng', value: Math.max(0, summary.netProfit) }
  ];

  // Filter out zero values for pie chart to look better
  const activeTaxData = taxData.filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Tổng Doanh Thu" 
          value={formatCurrency(summary.totalRevenue)} 
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          colorClass="text-blue-600"
        />
        <SummaryCard 
          title="Tổng Chi Phí" 
          value={formatCurrency(summary.totalCost)} 
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
          colorClass="text-rose-600"
        />
        <SummaryCard 
          title="Lợi Nhuận Gộp" 
          value={formatCurrency(summary.grossProfit)} 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          colorClass={summary.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
        <SummaryCard 
          title="Lợi Nhuận Ròng (Sau thuế)" 
          value={formatCurrency(summary.netProfit)} 
          icon={<Wallet className="w-6 h-6 text-purple-600" />}
          colorClass={summary.netProfit >= 0 ? "text-purple-600" : "text-rose-600"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Cost Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Biểu đồ Tài chính</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="DoanhThu" name="Doanh Thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ChiPhi" name="Chi Phí" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="LoiNhuan" name="Lợi Nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Phân bổ Sau Lợi Nhuận</h3>
          <div className="h-72 w-full flex flex-col items-center justify-center">
            {activeTaxData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeTaxData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activeTaxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm text-center">Chưa có dữ liệu lợi nhuận dương</div>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm border-t pt-4 border-slate-100">
             <div className="flex justify-between">
                <span className="text-slate-600">VAT Phải Nộp:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(summary.vatPayable)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-slate-600">Thuế TNDN (20%):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(summary.citPayable)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;