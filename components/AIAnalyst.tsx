import React, { useState } from 'react';
import { Invoice, FinancialSummary } from '../types';
import { generateFinancialAnalysis } from '../services/geminiService';
import { Bot, Sparkles, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalystProps {
  invoices: Invoice[];
  summary: FinancialSummary;
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ invoices, summary }) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateFinancialAnalysis(invoices, summary);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Chuyên Gia Tài Chính AI (Gemini)</h3>
            <p className="text-sm text-slate-500">Phân tích lợi nhuận, rủi ro thuế và đề xuất tối ưu.</p>
          </div>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={loading || invoices.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            loading || invoices.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? (
            <RefreshCcw className="animate-spin w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? 'Đang phân tích...' : 'Lập Báo Cáo'}
        </button>
      </div>

      <div className="p-6 min-h-[300px] bg-slate-50/50">
        {!report && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <Bot size={48} className="mb-4 opacity-20" />
            <p className="max-w-md">
              Nhấn nút "Lập Báo Cáo" để AI phân tích dữ liệu hóa đơn của bạn, tính toán các chỉ số an toàn tài chính và đưa ra lời khuyên.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            <div className="h-32 bg-slate-200 rounded w-full mt-6"></div>
          </div>
        )}

        {report && !loading && (
          <div className="prose prose-slate max-w-none">
            {/* We render markdown content from Gemini */}
            <ReactMarkdown
               components={{
                 h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-800 mb-4" {...props} />,
                 h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3 border-b pb-2" {...props} />,
                 h3: ({node, ...props}) => <h3 className="text-lg font-medium text-slate-800 mt-4 mb-2" {...props} />,
                 ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700" {...props} />,
                 li: ({node, ...props}) => <li className="marker:text-indigo-500" {...props} />,
                 p: ({node, ...props}) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />,
                 strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
               }}
            >
              {report}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalyst;