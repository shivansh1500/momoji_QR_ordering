import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from './shared/api';
import { getSocket } from './shared/socket';
import { LogOut, ClipboardList, Settings, PieChart, Database, Coffee } from 'lucide-react';

// Lazy load pages
const CustomerMenu = lazy(() => import('./customer/CustomerMenu'));
const CustomerCart = lazy(() => import('./customer/CustomerCart'));
const CustomerOrderStatus = lazy(() => import('./customer/CustomerOrderStatus'));

const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminTables = lazy(() => import('./admin/AdminTables'));
const AdminMenu = lazy(() => import('./admin/AdminMenu'));
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));

// Loading Fallback
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-secondary text-primary font-mono">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
    <span className="ml-3 text-sm">LOADING MOMOJI...</span>
  </div>
);

// Admin Auth Layout Wrapper
export const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setAuthenticated(true);
          setAdminUser(response.data.admin);
          // Connect Sockets
          const socket = getSocket();
          socket.connect();
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      const socket = getSocket();
      socket.disconnect();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) return <LoadingFallback />;

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const activeClass = "bg-primary text-secondary font-bold";
  const inactiveClass = "text-accent hover:bg-slate-900 hover:text-white";

  const isRouteActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-secondary text-slate-100 font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-4">
        <div>
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 mb-8 px-2 py-4">
            <Coffee className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-wider text-primary">MOMOJI</h1>
              <p className="font-mono text-[10px] text-accent">Real-time Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link
              to="/admin/orders"
              className={`flex items-center space-x-3 px-4 py-3 rounded-card transition-colors ${
                isRouteActive('/admin/orders') ? activeClass : inactiveClass
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span>Live Orders</span>
            </Link>
            <Link
              to="/admin/tables"
              className={`flex items-center space-x-3 px-4 py-3 rounded-card transition-colors ${
                isRouteActive('/admin/tables') ? activeClass : inactiveClass
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Tables</span>
            </Link>
            <Link
              to="/admin/menu"
              className={`flex items-center space-x-3 px-4 py-3 rounded-card transition-colors ${
                isRouteActive('/admin/menu') ? activeClass : inactiveClass
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Menu Manager</span>
            </Link>
            <Link
              to="/admin/analytics"
              className={`flex items-center space-x-3 px-4 py-3 rounded-card transition-colors ${
                isRouteActive('/admin/analytics') ? activeClass : inactiveClass
              }`}
            >
              <PieChart className="h-5 w-5" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/admin/settings"
              className={`flex items-center space-x-3 px-4 py-3 rounded-card transition-colors ${
                isRouteActive('/admin/settings') ? activeClass : inactiveClass
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Footer profile & logout */}
        <div className="border-t border-slate-900 pt-4 px-2">
          <div className="mb-4">
            <p className="font-serif text-sm font-semibold text-white">{adminUser?.name}</p>
            <p className="font-mono text-[10px] text-accent">{adminUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-card text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

// Customer Layout Wrapper
export const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-secondary text-slate-100 flex flex-col items-center justify-start pb-20 select-none">
      <div className="w-full max-w-md bg-secondary flex flex-col min-h-screen">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export const routesConfig = [
  // Customer Routes
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      { path: '', element: <Navigate to="/menu" replace /> },
      { path: 'menu', element: <CustomerMenu /> },
      { path: 'cart', element: <CustomerCart /> },
      { path: 'order-status/:sessionId', element: <CustomerOrderStatus /> }
    ]
  },
  // Admin Login (outside sidebar)
  {
    path: '/admin/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminLogin />
      </Suspense>
    )
  },
  // Admin Routes (inside sidebar layout)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: <Navigate to="/admin/orders" replace /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'tables', element: <AdminTables /> },
      { path: 'menu', element: <AdminMenu /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'settings', element: <AdminSettings /> }
    ]
  },
  // Catch all
  {
    path: '*',
    element: <Navigate to="/menu" replace />
  }
];
