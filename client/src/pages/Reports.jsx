import React, { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState({ pdf: false, excel: false });
  const [config, setConfig] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all'
  });

  const fetchData = async () => {
    const params = new URLSearchParams({
      startDate: config.startDate,
      endDate: config.endDate,
      limit: 1000,
      ...(config.type !== 'all' ? { type: config.type } : {})
    });
    const { data } = await api.get(`/transactions?${params}`);
    return data.data;
  };

  const buildSummary = (transactions) => {
    const sales = transactions.filter((item) => item.type === 'sale').reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const profit = sales - expenses;

    return {
      sales,
      expenses,
      profit,
      margin: sales > 0 ? ((profit / sales) * 100).toFixed(1) : 0
    };
  };

  const exportPDF = async () => {
    setLoading((prev) => ({ ...prev, pdf: true }));
    try {
      const transactions = await fetchData();
      const summary = buildSummary(transactions);
      const reportHtml = `
        <html>
          <head>
            <title>Smart Business OS Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
              h1, h2 { margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
              th { background: #e2e8f0; }
              .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
              .summary div { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            </style>
          </head>
          <body>
            <h1>Smart Business OS</h1>
            <p><strong>Business:</strong> ${user?.businessName || 'Business'}</p>
            <p><strong>Period:</strong> ${config.startDate} to ${config.endDate}</p>
            <div class="summary">
              <div><strong>Total Sales</strong><br />Rs ${summary.sales.toLocaleString('en-IN')}</div>
              <div><strong>Total Expenses</strong><br />Rs ${summary.expenses.toLocaleString('en-IN')}</div>
              <div><strong>Net Profit</strong><br />Rs ${summary.profit.toLocaleString('en-IN')}</div>
              <div><strong>Profit Margin</strong><br />${summary.margin}%</div>
            </div>
            <h2>Transactions</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map((item) => `
                  <tr>
                    <td>${formatDate(item.date)}</td>
                    <td>${item.title}</td>
                    <td>${item.category.replace(/_/g, ' ')}</td>
                    <td>${item.type}</td>
                    <td>Rs ${item.amount.toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      toast.success('Print view opened for PDF export');
    } finally {
      setLoading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const exportExcel = async () => {
    setLoading((prev) => ({ ...prev, excel: true }));
    try {
      const transactions = await fetchData();
      const rows = [
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method'],
        ...transactions.map((item) => [
          formatDate(item.date),
          item.title,
          item.type,
          item.category.replace(/_/g, ' '),
          item.type === 'sale' ? item.amount : -item.amount,
          item.paymentMethod || 'cash'
        ])
      ];

      const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
      const workbookHtml = `
        <html>
          <body>
            <table>${tableRows}</table>
          </body>
        </html>
      `;

      downloadBlob(workbookHtml, `smart-business-report-${config.startDate}.xls`, 'application/vnd.ms-excel');
      toast.success('Excel-compatible report downloaded');
    } finally {
      setLoading((prev) => ({ ...prev, excel: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Export</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate printable reports and Excel-compatible exports</p>
      </div>

      <div className="card p-6 max-w-2xl">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Report Configuration</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
            <input type="date" className="input-field" value={config.startDate} onChange={(event) => setConfig((prev) => ({ ...prev, startDate: event.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>End Date</label>
            <input type="date" className="input-field" value={config.endDate} onChange={(event) => setConfig((prev) => ({ ...prev, endDate: event.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select className="input-field" value={config.type} onChange={(event) => setConfig((prev) => ({ ...prev, type: event.target.value }))}>
              <option value="all">All</option>
              <option value="sale">Sales</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportPDF} disabled={loading.pdf} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>
            {loading.pdf ? <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <FileText size={24} style={{ color: '#ef4444' }} />}
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: '#ef4444' }}>Open PDF Print View</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Browser-native printable report</p>
            </div>
          </button>
          <button onClick={exportExcel} disabled={loading.excel} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md" style={{ borderColor: '#10b981', background: 'rgba(16,185,129,0.05)' }}>
            {loading.excel ? <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" /> : <FileSpreadsheet size={24} style={{ color: '#10b981' }} />}
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: '#10b981' }}>Download Excel</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Excel-compatible `.xls` export</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
