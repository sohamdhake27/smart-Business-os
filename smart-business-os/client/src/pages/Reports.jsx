import React, { useState } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/formatters';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState({ pdf: false, excel: false });
  const [config, setConfig] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all'
  });

  const fetchData = async () => {
    const params = new URLSearchParams({ startDate: config.startDate, endDate: config.endDate, limit: 1000, ...(config.type !== 'all' && { type: config.type }) });
    const { data } = await api.get(`/transactions?${params}`);
    return data.data;
  };

  const exportPDF = async () => {
    setLoading(p => ({ ...p, pdf: true }));
    try {
      const transactions = await fetchData();
      const doc = new jsPDF();
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 220, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('Smart Business OS', 14, 16);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(`Report — ${user?.businessName}`, 14, 26);
      doc.setFontSize(9);
      doc.text(`Period: ${config.startDate} to ${config.endDate}`, 14, 34);

      const sales = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 14, 55);
      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
          ['Total Sales', `₹${sales.toLocaleString('en-IN')}`],
          ['Total Expenses', `₹${expenses.toLocaleString('en-IN')}`],
          ['Net Profit', `₹${(sales - expenses).toLocaleString('en-IN')}`],
          ['Profit Margin', `${sales > 0 ? ((sales - expenses) / sales * 100).toFixed(1) : 0}%`],
          ['Total Transactions', `${transactions.length}`]
        ],
        headStyles: { fillColor: [99, 102, 241] }
      });
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Transaction Details', 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Title', 'Category', 'Type', 'Amount']],
        body: transactions.map(t => [formatDate(t.date), t.title, t.category.replace(/_/g,' '), t.type, `${t.type === 'sale' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`]),
        headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 8 }
      });
      doc.save(`smart-business-report-${config.startDate}.pdf`);
      toast.success('PDF downloaded! 📄');
    } finally { setLoading(p => ({ ...p, pdf: false })); }
  };

  const exportExcel = async () => {
    setLoading(p => ({ ...p, excel: true }));
    try {
      const transactions = await fetchData();
      const wb = XLSX.utils.book_new();
      const sales = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const summaryWS = XLSX.utils.aoa_to_sheet([
        ['Smart Business OS — Report'], [`Business: ${user?.businessName}`], [`Period: ${config.startDate} to ${config.endDate}`], [],
        ['Total Sales', sales], ['Total Expenses', expenses], ['Net Profit', sales - expenses], ['Profit Margin %', sales > 0 ? ((sales - expenses) / sales * 100).toFixed(1) : 0]
      ]);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      const txWS = XLSX.utils.aoa_to_sheet([
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment'],
        ...transactions.map(t => [formatDate(t.date), t.title, t.type, t.category.replace(/_/g,' '), t.type === 'sale' ? t.amount : -t.amount, t.paymentMethod])
      ]);
      XLSX.utils.book_append_sheet(wb, txWS, 'Transactions');
      XLSX.writeFile(wb, `smart-business-report-${config.startDate}.xlsx`);
      toast.success('Excel downloaded! 📊');
    } finally { setLoading(p => ({ ...p, excel: false })); }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Export</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Download your business data as PDF or Excel</p></div>
      <div className="card p-6 max-w-2xl">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Report Configuration</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start Date</label><input type="date" className="input-field" value={config.startDate} onChange={e => setConfig(p => ({ ...p, startDate: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>End Date</label><input type="date" className="input-field" value={config.endDate} onChange={e => setConfig(p => ({ ...p, endDate: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select className="input-field" value={config.type} onChange={e => setConfig(p => ({ ...p, type: e.target.value }))}>
              <option value="all">All</option><option value="sale">Sales</option><option value="expense">Expenses</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportPDF} disabled={loading.pdf} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
            {loading.pdf ? <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <FileText size={24} style={{ color: '#ef4444' }} />}
            <div className="text-left"><p className="font-bold text-sm" style={{ color: '#ef4444' }}>Download PDF</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Formatted report</p></div>
          </button>
          <button onClick={exportExcel} disabled={loading.excel} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ borderColor: '#10b981', background: 'rgba(16,185,129,0.05)' }}>
            {loading.excel ? <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" /> : <FileSpreadsheet size={24} style={{ color: '#10b981' }} />}
            <div className="text-left"><p className="font-bold text-sm" style={{ color: '#10b981' }}>Download Excel</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Spreadsheet data</p></div>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Reports;
