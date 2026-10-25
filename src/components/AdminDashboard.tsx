import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Clock, 
  Utensils, 
  Plus, 
  Edit3, 
  Eye, 
  EyeOff, 
  Trash2, 
  Search, 
  Phone, 
  MapPin, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Cloud, 
  Github, 
  Flame,
  X,
  FileCode,
  RotateCcw
} from 'lucide-react';
import { useApp, AUTHORIZED_ADMIN_EMAIL, ADMIN_DEMO_PIN } from '../context/AppContext';
import { MenuItem, Order, OrderStatus, MenuCategoryId } from '../types';

export const AdminDashboard: React.FC<{ onOpenDeploymentGuide: () => void }> = ({ 
  onOpenDeploymentGuide 
}) => {
  const { 
    orders, 
    menuItems, 
    updateOrderStatus, 
    addMenuItem, 
    updateMenuItem, 
    toggleDishAvailability, 
    deleteMenuItem, 
    resetToDefaultMenu, 
    adminUser, 
    loginAsAdmin, 
    loginWithGoogleAdmin, 
    logoutAdmin,
    firebaseStatus,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'deployment'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  
  // Passcode login state
  const [passcode, setPasscode] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Edit / Add dish modal states
  const [isEditingDish, setIsEditingDish] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<Partial<MenuItem> | null>(null);

  // If not logged in as authorized admin, show authentication screen
  if (!adminUser || !adminUser.isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">
            TasteHub Admin Portal
          </h2>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            Restricted access. Only verified restaurant management can view private customer orders and modify catalog prices.
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left text-xs mb-6 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Authorized Administrator:</span>
            </div>
            <p className="font-mono text-amber-900 bg-amber-100/70 px-2 py-1 rounded">
              {AUTHORIZED_ADMIN_EMAIL}
            </p>
            <p className="text-[11px] text-stone-500">
              Firebase Security Rules strictly protect order documents to this identity.
            </p>
          </div>

          {/* Login Options */}
          <div className="space-y-3">
            {/* Google Sign-in */}
            <button
              onClick={() => loginWithGoogleAdmin()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold text-xs sm:text-sm text-stone-800 transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google Admin</span>
            </button>

            <div className="relative py-2 flex items-center justify-center">
              <span className="w-full border-t border-stone-200"></span>
              <span className="bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider relative z-10">
                Or Staff Passcode
              </span>
            </div>

            {/* Passcode fallback for preview mode */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const success = await loginAsAdmin(passcode);
              if (!success) setLoginError('Incorrect PIN. For testing demo mode, use PIN: 7890');
            }}>
              <div className="space-y-2">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="Enter Manager PIN (Demo: 7890)"
                  className="w-full text-center tracking-widest text-base font-mono py-2.5 px-3 rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-hidden"
                  maxLength={8}
                />
                {loginError && (
                  <p className="text-xs text-red-500">{loginError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
                >
                  Unlock Admin Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    const matchesSearch = 
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerPhone.includes(orderSearch) ||
      order.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenAddDish = () => {
    setEditingDish({
      name: '',
      bengaliName: '',
      category: 'biryani-rice',
      price: 350,
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
      isAvailable: true,
      spiceLevel: 'Medium',
      prepTimeMinutes: 20,
      portion: '1 Person',
      ingredients: []
    });
    setIsEditingDish(true);
  };

  const handleOpenEditDish = (dish: MenuItem) => {
    setEditingDish({ ...dish });
    setIsEditingDish(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editingDish.name || !editingDish.price) {
      showToast('Name and price are required.');
      return;
    }

    if (editingDish.id) {
      await updateMenuItem(editingDish as MenuItem);
    } else {
      await addMenuItem(editingDish as Omit<MenuItem, 'id'>);
    }
    setIsEditingDish(false);
    setEditingDish(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Admin Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Live Management Session
            </span>
            <span className="text-xs text-stone-500 font-mono hidden sm:inline">
              ({adminUser.email})
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            TasteHub Kitchen & Menu Console
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDeploymentGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Cloud className="w-4 h-4 text-amber-600" />
            <span>Firebase & Cloudflare Status</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors border border-stone-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'menu'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu Dishes ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'deployment'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Deployment & Security Specs</span>
        </button>
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Orders Filters */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    orderStatusFilter === st
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order ID or phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-stone-400" />
              <p className="text-sm">No orders matching this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-300 transition-colors space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-stone-900">
                          #{ord.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : ord.status === 'pending'
                            ? 'bg-amber-100 text-amber-900 font-extrabold'
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-stone-400">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-bold text-stone-900">{ord.customerName}</span>
                        <span>•</span>
                        <a href={`tel:${ord.customerPhone}`} className="text-amber-700 font-medium hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ord.customerPhone}
                        </a>
                        <span>•</span>
                        <span className="uppercase font-bold text-stone-700">
                          {ord.orderType === 'delivery' ? 'Home Delivery' : 'Pickup at Counter'}
                        </span>
                        <span>•</span>
                        <span className="text-stone-500">
                          {ord.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : 'Pay at Counter'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-500 block">Total Payable</span>
                      <span className="font-mono font-black text-xl text-amber-700">
                        ৳{ord.totalAmount} <span className="text-xs font-normal text-stone-500">BDT</span>
                      </span>
                    </div>
                  </div>

                  {/* Delivery address & note */}
                  {ord.orderType === 'delivery' && ord.deliveryAddress && (
                    <div className="text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{ord.deliveryAddress}</span>
                    </div>
                  )}

                  {ord.orderNotes && (
                    <p className="text-xs text-stone-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-200/40">
                      <strong>Customer Note:</strong> {ord.orderNotes}
                    </p>
                  )}

                  {/* Items summary */}
                  <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 text-xs">
                    <span className="font-bold text-stone-600 block mb-1">
                      Ordered Dishes ({ord.itemCount}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ord.items.map((item, i) => (
                        <span key={i} className="bg-white border border-stone-200 px-2 py-1 rounded-md text-stone-800">
                          <strong className="text-amber-700">{item.quantity}×</strong> {item.name} (৳{item.price * item.quantity})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Status Action Buttons */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase text-stone-400">
                      Update Kitchen Status:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ord.status !== 'confirmed' && ord.status !== 'completed' && ord.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'confirmed')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
                        >
                          Confirm
                        </button>
                      )}

                      {ord.status !== 'preparing' && ord.status !== 'completed' && ord.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'preparing')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900"
                        >
                          Cooking in Kitchen
                        </button>
                      )}

                      {ord.orderType === 'delivery' ? (
                        ord.status !== 'out_for_delivery' && ord.status !== 'completed' && ord.status !== 'cancelled' && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-900"
                          >
                            Out for Delivery
                          </button>
                        )
                      ) : (
                        ord.status !== 'ready_for_pickup' && ord.status !== 'completed' && ord.status !== 'cancelled' && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, 'ready_for_pickup')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-900"
                          >
                            Ready for Pickup
                          </button>
                        )
                      )}

                      {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'completed')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Complete / Delivered
                        </button>
                      )}

                      {ord.status !== 'cancelled' && ord.status !== 'completed' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'cancelled')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU DISHES MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Menu Catalog Dishes ({menuItems.length})
              </h3>
              <p className="text-xs text-stone-500">
                Update prices, ingredients, descriptions, or mark dishes as sold out.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetToDefaultMenu}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors"
                title="Reset to original 15 dishes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={handleOpenAddDish}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((dish) => (
              <div
                key={dish.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                  dish.isAvailable ? 'border-stone-200' : 'border-stone-300 opacity-75 bg-stone-50'
                }`}
              >
                <div className="space-y-3">
                  <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        dish.isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {dish.isAvailable ? 'Active' : 'Hidden / Sold Out'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-stone-900 text-base">
                        {dish.name}
                      </h4>
                      <span className="font-mono font-bold text-amber-700 text-sm shrink-0">
                        ৳{dish.price}
                      </span>
                    </div>
                    {dish.bengaliName && (
                      <p className="text-xs text-amber-800 font-medium">{dish.bengaliName}</p>
                    )}
                    <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                      {dish.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleDishAvailability(dish.id)}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      dish.isAvailable 
                        ? 'border-amber-200 text-amber-800 hover:bg-amber-50' 
                        : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    {dish.isAvailable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{dish.isAvailable ? 'Hide / Sold Out' : 'Unhide Dish'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditDish(dish)}
                      className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                      title="Edit dish"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${dish.name}?`)) {
                          deleteMenuItem(dish.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT & FIREBASE STATUS */}
      {activeTab === 'deployment' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
          <div className="max-w-3xl">
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 mb-2">
              Architecture, Firebase & Cloudflare Deployment Guide
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              This app is engineered strictly for static build compliance with Vite (<code className="bg-stone-100 px-1 py-0.5 rounded text-amber-800 font-mono">npm run build</code>) outputting pure HTML/JS/CSS to <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-800 font-mono">dist/</code>. It requires zero Node.js server to run on Cloudflare Pages or Android mobile browsers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold uppercase text-stone-500">1. Firestore Database</span>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${firebaseStatus.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="font-bold text-sm text-stone-900">
                  {firebaseStatus.isConfigured ? 'Connected' : 'Unconfigured (Local Demo)'}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Uses Google Cloud Firestore for persistent dishes and orders with strict security rules.
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold uppercase text-stone-500">2. Static Output (dist/)</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-stone-900">Ready for Cloudflare Pages</span>
              </div>
              <p className="text-xs text-stone-600">
                Pure client-side Single Page App. No server process or Wrangler CLI needed initially.
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold uppercase text-stone-500">3. Admin RBAC Guard</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-stone-900">Authorized: bdtaseengaming</span>
              </div>
              <p className="text-xs text-stone-600">
                Visitors can never read order records or mutate order statuses.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenDeploymentGuide}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
            >
              <FileCode className="w-4 h-4" />
              <span>View Step-by-Step GitHub & Cloudflare Pages Guide</span>
            </button>
          </div>
        </div>
      )}

      {/* Dish Add/Edit Modal */}
      {isEditingDish && editingDish && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {editingDish.id ? 'Edit Menu Dish' : 'Add New Restaurant Dish'}
              </h3>
              <button
                onClick={() => {
                  setIsEditingDish(false);
                  setEditingDish(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Dish Name (English)</label>
                <input
                  type="text"
                  required
                  value={editingDish.name || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  placeholder="e.g. Dhaka Kacchi Biryani"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Bengali Name</label>
                <input
                  type="text"
                  value={editingDish.bengaliName || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, bengaliName: e.target.value })}
                  placeholder="e.g. ঢাকা কাচ্চি বিরিয়ানি"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={editingDish.category || 'biryani-rice'}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="biryani-rice">Biryani & Rice</option>
                    <option value="curries">Traditional Curries</option>
                    <option value="kebabs-bites">Kebabs & Grills</option>
                    <option value="appetizers">Appetizers & Bites</option>
                    <option value="desserts-drinks">Drinks & Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Price (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={editingDish.price || 0}
                    onChange={(e) => setEditingDish({ ...editingDish, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={editingDish.imageUrl || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingDish.description || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  placeholder="Appetizing description of spices, cooking style, and meat cuts..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Spice Rating</label>
                  <select
                    value={editingDish.spiceLevel || 'Medium'}
                    onChange={(e) => setEditingDish({ ...editingDish, spiceLevel: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Spicy">Spicy</option>
                    <option value="Extra Spicy">Extra Spicy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={editingDish.prepTimeMinutes || 20}
                    onChange={(e) => setEditingDish({ ...editingDish, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDish(false);
                    setEditingDish(null);
                  }}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
