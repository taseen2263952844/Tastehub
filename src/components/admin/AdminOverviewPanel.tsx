import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Plus,
  Layout,
  FileText,
  Tag,
  Eye,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useApp, formatBDT } from '../../context/AppContext';

export type AdminSectionTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'categories'
  | 'homepage'
  | 'customizer'
  | 'navigation'
  | 'pages'
  | 'posts'
  | 'promotions'
  | 'media'
  | 'storage'
  | 'seo';

interface AdminOverviewPanelProps {
  onNavigateTab: (tab: AdminSectionTab) => void;
  onQuickAddProduct: () => void;
  onPreviewStorefront: () => void;
}

export const AdminOverviewPanel: React.FC<AdminOverviewPanelProps> = ({
  onNavigateTab,
  onQuickAddProduct,
  onPreviewStorefront,
}) => {
  const { orders, products, categories, adminCustomers, cmsPosts } = useApp();
  const [chartDays, setChartDays] = useState<7 | 14>(7);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paidRevenue = activeOrders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter(
      (o) => o.status === 'Pending' || o.paymentStatus === 'Pending Verification'
    ).length;
    const lowStockProducts = products.filter((p) => p.stock <= 5);

    // Unique customer count combining registered profiles + guest order phones
    const phoneOrUid = new Set<string>();
    adminCustomers.forEach((u) => phoneOrUid.add(u.uid || u.email));
    orders.forEach((o) => phoneOrUid.add(o.userId || o.customerPhone));

    return {
      totalRevenue,
      paidRevenue,
      totalOrders: orders.length,
      pendingOrders,
      totalCustomers: Math.max(adminCustomers.length, phoneOrUid.size),
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.isActive).length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    };
  }, [orders, products, adminCustomers]);

  // Daily Sales Chart Data computed from real Firestore orders
  const dailySales = useMemo(() => {
    const days: { dateKey: string; label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateKey, label, revenue: 0, count: 0 });
    }

    const map = new Map(days.map((d) => [d.dateKey, d]));
    orders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      const key = (o.createdAt || '').slice(0, 10);
      const bucket = map.get(key);
      if (bucket) {
        bucket.revenue += o.totalAmount;
        bucket.count += 1;
      }
    });

    const maxRev = Math.max(1, ...days.map((d) => d.revenue));
    return { days, maxRev };
  }, [orders, chartDays]);

  // Recent customer activity derived from real profiles & orders
  const recentCustomerActivity = useMemo(() => {
    const items: { id: string; name: string; subtitle: string; timestamp: string }[] = [];
    orders.slice(0, 5).forEach((o) => {
      items.push({
        id: `ord-${o.id}`,
        name: o.customerName,
        subtitle: `Placed order ${o.orderNumber} (${formatBDT(o.totalAmount)}) · ${o.city}`,
        timestamp: o.createdAt,
      });
    });
    adminCustomers.slice(0, 4).forEach((u) => {
      items.push({
        id: `usr-${u.uid}`,
        name: u.displayName || u.email,
        subtitle: `Customer account · ${u.savedAddresses?.length || 0} saved address(es)`,
        timestamp: u.updatedAt || '',
      });
    });
    return items
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 6);
  }, [orders, adminCustomers]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Total Revenue
          </p>
          <p className="font-mono text-2xl font-semibold text-[#171C19] mt-2 tabular-nums">
            {formatBDT(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-[#6E8774] mt-1">
            Paid: <span className="font-mono tabular-nums">{formatBDT(metrics.paidRevenue)}</span>
          </p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Total Orders
          </p>
          <p className="font-mono text-2xl font-semibold text-[#171C19] mt-2 tabular-nums">
            {metrics.totalOrders}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">All recorded orders</p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Pending Orders
          </p>
          <p className="font-mono text-2xl font-semibold text-[#1B3B2B] mt-2 tabular-nums">
            {metrics.pendingOrders}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">Awaiting action</p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Customers
          </p>
          <p className="font-mono text-2xl font-semibold text-[#171C19] mt-2 tabular-nums">
            {metrics.totalCustomers}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">
            {adminCustomers.length} signed-in accounts
          </p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Products
          </p>
          <p className="font-mono text-2xl font-semibold text-[#171C19] mt-2 tabular-nums">
            {metrics.totalProducts}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">
            {metrics.activeProducts} visible · {categories.length} categories
          </p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Low Stock
          </p>
          <p className="font-mono text-2xl font-semibold text-amber-800 mt-2 tabular-nums">
            {metrics.lowStockCount}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">≤ 5 units remaining</p>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-medium text-[#5C655F]">
          Quick Actions · {cmsPosts.filter((p) => p.status === 'published').length} published posts
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onQuickAddProduct}
            className="px-3.5 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#142D20]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('homepage')}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium text-[#171C19] inline-flex items-center gap-1.5 hover:bg-[#F3F0E8]"
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Homepage Builder</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('posts')}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium text-[#171C19] inline-flex items-center gap-1.5 hover:bg-[#F3F0E8]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Write Post</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('promotions')}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium text-[#171C19] inline-flex items-center gap-1.5 hover:bg-[#F3F0E8]"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promotions</span>
          </button>
          <button
            type="button"
            onClick={onPreviewStorefront}
            className="px-3.5 py-2 rounded-xl bg-[#E9EFEA] border border-[#6E8774]/40 text-xs font-semibold text-[#1B3B2B] inline-flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Site</span>
          </button>
        </div>
      </div>

      {/* Sales Chart + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
                Sales Overview
              </h2>
              <p className="text-xs text-[#5C655F]">
                Daily revenue (BDT) from non-cancelled Firestore orders
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setChartDays(7)}
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  chartDays === 7 ? 'bg-[#1B3B2B] text-[#FAF8F4]' : 'text-[#5C655F]'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setChartDays(14)}
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  chartDays === 14 ? 'bg-[#1B3B2B] text-[#FAF8F4]' : 'text-[#5C655F]'
                }`}
              >
                14 Days
              </button>
            </div>
          </div>

          <div className="h-52 flex items-end gap-2 pt-6 border-b border-[#E4E0D6] pb-2">
            {dailySales.days.map((d) => {
              const pct = Math.max(4, Math.round((d.revenue / dailySales.maxRev) * 100));
              return (
                <div
                  key={d.dateKey}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                  title={`${d.label}: ${formatBDT(d.revenue)} (${d.count} orders)`}
                >
                  <span className="text-[10px] font-mono text-[#5C655F] opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                    {d.revenue > 0 ? formatBDT(d.revenue) : '৳0'}
                  </span>
                  <div
                    className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                      d.revenue > 0 ? 'bg-[#1B3B2B]' : 'bg-[#F3F0E8]'
                    }`}
                    style={{ height: `${d.revenue > 0 ? pct : 6}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-1 text-[10px] text-[#5C655F] font-mono overflow-x-auto">
            {dailySales.days.map((d, idx) => (
              <span key={d.dateKey} className={chartDays === 14 && idx % 2 === 1 ? 'hidden sm:inline' : ''}>
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#171C19] inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Low-Stock Watchlist</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs font-medium text-[#1B3B2B] hover:underline"
            >
              Manage →
            </button>
          </div>

          {metrics.lowStockProducts.length === 0 ? (
            <p className="text-sm text-[#5C655F] py-6 text-center">
              All products have healthy inventory (&gt; 5 units).
            </p>
          ) : (
            <div className="divide-y divide-[#E4E0D6]">
              {metrics.lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-[#171C19] truncate">{p.name}</p>
                    <p className="text-[#5C655F]">{p.categoryName}</p>
                  </div>
                  <span className="font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md tabular-nums shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Recent Customer Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#171C19] inline-flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1B3B2B]" />
              <span>Recent Orders</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-[#1B3B2B] hover:underline inline-flex items-center gap-1"
            >
              <span>All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-[#5C655F] py-8 text-center">
              No orders recorded in Firestore yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E4E0D6]">
              {orders.slice(0, 6).map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-[#171C19]">{o.orderNumber}</p>
                    <p className="text-[#5C655F] truncate">
                      {o.customerName} · {o.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-[#E9EFEA] text-[#1B3B2B] font-medium">
                      {o.status}
                    </span>
                    <span className="font-mono font-semibold text-[#171C19] tabular-nums">
                      {formatBDT(o.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#171C19] inline-flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1B3B2B]" />
              <span>Recent Customer Activity</span>
            </h2>
            <span className="text-xs text-[#5C655F] font-mono tabular-nums">
              {adminCustomers.length} profiles
            </span>
          </div>
          {recentCustomerActivity.length === 0 ? (
            <p className="text-sm text-[#5C655F] py-8 text-center">
              Customer sign-ins and order activity will appear here.
            </p>
          ) : (
            <div className="divide-y divide-[#E4E0D6]">
              {recentCustomerActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#171C19] truncate">{act.name}</p>
                    <p className="text-[#5C655F] mt-0.5">{act.subtitle}</p>
                  </div>
                  {act.timestamp && (
                    <span className="text-[11px] text-[#5C655F] inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
