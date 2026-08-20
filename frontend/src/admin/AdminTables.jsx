import React, { useState, useEffect } from 'react';
import { api } from '../shared/api';
import { getSocket } from '../shared/socket';
import { Database, Plus, ToggleLeft, ToggleRight, Download, RotateCw, AlertCircle } from 'lucide-react';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [newTableNum, setNewTableNum] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tables');
      if (res.data.success) {
        setTables(res.data.tables);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch restaurant tables list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    const socket = getSocket();
    socket.connect();

    socket.on('order:new', () => {
      fetchTables();
    });

    socket.on('session:closed', () => {
      fetchTables();
    });

    return () => {
      socket.off('order:new');
      socket.off('session:closed');
    };
  }, []);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableNum) return;

    setCreating(true);
    setError(null);

    try {
      const num = parseInt(newTableNum, 10);
      const res = await api.post('/admin/tables', { tableNumber: num });
      if (res.data.success) {
        setTables(prev => [...prev, res.data.table].sort((a, b) => a.tableNumber - b.tableNumber));
        setNewTableNum('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create table record.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (tableId, currentActive) => {
    try {
      const res = await api.patch(`/admin/tables/${tableId}`, { isActive: !currentActive });
      if (res.data.success) {
        setTables(prev => prev.map(t => t._id === tableId ? { ...t, isActive: res.data.table.isActive } : t));
      }
    } catch (err) {
      alert('Failed to update table status.');
    }
  };

  const handleDownloadQR = (tableId) => {
    const url = `${api.defaults.baseURL}/admin/tables/${tableId}/qr`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary font-mono">
        <RotateCw className="h-8 w-8 animate-spin mr-3" />
        <span>LOADING TABLES CONFIGURATION...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-white">Tables Dashboard</h2>
          <p className="font-mono text-xs text-accent mt-1">Add tables and download print-ready QR codes</p>
        </div>
        <button
          onClick={fetchTables}
          className="flex items-center space-x-2 px-4 py-2 border border-primary/20 text-primary rounded-full hover:bg-slate-900 transition-all font-mono text-xs"
        >
          <RotateCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-900/50 text-red-200 text-xs font-mono p-4 rounded-card flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="bg-slate-950 border border-slate-900 rounded-card p-6 h-fit">
          <h3 className="font-serif text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Add New Table</span>
          </h3>
          
          <form onSubmit={handleCreateTable} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-accent uppercase">Table Number</label>
              <input
                type="number"
                min="1"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                placeholder="e.g. 6"
                required
                className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm font-mono focus:border-primary focus:outline-none text-white font-mono"
              />
            </div>
            
            <button
              type="submit"
              disabled={creating || !newTableNum}
              className="w-full bg-primary text-secondary font-mono font-bold rounded-full py-2.5 text-xs tracking-wider flex justify-center items-center hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all shadow-md font-mono"
            >
              {creating ? 'ADDING...' : 'ADD TABLE'}
            </button>
          </form>
        </div>

        <div className="xl:col-span-3 bg-slate-950 border border-slate-900 rounded-card p-6">
          <h3 className="font-serif text-lg font-bold text-white mb-6 flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span>Active Dining Layout ({tables.length} Tables)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tables.map(table => (
              <div 
                key={table._id} 
                className="bg-secondary border border-slate-900 hover:border-slate-800 rounded-card p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif text-lg font-bold text-white">Table {table.tableNumber}</h4>
                    <p className="font-mono text-[9px] text-accent mt-0.5">Token: {table.qrToken.substring(0, 10)}...</p>
                  </div>
                  
                  {table.status === 'OCCUPIED' ? (
                    <span className="px-2 py-0.5 bg-red-950 text-red-400 font-mono text-[9px] font-bold rounded border border-red-900/30">
                      OCCUPIED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[9px] font-bold rounded border border-emerald-900/30">
                      AVAILABLE
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(table._id, table.isActive)}
                      className="text-accent hover:text-white transition-colors animate-all"
                    >
                      {table.isActive ? (
                        <ToggleRight className="h-7 w-7 text-primary" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-700" />
                      )}
                    </button>
                    <span className="font-mono text-[10px] text-slate-400">
                      {table.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDownloadQR(table._id)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-950 border border-primary/20 text-primary rounded-full transition-colors font-mono text-[10px] font-bold"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
