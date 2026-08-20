import React, { useState, useEffect } from 'react';
import { api } from '../shared/api';
import { Database, Plus, Edit2, Trash2, RotateCw, AlertCircle, ToggleLeft, ToggleRight, X } from 'lucide-react';

export default function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [filterCategory, setFilterCategory] = useState('');

  const [showCatModal, setShowCatModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState('0');

  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCat, setItemCat] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemImageBase64, setItemImageBase64] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/admin/categories');
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
        if (catRes.data.categories.length > 0 && !itemCat) {
          setItemCat(catRes.data.categories[0]._id);
        }
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filterCategory && { categoryId: filterCategory })
      });

      const itemRes = await api.get(`/admin/menu-items?${queryParams.toString()}`);
      if (itemRes.data.success) {
        setMenuItems(itemRes.data.menuItems);
        setTotalItems(itemRes.data.total);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch menu details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterCategory]);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ---------------- CATEGORY CRUD ACTIONS ----------------
  const handleOpenCatCreate = () => {
    setEditCategory(null);
    setCatName('');
    setCatOrder('0');
    setShowCatModal(true);
  };

  const handleOpenCatEdit = (cat) => {
    setEditCategory(cat);
    setCatName(cat.name);
    setCatOrder(cat.displayOrder.toString());
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editCategory) {
        const res = await api.patch(`/admin/categories/${editCategory._id}`, {
          name: catName,
          displayOrder: parseInt(catOrder, 10)
        });
        if (res.data.success) {
          setCategories(prev => prev.map(c => c._id === editCategory._id ? res.data.category : c).sort((a,b)=>a.displayOrder-b.displayOrder));
        }
      } else {
        const res = await api.post('/admin/categories', {
          name: catName,
          displayOrder: parseInt(catOrder, 10)
        });
        if (res.data.success) {
          setCategories(prev => [...prev, res.data.category].sort((a,b)=>a.displayOrder-b.displayOrder));
        }
      }
      setShowCatModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category? (Make sure it is empty)')) return;
    try {
      const res = await api.delete(`/admin/categories/${catId}`);
      if (res.data.success) {
        setCategories(prev => prev.filter(c => c._id !== catId));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete. Category must be empty.');
    }
  };

  // ---------------- MENU ITEM CRUD ACTIONS ----------------
  const handleOpenItemCreate = () => {
    setEditItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemCat(categories[0]?._id || '');
    setItemAvailable(true);
    setItemImageBase64('');
    setShowItemModal(true);
  };

  const handleOpenItemEdit = (item) => {
    setEditItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price.toString());
    setItemCat(typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId);
    setItemAvailable(item.isAvailable);
    setItemImageBase64(item.imageUrl || '');
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    try {
      const payload = {
        name: itemName,
        description: itemDesc,
        price: parseFloat(itemPrice),
        categoryId: itemCat,
        isAvailable: itemAvailable,
        imageUrl: itemImageBase64
      };

      if (editItem) {
        const res = await api.patch(`/admin/menu-items/${editItem._id}`, payload);
        if (res.data.success) {
          setMenuItems(prev => prev.map(m => m._id === editItem._id ? res.data.menuItem : m));
        }
      } else {
        const res = await api.post('/admin/menu-items', payload);
        if (res.data.success) {
          setMenuItems(prev => [res.data.menuItem, ...prev]);
        }
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save menu item.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/admin/menu-items/${itemId}`);
      setMenuItems(prev => prev.filter(m => m._id !== itemId));
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const res = await api.patch(`/admin/menu-items/${item._id}`, { isAvailable: !item.isAvailable });
      if (res.data.success) {
        setMenuItems(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: res.data.menuItem.isAvailable } : m));
      }
    } catch (err) {
      alert('Failed to toggle item availability.');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary font-mono">
        <RotateCw className="h-8 w-8 animate-spin mr-3" />
        <span>LOADING MENU DATA...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-wide text-white">Menu Manager</h2>
          <p className="font-mono text-xs text-accent mt-1">Configure categories, items, and upload images to Cloudinary</p>
        </div>
        <button
          onClick={fetchData}
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
        <div className="bg-slate-950 border border-slate-900 rounded-card p-5 h-fit space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-950">
            <h3 className="font-serif text-base font-bold text-white">Categories</h3>
            <button
              onClick={handleOpenCatCreate}
              className="p-1.5 bg-primary/10 border border-primary/30 text-primary rounded-full hover:bg-primary/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {categories.map(cat => (
              <div 
                key={cat._id}
                className="flex items-center justify-between p-2.5 bg-secondary border border-slate-900 rounded-2xl hover:border-slate-800"
              >
                <div>
                  <span className="font-mono text-xs text-primary font-bold mr-1.5">#{cat.displayOrder}</span>
                  <span className="font-serif text-sm text-slate-200">{cat.name}</span>
                </div>
                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => handleOpenCatEdit(cat)}
                    className="p-1 text-accent hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-slate-950 border border-slate-900 rounded-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-900 mb-6 gap-4">
            <h3 className="font-serif text-lg font-bold text-white flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <span>Menu Items</span>
            </h3>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="bg-secondary border border-slate-800 rounded-full py-1.5 px-4 text-xs font-mono focus:outline-none focus:border-primary text-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>

              <button
                onClick={handleOpenItemCreate}
                className="flex items-center space-x-1.5 px-4 py-2 bg-primary text-secondary font-mono text-xs font-bold rounded-full hover:scale-[1.01] active:scale-[0.99] transition-all shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>NEW ITEM</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {menuItems.length === 0 ? (
              <div className="py-24 text-center text-slate-550 font-serif">
                No items found. Create some menu items to display.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-accent font-mono text-[10px] uppercase">
                      <th className="pb-3 pl-2">Image</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950 font-serif text-sm">
                    {menuItems.map(item => (
                      <tr key={item._id} className="hover:bg-slate-900/40">
                        <td className="py-3 pl-2">
                          <img 
                            src={item.imageUrl || '/placeholder.jpg'} 
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-800"
                          />
                        </td>
                        <td className="py-3 font-semibold text-white">
                          <div>
                            <p>{item.name}</p>
                            <p className="text-[10px] text-accent font-mono truncate max-w-xs">{item.description}</p>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-350">
                          {typeof item.categoryId === 'object' ? item.categoryId.name : 'Unassigned'}
                        </td>
                        <td className="py-3 font-mono font-bold text-primary">₹{item.price}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className="focus:outline-none"
                          >
                            {item.isAvailable ? (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[9px] rounded">Available</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-950 text-red-400 font-mono text-[9px] rounded">Unavailable</span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleOpenItemEdit(item)}
                              className="p-1 text-accent hover:text-white"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalItems > limit && (
            <div className="flex justify-between items-center border-t border-slate-900 pt-4 mt-6 font-mono text-xs">
              <span className="text-accent">Page {page} of {Math.ceil(totalItems / limit)}</span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-950 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page * limit >= totalItems}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-950 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-40 font-mono">
          <div className="bg-slate-950 border border-slate-900 rounded-card w-full max-w-sm p-6 relative">
            <button 
              onClick={() => setShowCatModal(false)}
              className="absolute right-4 top-4 text-accent hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-serif text-lg font-bold text-white mb-4">
              {editCategory ? 'Edit Category' : 'Create Category'}
            </h3>
            
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-accent uppercase">Category Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Ramen"
                  required
                  className="w-full bg-secondary border border-slate-800 rounded-full py-2 px-4 focus:outline-none text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-accent uppercase">Display Order</label>
                <input
                  type="number"
                  value={catOrder}
                  onChange={(e) => setCatOrder(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full bg-secondary border border-slate-800 rounded-full py-2 px-4 focus:outline-none text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-secondary font-bold rounded-full py-2.5 hover:scale-[1.01] active:scale-[0.99] transition-all font-mono"
              >
                SAVE CATEGORY
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MENU ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-40 overflow-y-auto font-mono">
          <div className="bg-slate-950 border border-slate-900 rounded-card w-full max-w-md p-6 relative my-8">
            <button 
              onClick={() => setShowItemModal(false)}
              className="absolute right-4 top-4 text-accent hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-serif text-lg font-bold text-white mb-4">
              {editItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            
            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-accent uppercase">Item Name</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Shoyu Ramen"
                  required
                  className="w-full bg-secondary border border-slate-800 rounded-full py-2 px-4 focus:outline-none text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-accent uppercase">Description</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Delicious pork broth base with eggs..."
                  required
                  rows={2}
                  className="w-full bg-secondary border border-slate-800 rounded-2xl py-2 px-4 focus:outline-none text-white resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-accent uppercase">Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="450"
                    required
                    className="w-full bg-secondary border border-slate-800 rounded-full py-2 px-4 focus:outline-none text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-accent uppercase">Category</label>
                  <select
                    value={itemCat}
                    onChange={(e) => setItemCat(e.target.value)}
                    className="w-full bg-secondary border border-slate-800 rounded-full py-2 px-4 focus:outline-none text-white font-mono"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-accent uppercase">Item Image</label>
                <div className="flex items-center space-x-3 bg-secondary border border-slate-800 rounded-2xl p-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="menu-file-input"
                  />
                  <label 
                    htmlFor="menu-file-input"
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-950 text-slate-300 rounded-full cursor-pointer transition-colors"
                  >
                    Choose Image
                  </label>
                  <span className="text-[10px] text-slate-400 truncate max-w-xs">
                    {itemImageBase64 ? 'Image Loaded' : 'No file selected'}
                  </span>
                </div>
                {itemImageBase64 && (
                  <img 
                    src={itemImageBase64} 
                    alt="Preview"
                    className="mt-2 w-20 h-16 object-cover rounded-lg border border-slate-850"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setItemAvailable(!itemAvailable)}
                  className="focus:outline-none"
                >
                  {itemAvailable ? (
                    <ToggleRight className="h-7 w-7 text-primary" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-700" />
                  )}
                </button>
                <span className="text-[11px] text-slate-400">Item is available for ordering</span>
              </div>

              <button
                type="submit"
                disabled={savingItem}
                className="w-full bg-primary text-secondary font-bold rounded-full py-3 hover:scale-[1.01] active:scale-[0.99] transition-all font-mono"
              >
                {savingItem ? 'SAVING DETAILS...' : 'SAVE MENU ITEM'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
