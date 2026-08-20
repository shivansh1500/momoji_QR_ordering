import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../shared/api';
import { ArrowLeft, ShoppingBag, MapPin, Loader2, AlertCircle, Trash2 } from 'lucide-react';

export default function CustomerCart() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const qrToken = localStorage.getItem('momoji_qr_token');
  
  const [cart, setCart] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(location.state?.coords || null);

  useEffect(() => {
    if (!qrToken) {
      navigate('/menu');
      return;
    }

    const resolveTable = async () => {
      try {
        const res = await api.get(`/menu?table=${qrToken}`);
        if (res.data.success) {
          setTableId(res.data.table.id);
          setTableNumber(res.data.table.tableNumber);
          
          const cached = localStorage.getItem(`momoji_cart_${res.data.table.id}`);
          if (cached) {
            setCart(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.error('Failed resolving table during cart view:', err);
      }
    };

    resolveTable();
  }, [qrToken, navigate]);



  const saveCart = (newCart) => {
    setCart(newCart);
    if (tableId) {
      localStorage.setItem(`momoji_cart_${tableId}`, JSON.stringify(newCart));
    }
  };

  const updateQuantity = (itemId, increment) => {
    const item = cart.find(i => i.menuItemId === itemId);
    if (!item) return;

    let nextCart = [];
    if (increment) {
      nextCart = cart.map(i => i.menuItemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      if (item.quantity === 1) {
        nextCart = cart.filter(i => i.menuItemId !== itemId);
      } else {
        nextCart = cart.map(i => i.menuItemId === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
    }
    saveCart(nextCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setPlacing(true);
    setError(null);

    const submitOrder = async (latVal, lngVal) => {
      try {
        const itemsPayload = cart.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity
        }));

        const res = await api.post('/orders', {
          qrToken,
          latitude: latVal,
          longitude: lngVal,
          items: itemsPayload
        });

        if (res.data.success) {
          if (tableId) {
            localStorage.removeItem(`momoji_cart_${tableId}`);
          }
          navigate(`/order-status/${res.data.sessionId}`);
        } else {
          setError(res.data.error || 'Failed to place order.');
          setPlacing(false);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to place order. Check geofence status.');
        setPlacing(false);
      }
    };

    if (!coords) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const currentCoords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
            setCoords(currentCoords);
            submitOrder(currentCoords.latitude, currentCoords.longitude);
          },
          (err) => {
            setError('GPS Location permission is required to verify geofence. Please enable location.');
            setPlacing(false);
          },
          { enableHighAccuracy: true }
        );
      } else {
        setError('Geolocation is not supported by your device.');
        setPlacing(false);
      }
    } else {
      submitOrder(coords.latitude, coords.longitude);
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
        <h1 className="font-serif text-xl font-bold tracking-wider text-white">YOUR CART</h1>
        <div className="w-9 h-9"></div>
      </header>

      <div className="bg-[#0a271d] rounded-2xl p-3 border border-primary/20 flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-accent">Ordering location validation</p>
            <p className="text-xs text-white font-serif truncate">
              {coords ? `GPS coordinates locked` : `Location validated during checkout`}
            </p>
          </div>
        </div>
        {coords ? (
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
        ) : (
          <span className="w-2.5 h-2.5 bg-slate-700 rounded-full"></span>
        )}
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-900/50 text-red-200 text-xs font-mono p-3 rounded-2xl mb-4 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="h-16 w-16 text-slate-700 mb-4" />
          <p className="font-serif text-lg text-white mb-2">Your cart is empty</p>
          <p className="text-xs text-accent font-serif mb-6">Go to menu & add items to order.</p>
          <button
            onClick={() => navigate('/menu')}
            className="px-6 py-2 bg-primary text-secondary font-mono text-xs font-bold rounded-full"
          >
            GO TO MENU
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-xs text-accent">Table {tableNumber} Tab</span>
              <button 
                onClick={clearCart}
                className="text-red-400 text-xs font-mono flex items-center space-x-1 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-card p-4 space-y-4">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex justify-between items-center border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-serif text-sm font-semibold text-white truncate">{item.name}</h3>
                    <p className="font-mono text-xs text-primary font-bold mt-1">₹{item.price}</p>
                  </div>
                  
                  <div className="flex items-center bg-secondary border border-primary/20 rounded-full p-1 space-x-2">
                    <button 
                      onClick={() => updateQuantity(item.menuItemId, false)}
                      className="w-6 h-6 rounded-full bg-slate-900 text-primary font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono text-white w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menuItemId, true)}
                      className="w-6 h-6 rounded-full bg-primary text-secondary font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-900 pt-4 space-y-4">
            <div className="flex justify-between items-center font-mono px-2">
              <span className="text-xs text-accent">Estimated Total Amount:</span>
              <span className="text-lg text-primary font-bold">₹{totalAmount}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || cart.length === 0}
              className="w-full bg-primary text-secondary font-mono font-bold rounded-full py-4 text-sm tracking-wider flex justify-center items-center hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all shadow-lg"
            >
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>PLACING ORDER...</span>
                </>
              ) : (
                <span>PLACE ORDER (₹{totalAmount})</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
