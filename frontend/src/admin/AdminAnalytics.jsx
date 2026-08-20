import React, { useState, useEffect } from 'react';
import { api } from '../shared/api';
import { FileDown, Calendar, TrendingUp, ShoppingBag, Hash, CreditCard, RotateCw } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await api.get(`/admin/analytics?${queryParams.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const handleExportPDF = () => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const downloadUrl = `${api.defaults.baseURL}/admin/analytics/export?${queryParams.toString()}`;
    window.open(downloadUrl, '_blank');
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading && !data) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary font-mono">
        <RotateCw className="h-8 w-8 animate-spin mr-3" />
        <span>CALCULATING MOMOJI ANALYTICS...</span>
      </div>
    );
  }

  const avgOrderValue = data && data.totalOrders > 0 
    ? (data.totalRevenue / data.totalOrders).toFixed(2) 
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-white">Performance Analytics</h2>
          <p className="font-mono text-xs text-accent mt-1">Review revenue trends, order averages, and table occupancy</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-900 rounded-full px-3 py-1.5 font-mono text-[11px] text-accent">
            <Calendar className="h-4 w-4" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent focus:outline-none text-white cursor-pointer"
            />
            <span>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent focus:outline-none text-white cursor-pointer"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-950 text-accent rounded-full font-mono text-[10px]"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-primary text-secondary font-mono text-xs font-bold rounded-full hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md"
          >
            <FileDown className="h-4 w-4" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-900 rounded-card p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary/10">
              <TrendingUp className="h-12 w-12" />
            </div>
            <p className="font-mono text-[10px] text-accent uppercase tracking-wider">Total Revenue</p>
            <p className="font-mono text-2xl font-bold text-primary mt-2">₹{data.totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 font-serif mt-1">Paid billing sessions</p>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-card p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary/10">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <p className="font-mono text-[10px] text-accent uppercase tracking-wider">Orders Placed</p>
            <p className="font-mono text-2xl font-bold text-white mt-2">{data.totalOrders}</p>
            <p className="text-[10px] text-slate-400 font-serif mt-1">Successful completions</p>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-card p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary/10">
              <Hash className="h-12 w-12" />
            </div>
            <p className="font-mono text-[10px] text-accent uppercase tracking-wider">Total Sessions</p>
            <p className="font-mono text-2xl font-bold text-white mt-2">{data.totalSessions}</p>
            <p className="text-[10px] text-slate-400 font-serif mt-1">Tables scanned & order-active</p>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-card p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary/10">
              <CreditCard className="h-12 w-12" />
            </div>
            <p className="font-mono text-[10px] text-accent uppercase tracking-wider">Average Order</p>
            <p className="font-mono text-2xl font-bold text-primary mt-2">₹{avgOrderValue}</p>
            <p className="text-[10px] text-slate-400 font-serif mt-1">Revenue divided by orders</p>
          </div>
        </div>
      )}

      {data && (
        <div className="bg-slate-950 border border-slate-900 rounded-card p-6">
          <h3 className="font-serif text-lg font-bold text-white mb-6">Table revenue contribution</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-accent font-mono text-[10px] uppercase">
                  <th className="pb-3 pl-2">Table Number</th>
                  <th className="pb-3">Orders Completed</th>
                  <th className="pb-3 text-right pr-2">Total Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 font-serif text-sm">
                {data.tableBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-3 pl-2 font-mono text-white font-bold">Table {item.tableNumber}</td>
                    <td className="py-3 font-mono text-slate-350">{item.orderCount} orders</td>
                    <td className="py-3 font-mono font-bold text-primary text-right pr-2">₹{item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
