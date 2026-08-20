import React, { useState, useEffect } from 'react';
import { api } from '../shared/api';
import { getSocket } from '../shared/socket';
import { ClipboardList, Check, X, CreditCard, RotateCw, AlertCircle, Clock } from 'lucide-react';

export default function AdminOrders() {
  const [orderedList, setOrderedList] = useState([]);
  const [acceptedList, setAcceptedList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      oscillator.connect(gainNode);
      
      gainNode.connect(audioCtx.destination);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio contextual play failed:', e);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ordRes, accRes] = await Promise.all([
        api.get('/admin/orders?status=ORDERED&limit=50'),
        api.get('/admin/orders?status=ACCEPTED&limit=50')
      ]);

      if (ordRes.data.success && accRes.data.success) {
        setOrderedList(ordRes.data.orders);
        setAcceptedList(accRes.data.orders);
        setError(null);
      }
    } catch (err) {
      setError('Could not fetch active orders. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const socket = getSocket();
    socket.connect();

    socket.on('order:new', (newOrder) => {
      setOrderedList(prev => [newOrder, ...prev]);
      playAlertSound();
    });

    socket.on('order:updated', (updated) => {
      setOrderedList(prev => prev.filter(o => o._id !== updated._id));
      setAcceptedList(prev => prev.filter(o => o._id !== updated._id));

      if (updated.status === 'ORDERED') {
        setOrderedList(prev => [updated, ...prev]);
      } else if (updated.status === 'ACCEPTED') {
        setAcceptedList(prev => [updated, ...prev]);
      }
    });

    return () => {
      socket.off('order:new');
      socket.off('order:updated');
    };
  }, []);

  const handleAccept = async (orderId) => {
    try {
      await api.patch(`/admin/orders/${orderId}/accept`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept order.');
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('Are you sure you want to REJECT this order?')) return;
    try {
      await api.patch(`/admin/orders/${orderId}/reject`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject order.');
    }
  };

  const handlePaid = async (orderId) => {
    try {
      await api.patch(`/admin/orders/${orderId}/paid`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark order as paid.');
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary font-mono">
        <RotateCw className="h-8 w-8 animate-spin mr-3" />
        <span>LOADING ACTIVE ORDERS BOARD...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-white">Live Orders Board</h2>
          <p className="font-mono text-xs text-accent mt-1">Real-time socket.io event feed</p>
        </div>
        <button
          onClick={fetchInitialData}
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
        <div className="bg-slate-950 border border-slate-900 rounded-card p-5 flex flex-col h-full">
          <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-4">
            <h3 className="font-serif text-lg font-bold text-yellow-400 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></span>
              <span>Incoming Queue ({orderedList.length})</span>
            </h3>
            <span className="px-2 py-0.5 bg-yellow-950 text-yellow-400 font-mono text-[10px] font-bold rounded">ORDERED</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {orderedList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-24 text-center text-slate-655">
                <ClipboardList className="h-10 w-10 mb-3 text-slate-800" />
                <p className="font-serif text-sm">No incoming orders at this time.</p>
              </div>
            ) : (
              orderedList.map(order => (
                <div key={order._id} className="bg-secondary border border-slate-900 rounded-card p-4 space-y-3 relative hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-mono text-sm font-bold text-white">
                        TABLE {order.tableId?.tableNumber || 'Unknown'}
                      </h4>
                      <p className="text-[10px] font-mono text-accent flex items-center mt-0.5">
                        <Clock className="h-3 w-3 mr-1" /> {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-primary font-bold">₹{order.totalAmount}</span>
                  </div>

                  <ul className="text-xs space-y-1 bg-slate-950/50 p-2.5 rounded-2xl border border-slate-900">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-slate-300">
                        <span className="font-serif">{item.name} <span className="font-mono text-primary font-bold">x{item.quantity}</span></span>
                        <span className="font-mono text-slate-400">₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => handleAccept(order._id)}
                      className="flex-1 flex justify-center items-center space-x-1 py-2 bg-primary text-secondary font-mono text-xs font-bold rounded-full hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <Check className="h-4 w-4" />
                      <span>ACCEPT</span>
                    </button>
                    <button
                      onClick={() => handleReject(order._id)}
                      className="flex items-center justify-center p-2 bg-red-950 border border-red-900/50 text-red-400 rounded-full hover:bg-red-900 hover:text-white transition-all"
                      title="Reject Order"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-card p-5 flex flex-col h-full">
          <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-4">
            <h3 className="font-serif text-lg font-bold text-blue-400 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-blue-400 rounded-full"></span>
              <span>In Preparation ({acceptedList.length})</span>
            </h3>
            <span className="px-2 py-0.5 bg-blue-950 text-blue-400 font-mono text-[10px] font-bold rounded">ACCEPTED</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {acceptedList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-24 text-center text-slate-655">
                <ClipboardList className="h-10 w-10 mb-3 text-slate-800" />
                <p className="font-serif text-sm">No orders currently preparing.</p>
              </div>
            ) : (
              acceptedList.map(order => (
                <div key={order._id} className="bg-secondary border border-slate-900 rounded-card p-4 space-y-3 hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-mono text-sm font-bold text-white">
                        TABLE {order.tableId?.tableNumber || 'Unknown'}
                      </h4>
                      <p className="text-[10px] font-mono text-accent flex items-center mt-0.5">
                        <Clock className="h-3 w-3 mr-1" /> {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-primary font-bold">₹{order.totalAmount}</span>
                  </div>

                  <ul className="text-xs space-y-1 bg-slate-950/50 p-2.5 rounded-2xl border border-slate-900">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-slate-300">
                        <span className="font-serif">{item.name} <span className="font-mono text-primary font-bold">x{item.quantity}</span></span>
                        <span className="font-mono text-slate-400">₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePaid(order._id)}
                    className="w-full flex justify-center items-center space-x-1.5 py-2.5 bg-slate-900 border border-primary/20 text-primary font-mono text-xs font-bold rounded-full hover:bg-slate-950 transition-all"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>MARK PAID</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
