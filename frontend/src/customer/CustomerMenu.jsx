import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../shared/api';
import { FixedSizeList as List } from 'react-window';
import { Star, MapPin, AlertCircle, Clock } from 'lucide-react';

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const qrToken = searchParams.get('table') || localStorage.getItem('momoji_qr_token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [closeReason, setCloseReason] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (qrToken) {
      localStorage.setItem('momoji_qr_token', qrToken);
    }

    const fetchMenu = async () => {
      try {
        const url = qrToken ? `/menu?table=${qrToken}` : '/menu';
        const res = await api.get(url);
        if (res.data.success) {
          setRestaurant(res.data.restaurant);
          setTable(res.data.table);
          setCategories(res.data.categories);
          setMenuItems(res.data.menuItems);
          setActiveSessionId(res.data.activeSessionId);
          setOrderingEnabled(res.data.orderingEnabled);
          setCloseReason(res.data.reason);

          const cachedCart = localStorage.getItem(`momoji_cart_${res.data.table.id}`);
          if (cachedCart) {
            setCart(JSON.parse(cachedCart));
          }
        } else {
          setError(res.data.error || 'Failed to load menu');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to reach the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [qrToken]);

  const saveCart = (newCart) => {
    setCart(newCart);
    if (table) {
      localStorage.setItem(`momoji_cart_${table.id}`, JSON.stringify(newCart));
    }
  };

  const addToCart = (item) => {
    if (!orderingEnabled) return;
    const existing = cart.find(i => i.menuItemId === item._id);
    if (existing) {
      saveCart(cart.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      saveCart([...cart, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(i => i.menuItemId === itemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      saveCart(cart.filter(i => i.menuItemId !== itemId));
    } else {
      saveCart(cart.map(i => i.menuItemId === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const getQuantity = (itemId) => {
    return cart.find(i => i.menuItemId === itemId)?.quantity || 0;
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.categoryId === selectedCategory || (typeof item.categoryId === 'object' && item.categoryId._id === selectedCategory));

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-secondary text-primary font-mono p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
        <p className="text-lg">WELCOME TO MOMOJI</p>
        <p className="text-xs text-accent mt-2">Loading fresh Japanese & Dim Sum menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-secondary text-slate-100 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-primary mb-4" />
        <h2 className="font-serif text-2xl mb-2 text-white">Momoji Order Portal</h2>
        <p className="text-sm text-accent mb-6 font-serif">{error}</p>
        <div className="bg-slate-900 border border-slate-800 rounded-card p-4 text-xs font-mono text-left w-full">
          <p className="text-primary font-semibold mb-1">To order:</p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-300">
            <li>Ensure QR is scanned properly.</li>
            <li>Enable GPS location if prompted.</li>
            <li>Connect to restaurant Wi-Fi/data.</li>
          </ol>
        </div>
      </div>
    );
  }

  const VirtualRow = ({ index, style }) => {
    const item = filteredItems[index];
    const qty = getQuantity(item._id);

    return (
      <div style={style} className="px-4 py-2">
        <div className="bg-[#0a271d] rounded-card border border-slate-900 overflow-hidden flex h-[100px] items-center p-3 space-x-3">
          <img 
            src={item.imageUrl || '/placeholder.jpg'} 
            alt={item.name}
            className="w-20 h-20 object-cover rounded-2xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-xs font-mono text-primary font-bold">{item.rating.toFixed(1)}</span>
            </div>
            <h4 className="font-serif text-sm font-semibold truncate text-white mt-0.5">{item.name}</h4>
            <p className="text-slate-400 text-xs truncate font-serif mt-0.5">{item.description}</p>
            <p className="text-primary font-mono text-sm font-bold mt-1">₹{item.price}</p>
          </div>
          <div className="flex flex-col items-center">
            {qty > 0 ? (
              <div className="flex items-center bg-secondary border border-primary/20 rounded-full p-1 space-x-2">
                <button 
                  onClick={() => removeFromCart(item._id)}
                  className="w-6 h-6 rounded-full bg-slate-900 text-primary font-bold text-xs"
                >
                  -
                </button>
                <span className="text-xs font-mono text-white w-4 text-center">{qty}</span>
                <button 
                  onClick={() => addToCart(item)}
                  disabled={!orderingEnabled}
                  className="w-6 h-6 rounded-full bg-primary text-secondary font-bold text-xs disabled:opacity-30"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(item)}
                disabled={!orderingEnabled}
                className="px-4 py-1.5 bg-primary text-secondary font-mono text-xs font-bold rounded-full transition-all disabled:opacity-40"
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex-1 flex flex-col relative pb-24 bg-secondary">
      <div className="relative h-44 bg-slate-950 overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => navigate('/admin/login')}
            className="px-3.5 py-1.5 bg-slate-950/80 border border-slate-800 text-primary hover:text-white rounded-full text-[10px] font-mono font-bold tracking-wider transition-all"
          >
            ADMIN LOGIN
          </button>
        </div>
        <img 
          src={restaurant?.banners[0] || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'} 
          alt="Momoji banners"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>
        <div className="absolute bottom-4 left-4 flex items-center space-x-3">
          {restaurant?.logoUrl && (
            <img src={restaurant.logoUrl} alt="Logo" className="w-12 h-12 rounded-full border border-primary/50" />
          )}
          <div>
            <h1 className="font-serif text-2xl font-bold text-white tracking-wide">{restaurant?.name || 'MOMOJI'}</h1>
            <p className="font-mono text-xs text-primary font-semibold flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> TABLE {table?.tableNumber}
            </p>
          </div>
        </div>
      </div>

      {geoError && (
        <div className="mx-4 mt-3 bg-red-950/60 border border-red-900/50 text-red-200 text-xs font-mono p-3 rounded-2xl flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {!orderingEnabled && (
        <div className="mx-4 mt-3 bg-[#1d1b11] border border-yellow-800/40 rounded-2xl p-3 flex items-center space-x-2">
          <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
          <div>
            <p className="text-xs font-mono text-yellow-400 font-bold">Ordering Offline ({closeReason || 'Restaurant Closed'})</p>
            <p className="text-[10px] text-slate-400 font-serif">You can browse the menu but placement is disabled.</p>
          </div>
        </div>
      )}

      {activeSessionId && (
        <div className="mx-4 mt-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-primary font-bold">Active Bill Session</p>
            <p className="text-[10px] text-slate-400">Additional orders will join this tab.</p>
          </div>
          <button 
            onClick={() => navigate(`/order-status/${activeSessionId}`)}
            className="px-3 py-1 bg-slate-800 text-primary font-mono text-[10px] font-bold rounded-full hover:bg-slate-750 transition-colors"
          >
            Track Tab
          </button>
        </div>
      )}

      <div className="sticky top-0 bg-secondary/95 backdrop-blur-sm z-10 py-3 border-b border-slate-900">
        <div className="flex space-x-2 overflow-x-auto px-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono shrink-0 transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-primary text-secondary font-bold' 
                : 'bg-slate-900 text-accent hover:text-white'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono shrink-0 transition-colors ${
                selectedCategory === cat._id 
                  ? 'bg-primary text-secondary font-bold' 
                  : 'bg-slate-900 text-accent hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 mt-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-accent">
            <p className="font-serif">No items available in this category.</p>
          </div>
        ) : filteredItems.length > 20 ? (
          <List
            height={500}
            itemCount={filteredItems.length}
            itemSize={116}
            width="100%"
          >
            {VirtualRow}
          </List>
        ) : (
          <div className="space-y-3 px-4">
            {filteredItems.map(item => {
              const qty = getQuantity(item._id);
              return (
                <div key={item._id} className="bg-[#0a271d] rounded-card border border-slate-900 overflow-hidden flex h-[100px] items-center p-3 space-x-3">
                  <img 
                    src={item.imageUrl || '/placeholder.jpg'} 
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-xs font-mono text-primary font-bold">{item.rating.toFixed(1)}</span>
                    </div>
                    <h4 className="font-serif text-sm font-semibold truncate text-white mt-0.5">{item.name}</h4>
                    <p className="text-slate-400 text-xs truncate font-serif mt-0.5">{item.description}</p>
                    <p className="text-primary font-mono text-sm font-bold mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    {qty > 0 ? (
                      <div className="flex items-center bg-secondary border border-primary/20 rounded-full p-1 space-x-2">
                        <button 
                          onClick={() => removeFromCart(item._id)}
                          className="w-6 h-6 rounded-full bg-slate-900 text-primary font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono text-white w-4 text-center">{qty}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          disabled={!orderingEnabled}
                          className="w-6 h-6 rounded-full bg-primary text-secondary font-bold text-xs disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!orderingEnabled}
                        className="px-4 py-1.5 bg-primary text-secondary font-mono text-xs font-bold rounded-full transition-all disabled:opacity-40"
                      >
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-25">
          <button
            onClick={() => navigate('/cart', { state: { coords } })}
            className="w-full bg-primary text-secondary font-bold rounded-full py-3 px-6 shadow-xl flex justify-between items-center hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-2">
              <div className="bg-secondary text-primary w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold">
                {totalItems}
              </div>
              <span className="text-sm font-mono tracking-wider font-semibold">VIEW CART</span>
            </div>
            <span className="text-sm font-mono font-bold">₹{totalAmount}</span>
          </button>
        </div>
      )}
    </div>
  );
}
