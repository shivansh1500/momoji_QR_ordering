import React, { useState, useEffect } from 'react';
import { api } from '../shared/api';
import { Settings, Save, MapPin, ImageIcon, ToggleLeft, ToggleRight, RotateCw, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
  const [restName, setRestName] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [opTime, setOpTime] = useState('09:00');
  const [clTime, setClTime] = useState('22:00');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [radius, setRadius] = useState('100');
  const [logoBase64, setLogoBase64] = useState('');
  const [bannerBase64, setBannerBase64] = useState('');
  
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setRestName(s.name);
        setIsOpen(s.isOpen);
        setOpTime(s.openingTime);
        setClTime(s.closingTime);
        setLat(s.geofence.latitude.toString());
        setLng(s.geofence.longitude.toString());
        setRadius(s.geofence.radiusMeters.toString());
        setLogoBase64(s.logoUrl || '');
        setBannerBase64(s.banners[0] || '');
      }
    } catch (err) {
      console.error('Failed to load restaurant settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
        },
        () => {
          alert('GPS location permission denied. Check your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleImageConversion = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') setLogoBase64(reader.result);
        else setBannerBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const payload = {
        name: restName,
        isOpen,
        openingTime: opTime,
        closingTime: clTime,
        geofence: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radiusMeters: parseFloat(radius)
        },
        logoUrl: logoBase64,
        banners: bannerBase64 ? [bannerBase64] : []
      };

      const res = await api.patch('/admin/settings', payload);
      if (res.data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings configurations.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    setSavingAdmin(true);
    setAdminSuccess(false);

    try {
      const res = await api.post('/auth/create-admin', {
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword
      });

      if (res.data.success) {
        setAdminSuccess(true);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setTimeout(() => setAdminSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create new admin account.');
    } finally {
      setSavingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary font-mono">
        <RotateCw className="h-8 w-8 animate-spin mr-3" />
        <span>LOADING RESTAURANT SYSTEM CONFIGURATIONS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-wide text-white">System Settings</h2>
        <p className="font-mono text-xs text-accent mt-1">Configure opening schedule, geofence, and staff access</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-950 border border-slate-900 rounded-card p-6">
          <h3 className="font-serif text-lg font-bold text-white mb-6 flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Store Settings & Geofence</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-6 font-mono text-xs">
            {settingsSuccess && (
              <div className="bg-emerald-950/60 border border-emerald-900/50 text-primary p-3 rounded-2xl flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Store configurations updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-accent uppercase">Restaurant Name</label>
                <input
                  type="text"
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center space-x-3 py-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="focus:outline-none"
                  >
                    {isOpen ? (
                      <ToggleRight className="h-8 w-8 text-primary" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-700" />
                    )}
                  </button>
                  <div>
                    <p className="text-white text-xs font-bold">{isOpen ? 'OPEN FOR ORDERS' : 'STORE CLOSED'}</p>
                    <p className="text-[10px] text-slate-400">Toggle immediate order placement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-accent uppercase">Opening Hours (HH:MM)</label>
                <input
                  type="text"
                  value={opTime}
                  onChange={(e) => setOpTime(e.target.value)}
                  className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-accent uppercase">Closing Hours (HH:MM)</label>
                <input
                  type="text"
                  value={clTime}
                  onChange={(e) => setClTime(e.target.value)}
                  className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-serif font-bold text-white flex items-center space-x-1.5">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  <span>Geofence Boundary Check</span>
                </h4>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-950 text-primary font-mono text-[10px] rounded-full transition-colors"
                >
                  Use Current Location
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-accent uppercase">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-accent uppercase">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-accent uppercase">Geofence Radius (meters)</label>
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-4">
              <h4 className="text-sm font-serif font-bold text-white flex items-center space-x-1.5">
                <ImageIcon className="h-4.5 w-4.5 text-primary" />
                <span>Branding Images (Cloudinary)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-accent uppercase">Logo Upload</label>
                  <div className="flex items-center space-x-3 bg-secondary border border-slate-800 rounded-2xl p-2.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageConversion(e, 'logo')}
                      className="hidden"
                      id="logo-file-input"
                    />
                    <label htmlFor="logo-file-input" className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-950 rounded-full cursor-pointer">
                      Select logo
                    </label>
                  </div>
                  {logoBase64 && (
                    <img src={logoBase64} alt="logo preview" className="w-16 h-16 object-cover rounded-full border border-slate-800" />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-accent uppercase">Home Banner Upload</label>
                  <div className="flex items-center space-x-3 bg-secondary border border-slate-800 rounded-2xl p-2.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageConversion(e, 'banner')}
                      className="hidden"
                      id="banner-file-input"
                    />
                    <label htmlFor="banner-file-input" className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-950 rounded-full cursor-pointer">
                      Select banner
                    </label>
                  </div>
                  {bannerBase64 && (
                    <img src={bannerBase64} alt="banner preview" className="w-24 h-16 object-cover rounded-lg border border-slate-800" />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full bg-primary text-secondary font-mono font-bold rounded-full py-3 text-xs tracking-wider flex justify-center items-center hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all shadow-md font-mono"
            >
              <Save className="h-4.5 w-4.5 mr-1" />
              <span>{savingSettings ? 'SAVING RESTAURANT SETTINGS...' : 'SAVE STORE CONFIGURATION'}</span>
            </button>
          </form>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded-card p-6 h-fit space-y-4">
          <h3 className="font-serif text-lg font-bold text-white flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Create New Admin</span>
          </h3>

          <form onSubmit={handleRegisterAdmin} className="space-y-4 font-mono text-xs">
            {adminSuccess && (
              <div className="bg-emerald-950/60 border border-emerald-900/50 text-primary p-2.5 rounded-2xl flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>New admin created successfully!</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-accent uppercase">Admin Name</label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="e.g. Kenji Yamaji"
                required
                className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-accent uppercase">Email Address</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="kenji@momoji.com"
                required
                className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-white font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-accent uppercase">Initial Password</label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full bg-secondary border border-slate-800 rounded-full py-2.5 px-4 text-white font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingAdmin}
              className="w-full bg-slate-900 border border-primary/20 text-primary font-bold rounded-full py-2.5 hover:bg-slate-950 transition-colors font-mono"
            >
              {savingAdmin ? 'CREATING...' : 'REGISTER ADMIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
