import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../shared/api';
import { getSocket } from '../shared/socket';
import { ArrowLeft, Clock, CheckCircle2, RotateCw, AlertTriangle, ChevronRight, Utensils } from 'lucide-react';

export default function CustomerOrderStatus() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);

  const fetchSessionDetails = async () => {
    try {
      const res = await api.get(`/session/${sessionId}`);
      if (res.data.success) {
        setSession(res.data.session);
        setOrders(res.data.orders);
        setError(null);
      } else {
        setError(res.data.error || 'Failed to fetch status details.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch session. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchSessionDetails();

    const socket = getSocket();
    socket.connect();

    socket.on('order:updated', (updatedOrder) => {
      if (updatedOrder.sessionId === sessionId) {
        setOrders(prev => {
          const index = prev.findIndex(o => o._id === updatedOrder._id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = updatedOrder;
            return next;
          } else {
            return [...prev, updatedOrder];
          }
        });
      }
    });

    socket.on('session:closed', (closedData) => {
      if (closedData.sessionId === sessionId) {
        setSession(prev => prev ? { ...prev, status: 'CLOSED' } : null);
        const tableId = typeof session?.tableId === 'object' ? session?.tableId?._id : session?.tableId;
        if (tableId) {
          localStorage.removeItem(`momoji_cart_${tableId}`);
        }
      }
    });

    return () => {
      socket.off('order:updated');
      socket.off('session:closed');
    };
  }, [sessionId, session?.tableId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-secondary text-primary font-mono p-4 text-center">
        <RotateCw className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm">RESOLVING TABLE BILLING TAB...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-secondary text-slate-100 p-6 text-center">
        <AlertTriangle className="h-14 w-14 text-red-500 mb-4" />
        <h2 className="font-serif text-xl font-bold mb-2">Session Lookup Failed</h2>
        <p className="text-xs text-accent font-mono mb-6">{error || 'Session not found.'}</p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-2.5 bg-primary text-secondary font-mono text-xs font-bold rounded-full"
        >
          BACK TO MENU
        </button>
      </div>
    );
  }

  const tableNumber = typeof session.tableId === 'object' ? session.tableId.tableNumber : 'Active';
  const isClosed = session.status === 'CLOSED';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ORDERED':
        return <span className="px-2 py-0.5 bg-yellow-950 text-yellow-400 font-mono text-[9px] font-bold rounded border border-yellow-800/30">ORDERED</span>;
      case 'ACCEPTED':
        return <span className="px-2 py-0.5 bg-blue-950 text-blue-400 font-mono text-[9px] font-bold rounded border border-blue-900/30">PREPARING</span>;
      case 'PAID':
        return <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[9px] font-bold rounded border border-emerald-900/30">PAID</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 bg-red-950 text-red-400 font-mono text-[9px] font-bold rounded border border-red-900/30">REJECTED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-secondary">
      <header className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
        <button 
          onClick={() => navigate('/menu')}
          className="p-2 bg-slate-950 text-primary rounded-full hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-lg font-bold tracking-wider text-white">TABLE {tableNumber} TAB</h1>
        <div className="w-9 h-9"></div>
      </header>

      {isClosed ? (
        <div className="bg-emerald-950/60 border border-emerald-900/40 rounded-card p-5 text-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="font-serif text-lg font-bold text-white">Paid & Closed</h2>
          <p className="text-xs text-accent font-serif mt-1">Thank you for dining with Momoji! Your session has been finalized.</p>
        </div>
      ) : (
        <div className="bg-[#0a271d] border border-primary/20 rounded-card p-5 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-serif text-sm font-semibold text-white">Active Dine-in Session</h2>
                <p className="font-mono text-[10px] text-accent mt-0.5">Session ID: {session._id.substring(18)}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary font-mono text-[10px] font-bold rounded-full border border-primary/30">
              ACTIVE
            </span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between items-center">
            <span className="font-serif text-xs text-slate-300">Accumulated Bill Total:</span>
            <span className="font-mono text-base text-primary font-bold">₹{session.totalAmount}</span>
          </div>
        </div>
      )}

      <h3 className="font-serif text-xs font-semibold text-accent tracking-wider uppercase mb-3 px-1">Order History</h3>
      
      {orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
          <Utensils className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-sm font-serif">No orders placed under this session yet.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {orders.map((order, idx) => (
            <div key={order._id} className="bg-slate-950 border border-slate-900 rounded-card p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-[10px] text-accent">Order #{idx + 1} ({new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="space-y-2">
                {order.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between items-center text-xs">
                    <span className="font-serif text-slate-300">{item.name} <span className="font-mono text-primary font-semibold">x{item.quantity}</span></span>
                    <span className="font-mono text-slate-400">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-900 flex justify-between items-center text-xs font-mono">
                <span className="text-accent">Order Total:</span>
                <span className="text-white font-bold">₹{order.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isClosed && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-20">
          <button
            onClick={() => navigate('/menu')}
            className="w-full bg-slate-900 border border-primary/20 text-primary font-mono font-bold rounded-full py-4 text-xs tracking-wider flex justify-center items-center hover:bg-slate-950 transition-colors shadow-lg"
          >
            <span>ORDER MORE FOOD</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
