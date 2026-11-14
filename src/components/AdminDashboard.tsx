import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  Layers,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Database,
  LogOut,
  Search,
  AlertCircle,
  BarChart3,
  Layout,
  Palette,
  Menu as MenuIcon,
  X,
  FileText,
  BookOpen,
  Tag,
  Image as ImageIcon,
  Globe,
  Eye,
  Rocket,
  RotateCcw,
  History,
  CheckCircle2,
  Navigation,
  HardDrive,
  PlugZap,
} from 'lucide-react';
import {
  useApp,
  formatBDT,
  AUTHORIZED_ADMIN_EMAIL,
} from '../context/AppContext';
import {
  Product,
  ProductVariation,
  Category,
  Order,
  OrderStatus,
  PaymentStatus,
  CategorySlug,
} from '../types';
import { uploadAssetWithPath } from '../services/firebase';
import { AdminOverviewPanel, AdminSectionTab } from './admin/AdminOverviewPanel';
import { WebsiteCustomizerPanel } from './admin/WebsiteCustomizerPanel';
import { HomepageBuilderPanel } from './admin/HomepageBuilderPanel';
import {
  PostsManagerPanel,
  PagesManagerPanel,
  NavigationManagerPanel,
} from './admin/CmsContentPanels';
import {
  PromotionsPanel,
  MediaLibraryPanel,
  SeoSettingsPanel,
} from './admin/MarketingMediaSeoPanels';
import { MediaPickerModal } from './admin/MediaPickerModal';
import { StorageManagementPanel } from './admin/StorageManagementPanel';
import { SupplierIntegrationsPanel } from './admin/SupplierIntegrationsPanel';
import { ConfirmDeleteModal } from './admin/ConfirmDeleteModal';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'Unpaid',
  'Pending Verification',
  'Paid',
  'Refunded',
];

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    setIsAuthModalOpen,
    loginWithGoogle,
    logout,
    products,
    categories,
    orders,
    isFirestoreCatalogActive,
    seedCatalogToFirestore,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveMediaAsset,
    updateOrder,
    deleteOrder,
    deleteOrdersBulk,
    draftSections,
    setActiveView,
    setIsPreviewMode,
    hasUnpublishedChanges,
    websiteVersions,
    publishWebsiteChanges,
    discardDraftChanges,
    restoreVersionToDraft,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminSectionTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Publish & Version History Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishLabel, setPublishLabel] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Orders State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  // Product Editor State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productImageUrlInput, setProductImageUrlInput] = useState('');
  const [productTagInput, setProductTagInput] = useState('');
  const [productMediaOpen, setProductMediaOpen] = useState(false);

  // Category Editor State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryMediaOpen, setCategoryMediaOpen] = useState(false);

  // Shared Delete Confirmation State
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'order'; order: Order }
    | { kind: 'orders_bulk'; orders: Order[] }
    | { kind: 'product'; product: Product }
    | { kind: 'category'; category: Category }
    | null
  >(null);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
      if (q) {
        const hay =
          `${o.orderNumber} ${o.customerName} ${o.customerPhone} ${o.city} ${o.paymentReference || ''} ${o.promoCode || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) =>
      q ? `${p.name} ${p.sku} ${p.categoryName}`.toLowerCase().includes(q) : true
    );
  }, [products, productSearch]);

  const historySnapshots = useMemo(
    () =>
      websiteVersions
        .filter((v) => v.id !== 'draft' && v.id !== 'published')
        .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '')),
    [websiteVersions]
  );

  const viewingOrder = useMemo(
    () => (viewingOrderId ? orders.find((o) => o.id === viewingOrderId) || null : null),
    [orders, viewingOrderId]
  );

  const allFilteredOrdersSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFilteredOrders = () => {
    if (allFilteredOrdersSelected) {
      const filteredSet = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const next = new Set(selectedOrderIds);
      filteredOrders.forEach((o) => next.add(o.id));
      setSelectedOrderIds(Array.from(next));
    }
  };

  // ---------------- AUTH GATE ----------------

  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white border border-[#E4E0D6] rounded-3xl p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#E9EFEA] text-[#1B3B2B] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E8774] font-semibold">
              Protected Store Operations & CMS
            </p>
            <h1 className="font-serif text-3xl font-semibold text-[#171C19]">
              VEYRA Admin Console
            </h1>
            <p className="text-sm text-[#5C655F] leading-relaxed">
              Access to orders, payment verification, inventory, and the visual website builder is enforced by Cloud Firestore Security Rules.
            </p>
          </div>

          {currentUser && !isAdmin && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Account Not Authorized for Admin</span>
              </div>
              <p>
                Signed in as <strong>{currentUser.email}</strong>. Sign in with the verified store administrator account (
                <span className="font-mono">{AUTHORIZED_ADMIN_EMAIL}</span>) or an account registered in{' '}
                <span className="font-mono">/admins/&#123;uid&#125;</span>.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {!currentUser ? (
              <>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20] transition-colors"
                >
                  Sign In with Authorized Google Account
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-[#171C19] text-sm font-medium hover:bg-[#E9EFEA] transition-colors"
                >
                  Sign In with Email & Password
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20]"
              >
                Sign Out & Switch Account
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- HANDLERS ----------------

  const handleSeedCatalog = async () => {
    setSeeding(true);
    try {
      await seedCatalogToFirestore();
    } catch (err: any) {
      showToast(err?.message || 'Failed to sync catalog to Firestore.');
    } finally {
      setSeeding(false);
    }
  };

  const handlePreviewStorefront = () => {
    setIsPreviewMode(true);
    setActiveView('home');
    showToast('Viewing Admin Draft preview on storefront');
  };

  const handleConfirmPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await publishWebsiteChanges(publishLabel);
      setPublishLabel('');
      setIsPublishModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to publish changes.');
    } finally {
      setPublishing(false);
    }
  };

  const openNewProductForm = () => {
    const defaultCat = categories[0];
    setEditingProduct({
      id: `veyra-prod-${Date.now().toString().slice(-6)}`,
      name: '',
      slug: '',
      categoryId: (defaultCat?.slug || 'electronics-gadgets') as Exclude<CategorySlug, 'all'>,
      categoryName: defaultCat?.name || 'Electronics & Gadgets',
      price: 1500,
      compareAtPrice: undefined,
      shortDescription: '',
      description: '',
      images: [],
      stock: 15,
      sku: `VY-${Math.floor(100 + Math.random() * 900)}`,
      variations: [],
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      popularityScore: 80,
      isActive: true,
      tags: [],
      seoTitle: '',
      seoDescription: '',
    });
    setProductImageUrlInput('');
    setProductTagInput('');
    setIsProductFormOpen(true);
    setActiveTab('products');
  };

  const openEditProductForm = (p: Product) => {
    setEditingProduct({
      ...p,
      variations: [...(p.variations || [])],
      images: [...(p.images || [])],
      tags: [...(p.tags || [])],
    });
    setProductImageUrlInput('');
    setProductTagInput('');
    setIsProductFormOpen(true);
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImage(true);
    try {
      const { url, storagePath } = await uploadAssetWithPath(file, 'products');
      await saveMediaAsset({
        id: `media-${Date.now()}`,
        name: editingProduct.name || file.name,
        url,
        folder: 'products',
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath,
        uploadedBy: currentUser.email,
        createdAt: new Date().toISOString(),
      });
      setEditingProduct({
        ...editingProduct,
        images: [...editingProduct.images, url],
      });
      showToast('Uploaded & registered in Media Library');
    } catch (err: any) {
      showToast(
        err?.message || 'Storage upload failed. Pick from Media Library or paste an HTTPS URL.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const cat = categories.find((c) => c.slug === editingProduct.categoryId);
    const slug =
      editingProduct.slug.trim() ||
      editingProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    await saveProduct({
      ...editingProduct,
      slug,
      categoryName: cat ? cat.name : editingProduct.categoryName,
    });
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  const addVariationRow = () => {
    if (!editingProduct) return;
    const nextVar: ProductVariation = {
      id: `var-${Date.now().toString().slice(-5)}`,
      type: 'Option',
      name: 'Standard',
      priceAdjustment: 0,
      stock: editingProduct.stock || 10,
    };
    setEditingProduct({
      ...editingProduct,
      variations: [...editingProduct.variations, nextVar],
    });
  };

  const navGroups: {
    group: string;
    items: { id: AdminSectionTab; label: string; icon: any; badge?: string | number }[];
  }[] = [
    {
      group: 'Commerce',
      items: [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
        { id: 'products', label: 'Products', icon: Package, badge: products.length },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'suppliers', label: 'Supplier Integrations', icon: PlugZap },
      ],
    },
    {
      group: 'Visual Storefront CMS',
      items: [
        { id: 'homepage', label: 'Homepage Builder', icon: Layout },
        { id: 'customizer', label: 'Website Customizer', icon: Palette },
        { id: 'navigation', label: 'Navigation Menus', icon: Navigation },
        { id: 'pages', label: 'Custom Pages', icon: FileText },
        { id: 'posts', label: 'Posts & Journal', icon: BookOpen },
      ],
    },
    {
      group: 'Growth & Assets',
      items: [
        { id: 'promotions', label: 'Promotions & Subscribers', icon: Tag },
        { id: 'media', label: 'Media Library', icon: ImageIcon },
        { id: 'storage', label: 'Storage Management', icon: HardDrive },
        { id: 'seo', label: 'SEO & Sitemaps', icon: Globe },
      ],
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#E4E0D6]">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6E8774] font-semibold">
          VEYRA Workspace
        </p>
        <p className="font-serif text-xl font-semibold text-[#171C19] mt-0.5">
          Admin & Visual CMS
        </p>
        <p className="text-[11px] text-[#5C655F] truncate mt-0.5">{currentUser.email}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <p className="px-3 text-[10px] uppercase tracking-[0.16em] text-[#5C655F] font-semibold">
              {grp.group}
            </p>
            {grp.items.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-[#1B3B2B] text-[#FAF8F4]'
                      : 'text-[#171C19] hover:bg-[#F3F0E8]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F3F0E8] text-[#5C655F]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E4E0D6] space-y-2">
        <button
          type="button"
          disabled={seeding}
          onClick={handleSeedCatalog}
          className="w-full px-3 py-2 rounded-xl bg-[#E9EFEA] border border-[#6E8774]/40 text-[#1B3B2B] text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <Database className="w-3.5 h-3.5" />
          <span>
            {seeding
              ? 'Syncing...'
              : isFirestoreCatalogActive
              ? 'Resync Seed Data'
              : 'Initialize Firestore CMS'}
          </span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#F3F0E8] inline-flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F4]">
      <div className="max-w-[1440px] mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-[#E4E0D6] sticky top-16 h-[calc(100vh-4rem)]">
          {renderSidebarContent()}
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-[#E4E0D6] z-10">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#F3F0E8] text-[#171C19]"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 min-w-0">
          {/* Workspace Publishing & Preview Topbar */}
          <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E0D6] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-[#171C19]"
                aria-label="Open Admin Menu"
              >
                <MenuIcon className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#171C19] capitalize">
                    {activeTab.replace('_', ' ')}
                  </span>
                  {hasUnpublishedChanges ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                      Unpublished Draft Changes
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-[#E9EFEA] text-[#1B3B2B] text-[11px] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Live Synced
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePreviewStorefront}
                className="px-3.5 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#E9EFEA] inline-flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Draft</span>
              </button>

              {hasUnpublishedChanges && (
                <button
                  type="button"
                  onClick={discardDraftChanges}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-medium text-[#5C655F] hover:text-red-700 inline-flex items-center gap-1"
                  title="Discard unpublished draft changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Discard Draft</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20] inline-flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Publish Live</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {!isFirestoreCatalogActive && (
              <div className="p-4 rounded-2xl bg-[#F3F0E8] border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#171C19]">
                <span>
                  Firestore catalog is not initialized yet — click{' '}
                  <strong>Initialize Firestore CMS</strong> in the sidebar to persist all products, sections, menus, pages, posts, and promotions to Cloud Firestore.
                </span>
              </div>
            )}

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <AdminOverviewPanel
                onNavigateTab={setActiveTab}
                onQuickAddProduct={openNewProductForm}
                onPreviewStorefront={handlePreviewStorefront}
              />
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#5C655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order #, customer name, phone, promo, or TrxID..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-sm"
                    />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-[#E4E0D6] text-sm"
                  >
                    <option value="ALL">All Statuses</option>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bulk Selection Toolbar */}
                {filteredOrders.length > 0 && (
                  <div className="bg-white border border-[#E4E0D6] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#171C19] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allFilteredOrdersSelected}
                        onChange={toggleSelectAllFilteredOrders}
                      />
                      <span>Select All ({filteredOrders.length} shown)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {selectedOrderIds.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderIds([])}
                            className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] text-xs text-[#5C655F] hover:text-[#171C19]"
                          >
                            Clear ({selectedOrderIds.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const targets = orders.filter((o) =>
                                selectedOrderIds.includes(o.id)
                              );
                              if (targets.length > 0) {
                                setPendingDelete({ kind: 'orders_bulk', orders: targets });
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Selected ({selectedOrderIds.length})</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {filteredOrders.length === 0 ? (
                  <div className="bg-white border border-[#E4E0D6] rounded-2xl p-10 text-center text-sm text-[#5C655F]">
                    No matching orders found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const isSelected = selectedOrderIds.includes(order.id);
                      return (
                        <div
                          key={order.id}
                          className={`bg-white border rounded-2xl p-5 sm:p-6 space-y-4 transition-colors ${
                            isSelected ? 'border-[#1B3B2B] ring-1 ring-[#1B3B2B]/20' : 'border-[#E4E0D6]'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-[#E4E0D6]">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOrderSelection(order.id)}
                                className="mt-1.5"
                                aria-label={`Select order ${order.orderNumber}`}
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="font-mono text-base font-semibold text-[#171C19]">
                                    {order.orderNumber}
                                  </span>
                                  <span className="text-xs text-[#5C655F]">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </span>
                                  {order.promoCode && (
                                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#E9EFEA] text-[#1B3B2B]">
                                      Promo: {order.promoCode} (-{formatBDT(order.discountAmount || 0)})
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-[#171C19] mt-1">
                                  {order.customerName} · {order.customerPhone}
                                </p>
                                <p className="text-xs text-[#5C655F]">
                                  {order.deliveryAddress}, {order.area}, {order.city}
                                </p>
                                {order.deliveryInstructions && (
                                  <p className="text-xs text-[#6E8774] mt-1">
                                    Note: {order.deliveryInstructions}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right space-y-1.5">
                              <p className="font-mono text-lg font-semibold text-[#1B3B2B] tabular-nums">
                                {formatBDT(order.totalAmount)}
                              </p>
                              <p className="text-xs text-[#5C655F]">
                                {order.paymentMethod === 'cash_on_delivery'
                                  ? 'Cash on Delivery'
                                  : order.paymentMethod === 'bkash_manual'
                                  ? 'bKash Manual'
                                  : 'Nagad Manual'}
                              </p>
                              {order.paymentReference && (
                                <p className="font-mono text-xs bg-[#F3F0E8] px-2 py-0.5 rounded inline-block text-[#171C19]">
                                  Ref: {order.paymentReference}
                                </p>
                              )}
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setViewingOrderId(order.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#F3F0E8] inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete({ kind: 'order', order })}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 inline-flex items-center gap-1"
                                  aria-label={`Delete order ${order.orderNumber}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-[#5C655F]">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {item.productName}
                                  {item.variationLabel ? ` (${item.variationLabel})` : ''} ×{' '}
                                  {item.quantity}
                                </span>
                                <span className="font-mono tabular-nums">
                                  {formatBDT(item.lineTotal)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-[#E4E0D6] grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                              <label className="block text-[11px] uppercase tracking-wider text-[#5C655F] mb-1">
                                Fulfillment Status
                              </label>
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  updateOrder(order.id, {
                                    status: e.target.value as OrderStatus,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] uppercase tracking-wider text-[#5C655F] mb-1">
                                Payment Status
                              </label>
                              <select
                                value={order.paymentStatus}
                                onChange={(e) =>
                                  updateOrder(order.id, {
                                    paymentStatus: e.target.value as PaymentStatus,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                              >
                                {PAYMENT_STATUSES.map((ps) => (
                                  <option key={ps} value={ps}>
                                    {ps}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={noteDrafts[order.id] ?? order.adminNotes ?? ''}
                                onChange={(e) =>
                                  setNoteDrafts((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                placeholder="Internal courier / verification note"
                                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrder(order.id, {
                                    adminNotes:
                                      noteDrafts[order.id] ?? order.adminNotes ?? '',
                                  })
                                }
                                className="px-3.5 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium shrink-0"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
                      Product Catalog ({products.length})
                    </h2>
                    <p className="text-xs text-[#5C655F] mt-0.5">
                      Manage pricing, stock, variations, storefront visibility flags, Media Library photos, and product SEO.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#5C655F] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Filter products..."
                        className="pl-8 pr-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openNewProductForm}
                      className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>

                {isProductFormOpen && editingProduct && (
                  <form
                    onSubmit={handleSaveProductSubmit}
                    className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
                      <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                        {editingProduct.name ? `Edit: ${editingProduct.name}` : 'New Product'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsProductFormOpen(false)}
                        className="text-xs text-[#5C655F] hover:text-[#171C19]"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, name: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Category *
                        </label>
                        <select
                          value={editingProduct.categoryId}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              categoryId: e.target.value as Exclude<CategorySlug, 'all'>,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Price (৳ BDT) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={editingProduct.price}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Compare-At Price
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editingProduct.compareAtPrice || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              compareAtPrice: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Stock *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={editingProduct.stock}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              stock: Number(e.target.value),
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={editingProduct.sku}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, sku: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Short Summary
                        </label>
                        <input
                          type="text"
                          value={editingProduct.shortDescription}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              shortDescription: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          URL Slug
                        </label>
                        <input
                          type="text"
                          value={editingProduct.slug}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, slug: e.target.value })
                          }
                          placeholder="auto-generated if empty"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#5C655F] mb-1">
                        Full Description *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                      />
                    </div>

                    {/* Product Images: Media Library + Upload + URL */}
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-[#5C655F]">
                        Product Images
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {editingProduct.images.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative w-20 h-20 rounded-xl border border-[#E4E0D6] overflow-hidden bg-[#F3F0E8]"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  images: editingProduct.images.filter(
                                    (_, i) => i !== idx
                                  ),
                                })
                              }
                              className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px]"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setProductMediaOpen(true)}
                          className="px-4 py-2 rounded-xl bg-[#E9EFEA] border border-[#6E8774]/40 text-xs font-semibold text-[#1B3B2B] inline-flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Choose from Media Library</span>
                        </button>
                        <label className="px-4 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 hover:bg-[#E9EFEA]">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={handleUploadProductImage}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="url"
                          value={productImageUrlInput}
                          onChange={(e) => setProductImageUrlInput(e.target.value)}
                          placeholder="Or paste HTTPS image URL..."
                          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!productImageUrlInput.trim()) return;
                            setEditingProduct({
                              ...editingProduct,
                              images: [
                                ...editingProduct.images,
                                productImageUrlInput.trim(),
                              ],
                            });
                            setProductImageUrlInput('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-medium"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Variations */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[#5C655F]">
                          Variations (Size / Color / Edition)
                        </label>
                        <button
                          type="button"
                          onClick={addVariationRow}
                          className="text-xs font-semibold text-[#1B3B2B] hover:underline"
                        >
                          + Add Variation
                        </button>
                      </div>
                      {editingProduct.variations.map((v, idx) => (
                        <div
                          key={v.id}
                          className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center"
                        >
                          <input
                            type="text"
                            value={v.type}
                            onChange={(e) => {
                              const next = [...editingProduct.variations];
                              next[idx] = { ...v, type: e.target.value };
                              setEditingProduct({ ...editingProduct, variations: next });
                            }}
                            placeholder="Type (Color)"
                            className="px-2.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                          />
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => {
                              const next = [...editingProduct.variations];
                              next[idx] = { ...v, name: e.target.value };
                              setEditingProduct({ ...editingProduct, variations: next });
                            }}
                            placeholder="Name (Sage)"
                            className="px-2.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                          />
                          <input
                            type="number"
                            value={v.priceAdjustment}
                            onChange={(e) => {
                              const next = [...editingProduct.variations];
                              next[idx] = {
                                ...v,
                                priceAdjustment: Number(e.target.value),
                              };
                              setEditingProduct({ ...editingProduct, variations: next });
                            }}
                            placeholder="Price +/-"
                            className="px-2.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                          />
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => {
                              const next = [...editingProduct.variations];
                              next[idx] = { ...v, stock: Number(e.target.value) };
                              setEditingProduct({ ...editingProduct, variations: next });
                            }}
                            placeholder="Stock"
                            className="px-2.5 py-2 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                variations: editingProduct.variations.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                            className="text-xs text-red-700 hover:underline text-left px-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Tags & SEO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E4E0D6]">
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Tags
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={productTagInput}
                            onChange={(e) => setProductTagInput(e.target.value)}
                            placeholder="Add tag..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!productTagInput.trim()) return;
                              setEditingProduct({
                                ...editingProduct,
                                tags: [...editingProduct.tags, productTagInput.trim()],
                              });
                              setProductTagInput('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-xs"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {editingProduct.tags.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-[#F3F0E8] text-[11px] inline-flex items-center gap-1"
                            >
                              {t}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    tags: editingProduct.tags.filter(
                                      (_, idx) => idx !== i
                                    ),
                                  })
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Product SEO Title
                        </label>
                        <input
                          type="text"
                          value={editingProduct.seoTitle || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              seoTitle: e.target.value,
                            })
                          }
                          placeholder="Custom Google Search Title"
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Product SEO Description
                        </label>
                        <input
                          type="text"
                          value={editingProduct.seoDescription || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              seoDescription: e.target.value,
                            })
                          }
                          placeholder="Meta description for search results"
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                        />
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-5 pt-2 text-xs text-[#171C19]">
                      {[
                        { key: 'isActive', label: 'Visible on Storefront' },
                        { key: 'isFeatured', label: 'Featured' },
                        { key: 'isNewArrival', label: 'New Arrival' },
                        { key: 'isBestSeller', label: 'Best Seller' },
                      ].map((flag) => (
                        <label
                          key={flag.key}
                          className="inline-flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean((editingProduct as any)[flag.key])}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                [flag.key]: e.target.checked,
                              })
                            }
                          />
                          <span>{flag.label}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-sm font-medium hover:bg-[#142D20]"
                    >
                      Save Product to Firestore
                    </button>
                  </form>
                )}

                <div className="bg-white border border-[#E4E0D6] rounded-2xl divide-y divide-[#E4E0D6]">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] overflow-hidden shrink-0">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#171C19] truncate">
                              {product.name}
                            </p>
                            {product.supplierName && (
                              <span className="px-1.5 py-0.5 rounded bg-[#E9EFEA] text-[#1B3B2B] font-mono text-[10px] font-medium">
                                {product.supplierName}
                                {product.supplierProductId ? ` #${product.supplierProductId}` : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5C655F]">
                            {product.categoryName} · Stock:{' '}
                            <span className="font-mono">{product.stock}</span> ·{' '}
                            {product.isActive ? 'Published' : 'Draft (Hidden)'}
                            {product.supplierPrice !== undefined && (
                              <> · Supplier Cost: <span className="font-mono">{formatBDT(product.supplierPrice)}</span></>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-[#171C19] tabular-nums">
                          {formatBDT(product.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditProductForm(product)}
                          className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ kind: 'product', product })}
                          className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
                      Product Categories
                    </h2>
                    <p className="text-xs text-[#5C655F] mt-0.5">
                      Organize product taxonomy and storefront collection thumbnails.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCategory({
                        id: `cat-${Date.now().toString().slice(-5)}`,
                        name: '',
                        slug: '',
                        description: '',
                        imageUrl: '',
                        displayOrder: categories.length + 1,
                        isActive: true,
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>

                {editingCategory && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await saveCategory(editingCategory);
                      setEditingCategory(null);
                    }}
                    className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCategory.name}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Slug *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCategory.slug}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              slug: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Order
                        </label>
                        <input
                          type="number"
                          value={editingCategory.displayOrder}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              displayOrder: Number(e.target.value),
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editingCategory.description}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5C655F] mb-1">
                          Category Image URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={editingCategory.imageUrl || ''}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                imageUrl: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setCategoryMediaOpen(true)}
                            className="px-3 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium"
                          >
                            Media
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium"
                      >
                        Save Category
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-xs text-[#5C655F]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {c.imageUrl && (
                          <img
                            src={c.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-[#E4E0D6] shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#171C19] truncate">{c.name}</p>
                          <p className="text-xs text-[#5C655F] font-mono">{c.slug}</p>
                          <p className="text-xs text-[#5C655F] mt-0.5 truncate">
                            {c.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(c)}
                          className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#1B3B2B]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ kind: 'category', category: c })}
                          className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                          aria-label={`Delete category ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUPPLIER INTEGRATIONS & VISUAL CMS MODULES */}
            {activeTab === 'suppliers' && <SupplierIntegrationsPanel />}
            {activeTab === 'homepage' && <HomepageBuilderPanel />}
            {activeTab === 'customizer' && <WebsiteCustomizerPanel />}
            {activeTab === 'navigation' && <NavigationManagerPanel />}
            {activeTab === 'pages' && <PagesManagerPanel />}
            {activeTab === 'posts' && <PostsManagerPanel />}
            {activeTab === 'promotions' && <PromotionsPanel />}
            {activeTab === 'media' && <MediaLibraryPanel />}
            {activeTab === 'storage' && <StorageManagementPanel />}
            {activeTab === 'seo' && <SeoSettingsPanel />}
          </div>
        </div>
      </div>

      {/* Publish Confirmation & Version History Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="font-serif text-2xl font-semibold text-[#171C19] inline-flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#1B3B2B]" />
                <span>Publish Website Changes</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg text-[#5C655F] hover:text-[#171C19]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPublish} className="space-y-4">
              <p className="text-xs text-[#5C655F] leading-relaxed">
                Publishing updates the live public storefront immediately with your current draft theme, header/footer customizer, navigation menus, and homepage builder layout, while saving a timestamped snapshot you can restore later.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  Version Note / Release Label (optional)
                </label>
                <input
                  type="text"
                  value={publishLabel}
                  onChange={(e) => setPublishLabel(e.target.value)}
                  placeholder="e.g. Eid Campaign Layout + Sage Theme"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E4E0D6] text-xs font-medium text-[#171C19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20] disabled:opacity-60"
                >
                  {publishing ? 'Publishing Live...' : 'Confirm & Publish Live'}
                </button>
              </div>
            </form>

            {/* Version History */}
            <div className="pt-4 border-t border-[#E4E0D6] space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#6E8774] inline-flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Saved Version History ({historySnapshots.length})</span>
              </h4>
              {historySnapshots.length === 0 ? (
                <p className="text-xs text-[#5C655F]">
                  No prior published versions saved yet. Your first publish will create a restore point.
                </p>
              ) : (
                <div className="divide-y divide-[#E4E0D6] max-h-52 overflow-y-auto">
                  {historySnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#171C19] truncate">
                          {snap.versionLabel}
                        </p>
                        <p className="text-[11px] text-[#5C655F]">
                          {snap.publishedAt
                            ? new Date(snap.publishedAt).toLocaleString()
                            : ''}{' '}
                          {snap.publishedBy ? `· ${snap.publishedBy}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await restoreVersionToDraft(snap);
                          setIsPublishModalOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-[11px] font-medium hover:bg-[#E9EFEA] shrink-0"
                      >
                        Restore to Draft
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={productMediaOpen}
        onClose={() => setProductMediaOpen(false)}
        defaultFolder="products"
        title="Add Product Image"
        onSelect={(url) => {
          if (editingProduct) {
            setEditingProduct({
              ...editingProduct,
              images: [...editingProduct.images, url],
            });
          }
        }}
      />

      <MediaPickerModal
        isOpen={categoryMediaOpen}
        onClose={() => setCategoryMediaOpen(false)}
        defaultFolder="general"
        title="Select Category Image"
        onSelect={(url) => {
          if (editingCategory) {
            setEditingCategory({ ...editingCategory, imageUrl: url });
          }
        }}
      />

      {/* Order Details Modal */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingOrderId(null)}
        >
          <div
            className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E4E0D6]">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#6E8774] font-semibold">
                  Order Record
                </p>
                <h3 className="font-mono text-2xl font-semibold text-[#171C19] mt-0.5">
                  {viewingOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#5C655F] mt-0.5">
                  Placed {new Date(viewingOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrderId(null)}
                className="p-1.5 rounded-lg text-[#5C655F] hover:text-[#171C19]"
                aria-label="Close order details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-1">
                <p className="font-semibold text-[#171C19] text-sm">Customer & Delivery</p>
                <p className="text-[#171C19] font-medium">{viewingOrder.customerName}</p>
                <p className="font-mono text-[#5C655F]">{viewingOrder.customerPhone}</p>
                {viewingOrder.customerEmail && (
                  <p className="text-[#5C655F]">{viewingOrder.customerEmail}</p>
                )}
                <p className="text-[#5C655F] pt-1">
                  {viewingOrder.deliveryAddress}, {viewingOrder.area}, {viewingOrder.city}
                </p>
                {viewingOrder.deliveryInstructions && (
                  <p className="text-[#6E8774] pt-1">
                    Instructions: {viewingOrder.deliveryInstructions}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-2">
                <p className="font-semibold text-[#171C19] text-sm">Payment & Totals</p>
                <div className="flex justify-between">
                  <span className="text-[#5C655F]">Method</span>
                  <span className="font-medium text-[#171C19]">
                    {viewingOrder.paymentMethod === 'cash_on_delivery'
                      ? 'Cash on Delivery'
                      : viewingOrder.paymentMethod === 'bkash_manual'
                      ? 'bKash Manual'
                      : 'Nagad Manual'}
                  </span>
                </div>
                {viewingOrder.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-[#5C655F]">Reference / TrxID</span>
                    <span className="font-mono text-[#171C19]">{viewingOrder.paymentReference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5C655F]">Subtotal</span>
                  <span className="font-mono">{formatBDT(viewingOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C655F]">Delivery Fee</span>
                  <span className="font-mono">{formatBDT(viewingOrder.deliveryFee)}</span>
                </div>
                {viewingOrder.discountAmount ? (
                  <div className="flex justify-between text-[#1B3B2B]">
                    <span>Discount ({viewingOrder.promoCode})</span>
                    <span className="font-mono">-{formatBDT(viewingOrder.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-[#E4E0D6] font-semibold text-sm text-[#1B3B2B]">
                  <span>Total Amount</span>
                  <span className="font-mono">{formatBDT(viewingOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-[#E4E0D6] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#FAF8F4] border-b border-[#E4E0D6] text-xs font-semibold text-[#171C19]">
                Order Items ({viewingOrder.itemCount})
              </div>
              <div className="divide-y divide-[#E4E0D6]">
                {viewingOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E4E0D6] shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#171C19] truncate">{item.productName}</p>
                        <p className="text-[#5C655F]">
                          {item.variationLabel ? `${item.variationLabel} · ` : ''}
                          {formatBDT(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#171C19] tabular-nums shrink-0">
                      {formatBDT(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inline Status Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#5C655F] mb-1">
                  Fulfillment Status
                </label>
                <select
                  value={viewingOrder.status}
                  onChange={(e) =>
                    updateOrder(viewingOrder.id, { status: e.target.value as OrderStatus })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#5C655F] mb-1">
                  Payment Status
                </label>
                <select
                  value={viewingOrder.paymentStatus}
                  onChange={(e) =>
                    updateOrder(viewingOrder.id, {
                      paymentStatus: e.target.value as PaymentStatus,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
                >
                  {PAYMENT_STATUSES.map((ps) => (
                    <option key={ps} value={ps}>
                      {ps}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E4E0D6]">
              <button
                type="button"
                onClick={() =>
                  setPendingDelete({ kind: 'order', order: viewingOrder })
                }
                className="px-4 py-2.5 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order Permanently</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingOrderId(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#FAF8F4]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={
          pendingDelete?.kind === 'order'
            ? 'Delete Order Permanently?'
            : pendingDelete?.kind === 'orders_bulk'
            ? 'Delete Selected Orders Permanently?'
            : pendingDelete?.kind === 'product'
            ? 'Delete Product?'
            : 'Delete Product Category?'
        }
        itemLabel={
          pendingDelete?.kind === 'order'
            ? `Order ${pendingDelete.order.orderNumber} (${pendingDelete.order.customerName} · ${formatBDT(pendingDelete.order.totalAmount)})`
            : pendingDelete?.kind === 'orders_bulk'
            ? `${pendingDelete.orders.length} selected order(s): ${pendingDelete.orders
                .slice(0, 4)
                .map((o) => o.orderNumber)
                .join(', ')}${pendingDelete.orders.length > 4 ? '...' : ''}`
            : pendingDelete?.kind === 'product'
            ? pendingDelete.product.name
            : pendingDelete?.kind === 'category'
            ? `${pendingDelete.category.name} (${pendingDelete.category.slug})`
            : ''
        }
        description={
          pendingDelete?.kind === 'order'
            ? 'This permanently removes the order and its subcollections from Cloud Firestore and updates dashboard analytics immediately.'
            : pendingDelete?.kind === 'orders_bulk'
            ? 'All selected orders and their subcollections will be permanently erased from Cloud Firestore.'
            : pendingDelete?.kind === 'product'
            ? 'Permanently deletes this product from Cloud Firestore, removes homepage section references, and cleans up any unreferenced uploaded product images.'
            : 'Permanently removes this category from Cloud Firestore and cleans up any unreferenced uploaded category image.'
        }
        warningText={
          pendingDelete?.kind === 'category'
            ? (() => {
                const usedCount = products.filter(
                  (p) => p.categoryId === pendingDelete.category.slug
                ).length;
                return usedCount > 0
                  ? `${usedCount} existing product(s) currently reference category "${pendingDelete.category.slug}". Consider reassigning those products after deletion.`
                  : undefined;
              })()
            : pendingDelete?.kind === 'product'
            ? (() => {
                const sectionRefs = draftSections.filter((s) =>
                  s.productIds?.includes(pendingDelete.product.id)
                );
                return sectionRefs.length > 0
                  ? `This product is currently hand-picked in ${sectionRefs.length} homepage section(s) (${sectionRefs.map((s) => s.name).join(', ')}). Those references will be cleaned up automatically.`
                  : undefined;
              })()
            : undefined
        }
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === 'order') {
            const targetId = pendingDelete.order.id;
            await deleteOrder(targetId);
            setSelectedOrderIds((prev) => prev.filter((id) => id !== targetId));
            if (viewingOrderId === targetId) setViewingOrderId(null);
          } else if (pendingDelete.kind === 'orders_bulk') {
            const ids = pendingDelete.orders.map((o) => o.id);
            await deleteOrdersBulk(ids);
            const idSet = new Set(ids);
            setSelectedOrderIds((prev) => prev.filter((id) => !idSet.has(id)));
            if (viewingOrderId && idSet.has(viewingOrderId)) setViewingOrderId(null);
          } else if (pendingDelete.kind === 'product') {
            await deleteProduct(pendingDelete.product.id);
            if (editingProduct?.id === pendingDelete.product.id) {
              setIsProductFormOpen(false);
              setEditingProduct(null);
            }
          } else if (pendingDelete.kind === 'category') {
            await deleteCategory(pendingDelete.category.id);
            if (editingCategory?.id === pendingDelete.category.id) {
              setEditingCategory(null);
            }
          }
        }}
      />
    </div>
  );
};
