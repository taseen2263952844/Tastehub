import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Product,
  Category,
  Banner,
  StoreSettings,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CategorySlug,
  SortOption,
  StoreView,
  UserProfile,
  SavedAddress,
  FirebaseConnectionStatus,
  WebsiteSection,
  WebsiteSnapshot,
  NavigationMenu,
  CmsPage,
  CmsPost,
  Promotion,
  MediaAsset,
  NewsletterSubscriber,
  SupplierIntegrationConfig,
  SupplierImportLog,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  DEFAULT_STORE_SETTINGS,
  INITIAL_WEBSITE_SECTIONS,
  INITIAL_NAVIGATION_MENUS,
  INITIAL_CMS_PAGES,
  INITIAL_CMS_POSTS,
  INITIAL_PROMOTIONS,
  INITIAL_MEDIA_ASSETS,
} from '../data/catalogSeed';
import {
  firebaseStatus,
  subscribeToProductsFirestore,
  saveProductToFirestore,
  batchSaveProductsToFirestore,
  deleteProductFromFirestore,
  subscribeToCategoriesFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeToBannersFirestore,
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  subscribeToStoreSettingsFirestore,
  saveStoreSettingsToFirestore,
  subscribeToWebsiteSectionsFirestore,
  saveWebsiteSectionToFirestore,
  deleteWebsiteSectionFromFirestore,
  subscribeToPublishedSnapshotFirestore,
  subscribeToAdminWebsiteVersionsFirestore,
  saveWebsiteSnapshotToFirestore,
  subscribeToNavigationMenusFirestore,
  saveNavigationMenuToFirestore,
  deleteNavigationMenuFromFirestore,
  subscribeToCmsPagesFirestore,
  saveCmsPageToFirestore,
  deleteCmsPageFromFirestore,
  subscribeToCmsPostsFirestore,
  saveCmsPostToFirestore,
  deleteCmsPostFromFirestore,
  subscribeToPromotionsFirestore,
  savePromotionToFirestore,
  deletePromotionFromFirestore,
  subscribeToMediaLibraryFirestore,
  saveMediaAssetToFirestore,
  deleteMediaAssetFromFirestore,
  subscribeNewsletterInFirestore,
  subscribeToNewsletterSubscribersFirestore,
  deleteNewsletterSubscriberFromFirestore,
  subscribeToSupplierIntegrationsFirestore,
  saveSupplierIntegrationToFirestore,
  subscribeToSupplierImportLogsFirestore,
  saveSupplierImportLogToFirestore,
  deleteSupplierImportLogFromFirestore,
  subscribeToAllUsersAdminFirestore,
  createOrderInFirestore,
  updateOrderInFirestore,
  deleteOrderFromFirestore,
  deleteOrdersBulkFromFirestore,
  deleteStorageAsset,
  isFirebaseStorageUrl,
  formatFirebaseError,
  subscribeToOrdersFirestore,
  subscribeToCustomerOrdersFirestore,
  fetchUserProfile,
  saveUserProfile,
  fetchUserCartFromFirestore,
  saveUserCartToFirestore,
  checkIsAdminInFirestore,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  subscribeToAuthState,
} from '../services/firebase';

export const AUTHORIZED_ADMIN_EMAIL = 'bdtaseengaming@gmail.com';
const LOCAL_CART_KEY = 'veyra_cart_v1';

export function formatBDT(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

export function normalizeBDPhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, '').trim();
}

export function isValidBDPhone(raw: string): boolean {
  const normalized = normalizeBDPhone(raw);
  return /^(?:\+8801|01)[3-9][0-9]{8}$/.test(normalized);
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  area: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  promoCode?: string;
  saveAddressToProfile?: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

export interface PromoValidationResult {
  valid: boolean;
  promo?: Promotion;
  discountAmount: number;
  freeDelivery: boolean;
  message: string;
}

interface AppContextType {
  // Storefront data (published vs preview-draft resolved automatically)
  products: Product[];
  categories: Category[];
  banners: Banner[];
  storeSettings: StoreSettings;
  websiteSections: WebsiteSection[];
  navigationMenus: NavigationMenu[];
  cmsPages: CmsPage[];
  cmsPosts: CmsPost[];
  promotions: Promotion[];
  isFirestoreCatalogActive: boolean;

  // Draft & Publish CMS workspace (Admin)
  draftSettings: StoreSettings;
  draftSections: WebsiteSection[];
  draftMenus: NavigationMenu[];
  publishedSnapshot: WebsiteSnapshot | null;
  websiteVersions: WebsiteSnapshot[];
  isPreviewMode: boolean;
  setIsPreviewMode: (preview: boolean) => void;
  hasUnpublishedChanges: boolean;
  updateDraftSettings: (next: StoreSettings) => Promise<void>;
  updateDraftSections: (next: WebsiteSection[]) => Promise<void>;
  updateDraftMenus: (next: NavigationMenu[]) => Promise<void>;
  publishWebsiteChanges: (label?: string) => Promise<void>;
  discardDraftChanges: () => Promise<void>;
  restoreVersionToDraft: (snapshot: WebsiteSnapshot) => Promise<void>;

  // Admin-only collections
  mediaAssets: MediaAsset[];
  newsletterSubscribers: NewsletterSubscriber[];
  adminCustomers: UserProfile[];
  supplierIntegrations: SupplierIntegrationConfig[];
  supplierImportLogs: SupplierImportLog[];

  // Navigation & catalog filters
  activeView: StoreView;
  setActiveView: (view: StoreView) => void;
  selectedProduct: Product | null;
  openProductDetail: (product: Product) => void;
  selectedPage: CmsPage | null;
  openPageBySlug: (slug: string) => void;
  selectedPost: CmsPost | null;
  openPostBySlug: (slug: string) => void;
  navigateTarget: (targetType: string, targetValue: string) => void;
  activeCategory: CategorySlug;
  setActiveCategory: (cat: CategorySlug) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  navigateToShop: (category?: CategorySlug, query?: string) => void;

  // Cart & Promo
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, variationId?: string) => boolean;
  updateCartQuantity: (productId: string, variationId: string | undefined, quantity: number) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartItemCount: number;
  calculateDeliveryFee: (city: string, subtotal: number, promoCode?: string) => number;
  validatePromoCode: (code: string, subtotal: number) => PromoValidationResult;

  // Auth & Customer Profile
  currentUser: AuthUser | null;
  authLoading: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmailPassword: (email: string, password: string) => Promise<boolean>;
  signupWithEmailPassword: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfileInfo: (data: { displayName: string; phone: string }) => Promise<void>;
  saveAddress: (address: Omit<SavedAddress, 'id'> & { id?: string }) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;

  // Orders & Tracking
  orders: Order[];
  customerOrders: Order[];
  lastOrder: Order | null;
  trackedOrder: Order | null;
  placeOrder: (payload: CheckoutPayload) => Promise<Order>;
  lookupOrder: (orderNumberOrId: string) => Order | null;
  updateOrder: (
    orderId: string,
    updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; adminNotes?: string }
  ) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  deleteOrdersBulk: (orderIds: string[]) => Promise<void>;

  // Admin Catalog & CMS Management
  saveProduct: (product: Product) => Promise<void>;
  batchSaveProducts: (products: Product[], customToast?: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveSupplierIntegration: (config: SupplierIntegrationConfig) => Promise<void>;
  saveSupplierImportLog: (log: SupplierImportLog) => Promise<void>;
  deleteSupplierImportLog: (logId: string) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  saveBanner: (banner: Banner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
  saveStoreSettings: (settings: StoreSettings) => Promise<void>;
  saveCmsPage: (page: CmsPage) => Promise<void>;
  deleteCmsPage: (pageId: string) => Promise<void>;
  saveCmsPost: (post: CmsPost) => Promise<void>;
  deleteCmsPost: (postId: string) => Promise<void>;
  savePromotion: (promo: Promotion) => Promise<void>;
  deletePromotion: (promoId: string) => Promise<void>;
  saveMediaAsset: (asset: MediaAsset) => Promise<void>;
  deleteMediaAsset: (assetId: string, storagePathOrUrl?: string) => Promise<void>;
  cleanupUnusedMediaAssets: (assets: MediaAsset[]) => Promise<number>;
  getMediaAssetUsages: (url: string) => string[];
  deleteWebsiteSection: (sectionId: string, syncLive?: boolean) => Promise<void>;
  deleteNavigationMenu: (menuId: string, syncLive?: boolean) => Promise<void>;
  persistNavigationMenusLiveAndDraft: (nextMenus: NavigationMenu[], syncLive?: boolean) => Promise<void>;
  subscribeNewsletter: (email: string, source?: 'footer' | 'section') => Promise<void>;
  removeNewsletterSubscriber: (id: string) => Promise<void>;
  seedCatalogToFirestore: () => Promise<void>;

  // System & UI
  firebaseStatus: FirebaseConnectionStatus;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [firestoreCategories, setFirestoreCategories] = useState<Category[]>([]);
  const [firestoreBanners, setFirestoreBanners] = useState<Banner[]>([]);
  const [firestoreSettings, setFirestoreSettings] = useState<StoreSettings | null>(null);
  const [firestoreSections, setFirestoreSections] = useState<WebsiteSection[]>([]);
  const [firestoreMenus, setFirestoreMenus] = useState<NavigationMenu[]>([]);
  const [publishedSnapshot, setPublishedSnapshot] = useState<WebsiteSnapshot | null>(null);
  const [websiteVersions, setWebsiteVersions] = useState<WebsiteSnapshot[]>([]);
  const [firestorePages, setFirestorePages] = useState<CmsPage[]>([]);
  const [firestorePosts, setFirestorePosts] = useState<CmsPost[]>([]);
  const [firestorePromotions, setFirestorePromotions] = useState<Promotion[]>([]);
  const [firestoreMedia, setFirestoreMedia] = useState<MediaAsset[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<UserProfile[]>([]);
  const [supplierIntegrations, setSupplierIntegrations] = useState<SupplierIntegrationConfig[]>([]);
  const [supplierImportLogs, setSupplierImportLogs] = useState<SupplierImportLog[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore invalid local cart
    }
    return [];
  });

  const [activeView, setActiveViewState] = useState<StoreView>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('');
  const [selectedPostSlug, setSelectedPostSlug] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategorySlug>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Local draft overrides (synced with websiteVersions/draft)
  const [localDraftSettings, setLocalDraftSettings] = useState<StoreSettings | null>(null);
  const [localDraftSections, setLocalDraftSections] = useState<WebsiteSection[] | null>(null);
  const [localDraftMenus, setLocalDraftMenus] = useState<NavigationMenu[] | null>(null);
  const [localBootstrappedCols, setLocalBootstrappedCols] = useState<string[]>([]);

  const hydratedCartUidRef = useRef<string | null>(null);

  const bootstrappedSet = useMemo(() => {
    const set = new Set<string>(localBootstrappedCols);
    (firestoreSettings?.bootstrappedCollections || []).forEach((k) => set.add(k));
    (publishedSnapshot?.settings?.bootstrappedCollections || []).forEach((k) => set.add(k));
    return set;
  }, [
    localBootstrappedCols,
    firestoreSettings?.bootstrappedCollections,
    publishedSnapshot?.settings?.bootstrappedCollections,
  ]);

  // Resolved base collections — never resurrect INITIAL_* once a collection is managed in Firestore
  const products =
    firestoreProducts.length > 0 || bootstrappedSet.has('products')
      ? firestoreProducts
      : INITIAL_PRODUCTS;
  const categories =
    firestoreCategories.length > 0 || bootstrappedSet.has('categories')
      ? firestoreCategories
      : INITIAL_CATEGORIES;
  const banners =
    firestoreBanners.length > 0 || bootstrappedSet.has('banners')
      ? firestoreBanners
      : INITIAL_BANNERS;
  const cmsPages =
    firestorePages.length > 0 || bootstrappedSet.has('cmsPages')
      ? firestorePages
      : INITIAL_CMS_PAGES;
  const cmsPosts =
    firestorePosts.length > 0 || bootstrappedSet.has('cmsPosts')
      ? firestorePosts
      : INITIAL_CMS_POSTS;
  const promotions =
    firestorePromotions.length > 0 || bootstrappedSet.has('promotions')
      ? firestorePromotions
      : INITIAL_PROMOTIONS;
  const mediaAssets =
    firestoreMedia.length > 0 || bootstrappedSet.has('mediaAssets')
      ? firestoreMedia
      : INITIAL_MEDIA_ASSETS;
  const isFirestoreCatalogActive = firestoreProducts.length > 0 || bootstrappedSet.has('products');

  // Published configuration (public-facing source of truth)
  const publishedSettings: StoreSettings = useMemo(
    () => ({
      ...DEFAULT_STORE_SETTINGS,
      ...(firestoreSettings || {}),
      ...(publishedSnapshot?.settings || {}),
    }),
    [firestoreSettings, publishedSnapshot?.settings]
  );

  const publishedSections: WebsiteSection[] = useMemo(() => {
    if (Array.isArray(publishedSnapshot?.sections)) {
      return [...publishedSnapshot.sections].sort((a, b) => a.displayOrder - b.displayOrder);
    }
    if (firestoreSections.length > 0 || bootstrappedSet.has('websiteSections')) {
      return [...firestoreSections].sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return INITIAL_WEBSITE_SECTIONS;
  }, [publishedSnapshot?.sections, firestoreSections, bootstrappedSet]);

  const publishedMenus: NavigationMenu[] = useMemo(() => {
    if (Array.isArray(publishedSnapshot?.menus)) {
      return publishedSnapshot.menus;
    }
    if (firestoreMenus.length > 0 || bootstrappedSet.has('navigationMenus')) {
      return firestoreMenus;
    }
    return INITIAL_NAVIGATION_MENUS;
  }, [publishedSnapshot?.menus, firestoreMenus, bootstrappedSet]);

  // Draft configuration (Admin editor workspace)
  const remoteDraft = websiteVersions.find((v) => v.id === 'draft');
  const draftSettings: StoreSettings = useMemo(
    () =>
      localDraftSettings || {
        ...publishedSettings,
        ...(remoteDraft?.settings || {}),
      },
    [localDraftSettings, publishedSettings, remoteDraft?.settings]
  );

  const draftSections: WebsiteSection[] = useMemo(() => {
    const raw =
      localDraftSections ||
      (Array.isArray(remoteDraft?.sections) ? remoteDraft.sections : publishedSections);
    return [...raw].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [localDraftSections, remoteDraft?.sections, publishedSections]);

  const draftMenus: NavigationMenu[] = useMemo(
    () =>
      localDraftMenus ||
      (Array.isArray(remoteDraft?.menus) ? remoteDraft.menus : publishedMenus),
    [localDraftMenus, remoteDraft?.menus, publishedMenus]
  );

  const hasUnpublishedChanges = useMemo(() => {
    if (!isAdmin) return false;
    const pubStr = JSON.stringify({
      s: publishedSettings,
      sec: publishedSections,
      m: publishedMenus,
    });
    const draftStr = JSON.stringify({
      s: draftSettings,
      sec: draftSections,
      m: draftMenus,
    });
    return pubStr !== draftStr;
  }, [isAdmin, publishedSettings, publishedSections, publishedMenus, draftSettings, draftSections, draftMenus]);

  // Active storefront configuration (Draft in Preview Mode for Admins, otherwise strictly Published)
  const storeSettings = isAdmin && isPreviewMode ? draftSettings : publishedSettings;
  const websiteSections = isAdmin && isPreviewMode ? draftSections : publishedSections;
  const navigationMenus = isAdmin && isPreviewMode ? draftMenus : publishedMenus;

  const selectedPage = useMemo(
    () => cmsPages.find((p) => p.slug === selectedPageSlug) || null,
    [cmsPages, selectedPageSlug]
  );

  const selectedPost = useMemo(
    () => cmsPosts.find((p) => p.slug === selectedPostSlug) || null,
    [cmsPosts, selectedPostSlug]
  );

  // Sync CSS Custom Properties with active storeSettings
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--veyra-primary', storeSettings.primaryColor || '#1B3B2B');
    root.style.setProperty('--veyra-secondary', storeSettings.secondaryColor || '#6E8774');
    root.style.setProperty('--veyra-bg', storeSettings.backgroundColor || '#FAF8F4');
    root.style.setProperty('--veyra-surface', storeSettings.surfaceColor || '#F3F0E8');
    root.style.setProperty('--veyra-text', storeSettings.textColor || '#171C19');

    const headingFont = storeSettings.headingFont || 'Cormorant Garamond';
    const bodyFont = storeSettings.bodyFont || 'Plus Jakarta Sans';
    root.style.setProperty('--veyra-font-heading', `'${headingFont}', Georgia, serif`);
    root.style.setProperty('--veyra-font-body', `'${bodyFont}', system-ui, sans-serif`);

    const radiusVal =
      storeSettings.borderRadius === 'sharp'
        ? '0.25rem'
        : storeSettings.borderRadius === 'rounded'
        ? '1.25rem'
        : '0.75rem';
    root.style.setProperty('--veyra-radius', radiusVal);
  }, [storeSettings]);

  // Sync dynamic SEO meta tags & favicon
  useEffect(() => {
    let title = storeSettings.metaTitle || `${storeSettings.storeName} — ${storeSettings.tagline}`;
    let desc =
      storeSettings.metaDescription ||
      'Modern multi-category lifestyle & essentials storefront thoughtfully curated for Bangladesh and beyond.';
    let ogImg = storeSettings.ogImageUrl || '';

    if (activeView === 'product' && selectedProduct) {
      title = selectedProduct.seoTitle || `${selectedProduct.name} — ${storeSettings.storeName}`;
      desc = selectedProduct.seoDescription || selectedProduct.shortDescription || desc;
      ogImg = selectedProduct.images?.[0] || ogImg;
    } else if (activeView === 'page' && selectedPage) {
      title = selectedPage.seoTitle || `${selectedPage.title} — ${storeSettings.storeName}`;
      desc = selectedPage.seoDescription || desc;
      ogImg = selectedPage.featuredImage || ogImg;
    } else if (activeView === 'post' && selectedPost) {
      title = selectedPost.seoTitle || `${selectedPost.title} — ${storeSettings.storeName}`;
      desc = selectedPost.seoDescription || selectedPost.excerpt || desc;
      ogImg = selectedPost.featuredImage || ogImg;
    } else if (activeView === 'blog') {
      title = `Journal & News — ${storeSettings.storeName}`;
    } else if (activeView === 'shop') {
      title = `Shop Catalog — ${storeSettings.storeName}`;
    }

    document.title = title;
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el && content) el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    if (ogImg) {
      let ogImgEl = document.querySelector('meta[property="og:image"]');
      if (!ogImgEl) {
        ogImgEl = document.createElement('meta');
        ogImgEl.setAttribute('property', 'og:image');
        document.head.appendChild(ogImgEl);
      }
      ogImgEl.setAttribute('content', ogImg);
    }

    if (storeSettings.faviconUrl) {
      const link = document.querySelector('link[rel="icon"]');
      if (link) link.setAttribute('href', storeSettings.faviconUrl);
    }
  }, [activeView, selectedProduct, selectedPage, selectedPost, storeSettings]);

  const setActiveView = (view: StoreView) => {
    setActiveViewState(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    window.location.hash = `product/${product.slug || product.id}`;
    setActiveView('product');
  };

  const openPageBySlug = (slug: string) => {
    setSelectedPageSlug(slug);
    window.location.hash = `page/${slug}`;
    setActiveView('page');
  };

  const openPostBySlug = (slug: string) => {
    setSelectedPostSlug(slug);
    window.location.hash = `post/${slug}`;
    setActiveView('post');
  };

  const navigateToShop = (category: CategorySlug = 'all', queryText?: string) => {
    setActiveCategory(category);
    if (queryText !== undefined) {
      setSearchQuery(queryText);
    }
    window.location.hash = category === 'all' ? 'shop' : `shop/${category}`;
    setActiveView('shop');
  };

  const navigateTarget = (targetType: string, targetValue: string) => {
    switch (targetType) {
      case 'home':
        window.location.hash = '';
        setActiveView('home');
        break;
      case 'shop':
        navigateToShop('all', '');
        break;
      case 'category':
        navigateToShop(targetValue || 'all', '');
        break;
      case 'product': {
        const found = products.find((p) => p.id === targetValue || p.slug === targetValue);
        if (found) openProductDetail(found);
        else navigateToShop('all', '');
        break;
      }
      case 'page':
        openPageBySlug(targetValue);
        break;
      case 'blog':
        if (targetValue && targetValue !== 'blog') {
          openPostBySlug(targetValue);
        } else {
          window.location.hash = 'blog';
          setActiveView('blog');
        }
        break;
      case 'tracking':
        window.location.hash = 'tracking';
        setActiveView('tracking');
        break;
      case 'admin':
        setActiveView('admin');
        break;
      case 'url':
        if (targetValue.startsWith('http://') || targetValue.startsWith('https://')) {
          window.location.assign(targetValue);
        } else if (targetValue.startsWith('#')) {
          window.location.hash = targetValue;
        }
        break;
      default:
        setActiveView('home');
    }
  };

  // Sync initial & hashchange routes (#page/slug, #post/slug, #blog, #shop/cat, #product/slug)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      if (hash.startsWith('page/')) {
        setSelectedPageSlug(hash.slice(5));
        setActiveViewState('page');
      } else if (hash.startsWith('post/')) {
        setSelectedPostSlug(hash.slice(5));
        setActiveViewState('post');
      } else if (hash === 'blog') {
        setActiveViewState('blog');
      } else if (hash === 'tracking') {
        setActiveViewState('tracking');
      } else if (hash === 'shop') {
        setActiveViewState('shop');
      } else if (hash.startsWith('shop/')) {
        setActiveCategory(hash.slice(5));
        setActiveViewState('shop');
      } else if (hash.startsWith('product/')) {
        const key = hash.slice(8);
        const match = products.find((p) => p.slug === key || p.id === key);
        if (match) {
          setSelectedProduct(match);
          setActiveViewState('product');
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [products]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  // 1. Public Storefront Firestore Subscriptions
  useEffect(() => {
    if (!firebaseStatus.isConfigured) return;

    const unsubProducts = subscribeToProductsFirestore(
      (list) => setFirestoreProducts(list),
      (err) => console.warn('Products sync notice:', err.message)
    );
    const unsubCategories = subscribeToCategoriesFirestore(
      (list) => setFirestoreCategories(list),
      (err) => console.warn('Categories sync notice:', err.message)
    );
    const unsubBanners = subscribeToBannersFirestore(
      (list) => setFirestoreBanners(list),
      (err) => console.warn('Banners sync notice:', err.message)
    );
    const unsubSettings = subscribeToStoreSettingsFirestore(
      (settings) => setFirestoreSettings(settings),
      (err) => console.warn('Store settings sync notice:', err.message)
    );
    const unsubSections = subscribeToWebsiteSectionsFirestore(
      (secs) => setFirestoreSections(secs),
      (err) => console.warn('Sections sync notice:', err.message)
    );
    const unsubMenus = subscribeToNavigationMenusFirestore(
      (menus) => setFirestoreMenus(menus),
      (err) => console.warn('Menus sync notice:', err.message)
    );
    const unsubPublishedSnap = subscribeToPublishedSnapshotFirestore(
      (snap) => setPublishedSnapshot(snap),
      (err) => console.warn('Published snapshot notice:', err.message)
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubSettings();
      unsubSections();
      unsubMenus();
      unsubPublishedSnap();
    };
  }, []);

  // Role-aware subscriptions for Pages, Posts, Promotions (Admin gets drafts; public gets published/active only)
  useEffect(() => {
    if (!firebaseStatus.isConfigured) return;

    const unsubPages = subscribeToCmsPagesFirestore(
      isAdmin,
      (list) => setFirestorePages(list),
      (err) => console.warn('Pages sync notice:', err.message)
    );
    const unsubPosts = subscribeToCmsPostsFirestore(
      isAdmin,
      (list) => setFirestorePosts(list),
      (err) => console.warn('Posts sync notice:', err.message)
    );
    const unsubPromos = subscribeToPromotionsFirestore(
      isAdmin,
      (list) => setFirestorePromotions(list),
      (err) => console.warn('Promotions sync notice:', err.message)
    );

    return () => {
      unsubPages();
      unsubPosts();
      unsubPromos();
    };
  }, [isAdmin]);

  // Keep selectedProduct fresh when products update
  useEffect(() => {
    if (selectedProduct) {
      const latest = products.find((p) => p.id === selectedProduct.id);
      if (latest) setSelectedProduct(latest);
    }
  }, [products, selectedProduct?.id]);

  // 2. Auth State Listener
  useEffect(() => {
    if (!firebaseStatus.isConfigured) {
      setAuthLoading(false);
      return;
    }

    const unsubAuth = subscribeToAuthState(async (user) => {
      if (user) {
        const authUserObj: AuthUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
          photoURL: user.photoURL || undefined,
          emailVerified: user.emailVerified,
        };
        setCurrentUser(authUserObj);

        const adminVerified = await checkIsAdminInFirestore(
          user.uid,
          user.email,
          user.emailVerified
        );
        setIsAdmin(adminVerified);

        try {
          const existingProfile = await fetchUserProfile(user.uid);
          if (existingProfile) {
            setUserProfile(existingProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: authUserObj.displayName,
              email: authUserObj.email,
              phone: '',
              savedAddresses: [],
            };
            await saveUserProfile(newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not load customer profile:', err);
        }

        try {
          const remoteCart = await fetchUserCartFromFirestore(user.uid);
          setCart((localCart) => {
            if (localCart.length === 0 && remoteCart && remoteCart.length > 0) {
              return remoteCart;
            }
            if (localCart.length > 0) {
              saveUserCartToFirestore(user.uid, localCart).catch(() => {});
            }
            return localCart;
          });
          hydratedCartUidRef.current = user.uid;
        } catch (err) {
          console.warn('Cart hydration notice:', err);
          hydratedCartUidRef.current = user.uid;
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setIsPreviewMode(false);
        setUserProfile(null);
        setCustomerOrders([]);
        setOrders([]);
        setWebsiteVersions([]);
        setFirestoreMedia([]);
        setNewsletterSubscribers([]);
        setAdminCustomers([]);
        setSupplierIntegrations([]);
        setSupplierImportLogs([]);
        hydratedCartUidRef.current = null;
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // 3. Persist Cart
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }

    if (
      firebaseStatus.isConfigured &&
      currentUser?.uid &&
      hydratedCartUidRef.current === currentUser.uid
    ) {
      saveUserCartToFirestore(currentUser.uid, cart).catch((err) => {
        console.warn('Failed to sync cart to Firestore:', err);
      });
    }
  }, [cart, currentUser?.uid]);

  // 4. Customer Personal Orders Subscription
  useEffect(() => {
    if (!firebaseStatus.isConfigured || !currentUser?.uid) {
      setCustomerOrders([]);
      return;
    }

    const unsubCustomerOrders = subscribeToCustomerOrdersFirestore(
      currentUser.uid,
      (list) => setCustomerOrders(list),
      (err) => console.warn('Customer orders subscription notice:', err.message)
    );

    return () => unsubCustomerOrders();
  }, [currentUser?.uid]);

  // 5. Admin-Only Subscriptions
  useEffect(() => {
    if (!firebaseStatus.isConfigured || !isAdmin) {
      return;
    }

    const unsubOrders = subscribeToOrdersFirestore(
      (list) => setOrders(list),
      (err) => console.warn('Admin orders error:', err.message)
    );
    const unsubVersions = subscribeToAdminWebsiteVersionsFirestore(
      (list) => setWebsiteVersions(list),
      (err) => console.warn('Website versions error:', err.message)
    );
    const unsubMedia = subscribeToMediaLibraryFirestore(
      (list) => setFirestoreMedia(list),
      (err) => console.warn('Media library error:', err.message)
    );
    const unsubSubs = subscribeToNewsletterSubscribersFirestore(
      (list) => setNewsletterSubscribers(list),
      (err) => console.warn('Newsletter subscribers error:', err.message)
    );
    const unsubCustomers = subscribeToAllUsersAdminFirestore(
      (list) => setAdminCustomers(list),
      (err) => console.warn('Admin customers error:', err.message)
    );
    const unsubSuppliers = subscribeToSupplierIntegrationsFirestore(
      (list) => setSupplierIntegrations(list),
      (err) => console.warn('Supplier integrations error:', err.message)
    );
    const unsubSupplierLogs = subscribeToSupplierImportLogsFirestore(
      (list) => setSupplierImportLogs(list),
      (err) => console.warn('Supplier import logs error:', err.message)
    );

    return () => {
      unsubOrders();
      unsubVersions();
      unsubMedia();
      unsubSubs();
      unsubCustomers();
      unsubSuppliers();
      unsubSupplierLogs();
    };
  }, [isAdmin]);

  // ---------------- CART & PROMO LOGIC ----------------

  const addToCart = (product: Product, quantity = 1, variationId?: string): boolean => {
    if (!product.isActive) {
      showToast('This product is currently unavailable.');
      return false;
    }

    const variation = variationId
      ? product.variations.find((v) => v.id === variationId)
      : product.variations[0];

    const availableStock = variation ? variation.stock : product.stock;
    if (availableStock <= 0) {
      showToast('This item is currently out of stock.');
      return false;
    }

    const unitPrice = product.price + (variation ? variation.priceAdjustment : 0);
    const targetVarId = variation?.id;

    let addedSuccessfully = true;

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.productId === product.id && (item.variationId || '') === (targetVarId || '')
      );
      if (idx > -1) {
        const nextQty = Math.min(availableStock, prev[idx].quantity + quantity);
        if (nextQty === prev[idx].quantity) {
          addedSuccessfully = false;
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: nextQty,
          unitPrice,
          maxStock: availableStock,
        };
        return updated;
      }

      const clampedQty = Math.min(availableStock, Math.max(1, quantity));
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || '',
        categoryName: product.categoryName,
        unitPrice,
        variationId: targetVarId,
        variationLabel: variation ? `${variation.type}: ${variation.name}` : undefined,
        quantity: clampedQty,
        maxStock: availableStock,
      };
      return [...prev, newItem];
    });

    if (addedSuccessfully) {
      showToast(`Added ${product.name} to bag`);
    } else {
      showToast(`Maximum available stock (${availableStock}) already in bag`);
    }
    return addedSuccessfully;
  };

  const updateCartQuantity = (productId: string, variationId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && (item.variationId || '') === (variationId || '')) {
          const clamped = Math.min(item.maxStock || 99, quantity);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && (item.variationId || '') === (variationId || ''))
      )
    );
    showToast('Removed from shopping bag');
  };

  const clearCart = () => {
    setCart([]);
    if (firebaseStatus.isConfigured && currentUser?.uid) {
      saveUserCartToFirestore(currentUser.uid, []).catch(() => {});
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const validatePromoCode = (rawCode: string, subtotal: number): PromoValidationResult => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { valid: false, discountAmount: 0, freeDelivery: false, message: 'Enter a promo code.' };
    }
    const promo = promotions.find((p) => p.code.toUpperCase() === code && p.isActive);
    if (!promo) {
      return { valid: false, discountAmount: 0, freeDelivery: false, message: 'Invalid or inactive promo code.' };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (promo.startDate && today < promo.startDate) {
      return { valid: false, discountAmount: 0, freeDelivery: false, message: 'This promotion has not started yet.' };
    }
    if (promo.endDate && today > promo.endDate) {
      return { valid: false, discountAmount: 0, freeDelivery: false, message: 'This promo code has expired.' };
    }
    if (subtotal < promo.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        freeDelivery: false,
        message: `Minimum order of ${formatBDT(promo.minOrderAmount)} required for ${promo.code}.`,
      };
    }

    if (promo.discountType === 'free_delivery') {
      return {
        valid: true,
        promo,
        discountAmount: 0,
        freeDelivery: true,
        message: `Applied ${promo.code}: Free delivery unlocked.`,
      };
    }

    const discountAmount =
      promo.discountType === 'percentage'
        ? Math.min(subtotal, Math.round((subtotal * promo.discountValue) / 100))
        : Math.min(subtotal, Math.round(promo.discountValue));

    return {
      valid: true,
      promo,
      discountAmount,
      freeDelivery: false,
      message: `Applied ${promo.code}: Saved ${formatBDT(discountAmount)}.`,
    };
  };

  const calculateDeliveryFee = (city: string, subtotal: number, promoCode?: string): number => {
    if (subtotal <= 0) return 0;
    if (promoCode) {
      const promoCheck = validatePromoCode(promoCode, subtotal);
      if (promoCheck.valid && promoCheck.freeDelivery) return 0;
    }
    if (storeSettings.freeDeliveryThreshold > 0 && subtotal >= storeSettings.freeDeliveryThreshold) {
      return 0;
    }
    const isDhaka = city.trim().toLowerCase() === 'dhaka';
    return isDhaka ? storeSettings.insideDhakaDeliveryFee : storeSettings.outsideDhakaDeliveryFee;
  };

  // ---------------- DRAFT & PUBLISH CMS ACTIONS ----------------

  const persistDraftSnapshot = async (
    nextSettings: StoreSettings,
    nextSections: WebsiteSection[],
    nextMenus: NavigationMenu[]
  ) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    await saveWebsiteSnapshotToFirestore({
      id: 'draft',
      versionLabel: 'Current Admin Draft',
      settings: nextSettings,
      sections: nextSections,
      menus: nextMenus,
      publishedBy: currentUser?.email || '',
      publishedAt: new Date().toISOString(),
    });
  };

  const updateDraftSettings = async (next: StoreSettings) => {
    setLocalDraftSettings(next);
    await persistDraftSnapshot(next, draftSections, draftMenus);
    showToast('Draft settings saved (not live until published)');
  };

  const updateDraftSections = async (next: WebsiteSection[]) => {
    const normalized = next.map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
    setLocalDraftSections(normalized);
    await persistDraftSnapshot(draftSettings, normalized, draftMenus);
  };

  const updateDraftMenus = async (next: NavigationMenu[]) => {
    setLocalDraftMenus(next);
    await persistDraftSnapshot(draftSettings, draftSections, next);
    showToast('Draft navigation saved');
  };

  const publishWebsiteChanges = async (label?: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const nowIso = new Date().toISOString();
    const versionTitle = label?.trim() || `Published ${new Date().toLocaleString()}`;

    const publishedSnap: WebsiteSnapshot = {
      id: 'published',
      versionLabel: versionTitle,
      settings: draftSettings,
      sections: draftSections,
      menus: draftMenus,
      publishedBy: currentUser?.email || '',
      publishedAt: nowIso,
    };

    const historySnap: WebsiteSnapshot = {
      ...publishedSnap,
      id: `ver-${Date.now()}`,
    };

    // Write published snapshot + history + underlying collections atomically in parallel
    await Promise.all([
      saveWebsiteSnapshotToFirestore(publishedSnap),
      saveWebsiteSnapshotToFirestore(historySnap),
      saveStoreSettingsToFirestore(draftSettings),
      ...draftSections.map((sec) => saveWebsiteSectionToFirestore(sec)),
      ...draftMenus.map((menu) => saveNavigationMenuToFirestore(menu)),
    ]);

    // Remove deleted sections if any exist in Firestore
    const draftIds = new Set(draftSections.map((s) => s.id));
    await Promise.all(
      firestoreSections
        .filter((old) => !draftIds.has(old.id))
        .map((old) => deleteWebsiteSectionFromFirestore(old.id))
    );

    const draftMenuIds = new Set(draftMenus.map((m) => m.id));
    await Promise.all(
      firestoreMenus
        .filter((old) => !draftMenuIds.has(old.id))
        .map((old) => deleteNavigationMenuFromFirestore(old.id))
    );

    setIsPreviewMode(false);
    showToast('Website changes published live!');
  };

  const discardDraftChanges = async () => {
    setLocalDraftSettings(publishedSettings);
    setLocalDraftSections(publishedSections);
    setLocalDraftMenus(publishedMenus);
    await persistDraftSnapshot(publishedSettings, publishedSections, publishedMenus);
    showToast('Draft reset to currently published version');
  };

  const restoreVersionToDraft = async (snapshot: WebsiteSnapshot) => {
    setLocalDraftSettings(snapshot.settings);
    setLocalDraftSections(snapshot.sections);
    setLocalDraftMenus(snapshot.menus);
    await persistDraftSnapshot(snapshot.settings, snapshot.sections, snapshot.menus);
    showToast(`Restored "${snapshot.versionLabel}" into draft`);
  };

  // ---------------- AUTH & PROFILE ACTIONS ----------------

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const user = await signInWithGoogle();
      if (!user) return false;
      setIsAuthModalOpen(false);
      showToast(`Signed in as ${user.displayName || user.email}`);
      return true;
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      showToast(err?.message || 'Google sign-in failed.');
      return false;
    }
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await signInWithEmail(email.trim(), password);
      if (!user) return false;
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${user.displayName || user.email}`);
      return true;
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      throw new Error(err?.message || 'Invalid email or password.');
    }
  };

  const signupWithEmailPassword = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const user = await registerWithEmail(name, email.trim(), password);
      if (!user) return false;
      setIsAuthModalOpen(false);
      showToast(`Account created. Welcome to VEYRA, ${name.trim()}!`);
      return true;
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      throw new Error(err?.message || 'Could not create account.');
    }
  };

  const logout = async (): Promise<void> => {
    await signOutUser();
    setCurrentUser(null);
    setIsAdmin(false);
    setIsPreviewMode(false);
    setUserProfile(null);
    setCustomerOrders([]);
    setOrders([]);
    if (activeView === 'admin' || activeView === 'account') {
      setActiveView('home');
    }
    showToast('Signed out');
  };

  const updateProfileInfo = async (data: { displayName: string; phone: string }) => {
    if (!currentUser) throw new Error('Sign in required to save profile.');
    const updated: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: data.displayName.trim(),
      phone: normalizeBDPhone(data.phone),
      savedAddresses: userProfile?.savedAddresses || [],
    };
    await saveUserProfile(updated);
    setUserProfile(updated);
    showToast('Profile details saved');
  };

  const saveAddress = async (address: Omit<SavedAddress, 'id'> & { id?: string }) => {
    if (!currentUser) throw new Error('Sign in required to save addresses.');
    const currentAddresses = userProfile?.savedAddresses || [];
    const targetId = address.id || `addr-${Date.now()}`;
    const cleanAddr: SavedAddress = {
      id: targetId,
      label: address.label.trim() || 'Home',
      fullName: address.fullName.trim(),
      phone: normalizeBDPhone(address.phone),
      city: address.city.trim(),
      area: address.area.trim(),
      streetAddress: address.streetAddress.trim(),
      isDefault: Boolean(address.isDefault),
    };

    let nextAddresses: SavedAddress[];
    const exists = currentAddresses.some((a) => a.id === targetId);
    if (exists) {
      nextAddresses = currentAddresses.map((a) => (a.id === targetId ? cleanAddr : a));
    } else {
      nextAddresses = [...currentAddresses, cleanAddr];
    }

    if (cleanAddr.isDefault || nextAddresses.length === 1) {
      nextAddresses = nextAddresses.map((a) => ({ ...a, isDefault: a.id === targetId }));
    }

    const updated: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: userProfile?.displayName || currentUser.displayName,
      phone: userProfile?.phone || cleanAddr.phone,
      savedAddresses: nextAddresses,
    };
    await saveUserProfile(updated);
    setUserProfile(updated);
    showToast('Delivery address saved');
  };

  const deleteAddress = async (addressId: string) => {
    if (!currentUser || !userProfile) return;
    let next = userProfile.savedAddresses.filter((a) => a.id !== addressId);
    if (next.length > 0 && !next.some((a) => a.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    const updated: UserProfile = { ...userProfile, savedAddresses: next };
    await saveUserProfile(updated);
    setUserProfile(updated);
    showToast('Address removed');
  };

  // ---------------- ORDERS & CHECKOUT ----------------

  const placeOrder = async (payload: CheckoutPayload): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Your shopping bag is empty.');
    }

    const normalizedPhone = normalizeBDPhone(payload.customerPhone);
    if (!isValidBDPhone(normalizedPhone)) {
      throw new Error('Enter a valid Bangladeshi phone number (e.g., 01712345678).');
    }

    let calculatedSubtotal = 0;
    const validatedItems = cart.map((cartItem) => {
      const catalogProduct = products.find((p) => p.id === cartItem.productId);
      const matchedVariation = catalogProduct?.variations.find(
        (v) => v.id === cartItem.variationId
      );
      const authoritativeUnitPrice = catalogProduct
        ? catalogProduct.price + (matchedVariation ? matchedVariation.priceAdjustment : 0)
        : cartItem.unitPrice;

      const lineTotal = authoritativeUnitPrice * cartItem.quantity;
      calculatedSubtotal += lineTotal;

      return {
        productId: cartItem.productId,
        productName: catalogProduct ? catalogProduct.name : cartItem.productName,
        productImage: catalogProduct?.images[0] || cartItem.productImage,
        variationLabel: matchedVariation
          ? `${matchedVariation.type}: ${matchedVariation.name}`
          : cartItem.variationLabel,
        unitPrice: authoritativeUnitPrice,
        quantity: cartItem.quantity,
        lineTotal,
      };
    });

    let discountAmount = 0;
    let appliedPromoCode: string | undefined = undefined;
    if (payload.promoCode?.trim()) {
      const promoResult = validatePromoCode(payload.promoCode, calculatedSubtotal);
      if (promoResult.valid && promoResult.promo) {
        discountAmount = promoResult.discountAmount;
        appliedPromoCode = promoResult.promo.code;
      }
    }

    const deliveryFee = calculateDeliveryFee(
      payload.city,
      calculatedSubtotal,
      appliedPromoCode
    );
    const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + deliveryFee);

    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `VY-${randomCode}`;

    const initialPaymentStatus: PaymentStatus =
      payload.paymentMethod === 'cash_on_delivery' ? 'Unpaid' : 'Pending Verification';

    const newOrder: Order = {
      id: orderNumber,
      orderNumber,
      userId: currentUser?.uid || undefined,
      customerName: payload.customerName.trim(),
      customerPhone: normalizedPhone,
      customerEmail: payload.customerEmail?.trim() || currentUser?.email || undefined,
      city: payload.city.trim(),
      area: payload.area.trim(),
      deliveryAddress: payload.deliveryAddress.trim(),
      deliveryInstructions: payload.deliveryInstructions?.trim() || undefined,
      paymentMethod: payload.paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentReference: payload.paymentReference?.trim() || undefined,
      items: validatedItems,
      itemCount: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: calculatedSubtotal,
      deliveryFee,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      promoCode: appliedPromoCode,
      totalAmount,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!firebaseStatus.isConfigured) {
      throw new Error('Firebase is not configured. Orders must be persisted to Cloud Firestore.');
    }

    try {
      await createOrderInFirestore(newOrder);
    } catch (err: any) {
      console.error('Order write failed:', err);
      let friendly = 'Could not save your order to Cloud Firestore.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) friendly = `Firestore error: ${parsed.error}`;
      } catch {
        if (err?.message) friendly = err.message;
      }
      throw new Error(friendly);
    }

    if (currentUser?.uid) {
      try {
        if (payload.saveAddressToProfile) {
          await saveAddress({
            label: 'Home',
            fullName: newOrder.customerName,
            phone: normalizedPhone,
            city: newOrder.city,
            area: newOrder.area,
            streetAddress: newOrder.deliveryAddress,
            isDefault: (userProfile?.savedAddresses || []).length === 0,
          });
        } else if (!userProfile?.phone) {
          await saveUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: newOrder.customerName,
            phone: normalizedPhone,
          });
        }
      } catch {
        // non-blocking profile convenience update
      }
    }

    setLastOrder(newOrder);
    setTrackedOrder(newOrder);
    clearCart();
    setIsCartOpen(false);
    setActiveView('confirmation');
    return newOrder;
  };

  const lookupOrder = (orderNumberOrId: string): Order | null => {
    const clean = orderNumberOrId.trim().toUpperCase();
    if (!clean) return null;
    const pool = [...customerOrders, ...orders];
    if (lastOrder) pool.unshift(lastOrder);
    const found = pool.find(
      (o) => o.orderNumber.toUpperCase() === clean || o.id.toUpperCase() === clean
    );
    if (found) {
      setTrackedOrder(found);
      return found;
    }
    return null;
  };

  const updateOrder = async (
    orderId: string,
    updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; adminNotes?: string }
  ) => {
    if (!isAdmin) {
      showToast('Unauthorized: Administrator access required.');
      return;
    }
    try {
      await updateOrderInFirestore(orderId, updates);
      showToast(`Order ${orderId} updated`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await deleteOrderFromFirestore(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setCustomerOrders((prev) => prev.filter((o) => o.id !== orderId));
      setLastOrder((prev) => (prev?.id === orderId ? null : prev));
      setTrackedOrder((prev) => (prev?.id === orderId ? null : prev));
      showToast(`Order ${orderId} permanently deleted`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteOrdersBulk = async (orderIds: string[]) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    if (orderIds.length === 0) return;
    try {
      await deleteOrdersBulkFromFirestore(orderIds);
      const idSet = new Set(orderIds);
      setOrders((prev) => prev.filter((o) => !idSet.has(o.id)));
      setCustomerOrders((prev) => prev.filter((o) => !idSet.has(o.id)));
      setLastOrder((prev) => (prev && idSet.has(prev.id) ? null : prev));
      setTrackedOrder((prev) => (prev && idSet.has(prev.id) ? null : prev));
      showToast(`Permanently deleted ${orderIds.length} order(s)`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  // ---------------- COLLECTION BOOTSTRAP & STORAGE CLEANUP HELPERS ----------------

  const markCollectionBootstrapped = async (collectionKeys: string[]) => {
    const missing = collectionKeys.filter((k) => !bootstrappedSet.has(k));
    if (missing.length === 0) return;
    const nextList = Array.from(new Set([...bootstrappedSet, ...collectionKeys]));
    setLocalBootstrappedCols(nextList);
    try {
      await saveStoreSettingsToFirestore({
        ...publishedSettings,
        bootstrappedCollections: nextList,
      });
    } catch (err) {
      console.warn('Could not persist bootstrappedCollections marker:', err);
    }
  };

  const prepareCollectionBeforeDelete = async <T extends { id: string }>(
    collectionKey: string,
    firestoreItems: T[],
    initialItems: T[],
    excludeIds: string[],
    saveFn: (item: T) => Promise<void>
  ) => {
    const excludeSet = new Set(excludeIds);
    if (firestoreItems.length === 0 && !bootstrappedSet.has(collectionKey)) {
      const toKeep = initialItems.filter((item) => !excludeSet.has(item.id));
      await Promise.all(toKeep.map((item) => saveFn(item)));
    }
    await markCollectionBootstrapped([collectionKey]);
  };

  const computeMediaUsages = (
    url: string,
    exclude?: { kind: string; id: string }
  ): string[] => {
    if (!url) return [];
    const refs: string[] = [];

    products.forEach((p) => {
      if (exclude?.kind === 'product' && exclude.id === p.id) return;
      if (p.images?.includes(url)) refs.push(`Product: ${p.name}`);
    });
    categories.forEach((c) => {
      if (exclude?.kind === 'category' && exclude.id === c.id) return;
      if (c.imageUrl === url) refs.push(`Category: ${c.name}`);
    });
    banners.forEach((b) => {
      if (exclude?.kind === 'banner' && exclude.id === b.id) return;
      if (b.imageUrl === url) refs.push(`Banner: ${b.title}`);
    });
    cmsPages.forEach((pg) => {
      if (exclude?.kind === 'page' && exclude.id === pg.id) return;
      if (pg.featuredImage === url) refs.push(`Page: ${pg.title}`);
    });
    cmsPosts.forEach((pt) => {
      if (exclude?.kind === 'post' && exclude.id === pt.id) return;
      if (pt.featuredImage === url || pt.galleryImages?.includes(url)) {
        refs.push(`Post: ${pt.title}`);
      }
    });
    [...draftSections, ...publishedSections].forEach((sec) => {
      if (exclude?.kind === 'section' && exclude.id === sec.id) return;
      if (sec.images?.includes(url)) {
        refs.push(`Homepage Section: ${sec.name || sec.heading}`);
      }
    });

    const settingsList = [publishedSettings, draftSettings];
    settingsList.forEach((st) => {
      if (st.logoUrl === url) refs.push('Brand Logo');
      if (st.faviconUrl === url) refs.push('Site Favicon');
      if (st.ogImageUrl === url) refs.push('SEO Share Image');
    });

    return Array.from(new Set(refs));
  };

  const getMediaAssetUsages = (url: string): string[] => computeMediaUsages(url);

  const cleanupUnreferencedStorageUrls = async (
    urlsToCheck: (string | undefined)[],
    exclude: { kind: string; id: string }
  ) => {
    const uniqueUrls = Array.from(
      new Set(urlsToCheck.filter((u): u is string => Boolean(u && isFirebaseStorageUrl(u))))
    );
    for (const url of uniqueUrls) {
      const remainingRefs = computeMediaUsages(url, exclude);
      if (remainingRefs.length === 0) {
        const mediaRecord = firestoreMedia.find((m) => m.url === url);
        try {
          await deleteStorageAsset(mediaRecord?.storagePath || url);
          if (mediaRecord) {
            await deleteMediaAssetFromFirestore(mediaRecord.id);
          }
        } catch (err) {
          console.warn('Non-blocking unreferenced Storage cleanup warning:', err);
        }
      }
    }
  };

  // ---------------- ADMIN CRUD ----------------

  const saveProduct = async (product: Product) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveProductToFirestore(product);
      await markCollectionBootstrapped(['products']);
      showToast(`Saved "${product.name}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const batchSaveProducts = async (productsList: Product[], customToast?: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    if (productsList.length === 0) return;
    try {
      await batchSaveProductsToFirestore(productsList);
      await markCollectionBootstrapped(['products']);
      if (customToast) showToast(customToast);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveSupplierIntegration = async (config: SupplierIntegrationConfig) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveSupplierIntegrationToFirestore(config);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveSupplierImportLog = async (log: SupplierImportLog) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveSupplierImportLogToFirestore(log);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteSupplierImportLog = async (logId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await deleteSupplierImportLogFromFirestore(logId);
      showToast('Import log deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = products.find((p) => p.id === productId);
    try {
      await prepareCollectionBeforeDelete(
        'products',
        firestoreProducts,
        INITIAL_PRODUCTS,
        [productId],
        saveProductToFirestore
      );
      await deleteProductFromFirestore(productId);

      // Remove productId references from any homepage section in draft or published
      const cleanSectionRefs = (list: WebsiteSection[]) =>
        list.map((sec) =>
          sec.productIds?.includes(productId)
            ? { ...sec, productIds: sec.productIds.filter((id) => id !== productId) }
            : sec
        );

      const draftHadRef = draftSections.some((s) => s.productIds?.includes(productId));
      const nextDraftSecs = draftHadRef ? cleanSectionRefs(draftSections) : draftSections;
      if (draftHadRef) {
        setLocalDraftSections(nextDraftSecs);
        await persistDraftSnapshot(draftSettings, nextDraftSecs, draftMenus);
      }
      if (publishedSnapshot?.sections?.some((s) => s.productIds?.includes(productId))) {
        const nextPubSecs = cleanSectionRefs(publishedSnapshot.sections);
        await saveWebsiteSnapshotToFirestore({
          ...publishedSnapshot,
          sections: nextPubSecs,
        });
      }
      await Promise.all(
        firestoreSections
          .filter((s) => s.productIds?.includes(productId))
          .map((s) =>
            saveWebsiteSectionToFirestore({
              ...s,
              productIds: (s.productIds || []).filter((id) => id !== productId),
            })
          )
      );

      if (target?.images?.length) {
        await cleanupUnreferencedStorageUrls(target.images, { kind: 'product', id: productId });
      }
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
        if (activeView === 'product') setActiveView('shop');
      }
      showToast('Product permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveCategory = async (category: Category) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveCategoryToFirestore(category);
      await markCollectionBootstrapped(['categories']);
      showToast(`Saved category "${category.name}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = categories.find((c) => c.id === categoryId);
    try {
      await prepareCollectionBeforeDelete(
        'categories',
        firestoreCategories,
        INITIAL_CATEGORIES,
        [categoryId],
        saveCategoryToFirestore
      );
      await deleteCategoryFromFirestore(categoryId);
      if (target?.imageUrl) {
        await cleanupUnreferencedStorageUrls([target.imageUrl], {
          kind: 'category',
          id: categoryId,
        });
      }
      if (target && activeCategory === target.slug) {
        setActiveCategory('all');
      }
      showToast('Category permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveBanner = async (banner: Banner) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveBannerToFirestore(banner);
      await markCollectionBootstrapped(['banners']);
      showToast(`Saved banner "${banner.title}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = banners.find((b) => b.id === bannerId);
    try {
      await prepareCollectionBeforeDelete(
        'banners',
        firestoreBanners,
        INITIAL_BANNERS,
        [bannerId],
        saveBannerToFirestore
      );
      await deleteBannerFromFirestore(bannerId);
      if (target?.imageUrl) {
        await cleanupUnreferencedStorageUrls([target.imageUrl], {
          kind: 'banner',
          id: bannerId,
        });
      }
      showToast('Banner permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveStoreSettings = async (settings: StoreSettings) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveStoreSettingsToFirestore(settings);
      showToast('Store settings saved');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveCmsPage = async (page: CmsPage) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveCmsPageToFirestore(page);
      await markCollectionBootstrapped(['cmsPages']);
      showToast(`Saved page "${page.title}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteCmsPage = async (pageId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = cmsPages.find((p) => p.id === pageId);
    try {
      await prepareCollectionBeforeDelete(
        'cmsPages',
        firestorePages,
        INITIAL_CMS_PAGES,
        [pageId],
        saveCmsPageToFirestore
      );
      await deleteCmsPageFromFirestore(pageId);
      if (target?.featuredImage) {
        await cleanupUnreferencedStorageUrls([target.featuredImage], {
          kind: 'page',
          id: pageId,
        });
      }
      if (target && selectedPageSlug === target.slug) {
        setSelectedPageSlug('');
        if (activeView === 'page') setActiveView('home');
      }
      showToast('Custom page permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveCmsPost = async (post: CmsPost) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveCmsPostToFirestore(post);
      await markCollectionBootstrapped(['cmsPosts']);
      showToast(`Saved post "${post.title}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteCmsPost = async (postId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = cmsPosts.find((p) => p.id === postId);
    try {
      await prepareCollectionBeforeDelete(
        'cmsPosts',
        firestorePosts,
        INITIAL_CMS_POSTS,
        [postId],
        saveCmsPostToFirestore
      );
      await deleteCmsPostFromFirestore(postId);
      if (target) {
        await cleanupUnreferencedStorageUrls(
          [target.featuredImage, ...(target.galleryImages || [])],
          { kind: 'post', id: postId }
        );
      }
      if (target && selectedPostSlug === target.slug) {
        setSelectedPostSlug('');
        if (activeView === 'post') setActiveView('blog');
      }
      showToast('Blog post permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const savePromotion = async (promo: Promotion) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await savePromotionToFirestore(promo);
      await markCollectionBootstrapped(['promotions']);
      showToast(`Saved promo "${promo.code}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deletePromotion = async (promoId: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await prepareCollectionBeforeDelete(
        'promotions',
        firestorePromotions,
        INITIAL_PROMOTIONS,
        [promoId],
        savePromotionToFirestore
      );
      await deletePromotionFromFirestore(promoId);
      showToast('Promotion permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const saveMediaAsset = async (asset: MediaAsset) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await saveMediaAssetToFirestore(asset);
      await markCollectionBootstrapped(['mediaAssets']);
      showToast(`Saved media "${asset.name}"`);
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteMediaAsset = async (assetId: string, storagePathOrUrl?: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = mediaAssets.find((a) => a.id === assetId);
    const resolvedStorageTarget =
      storagePathOrUrl ||
      target?.storagePath ||
      (target?.url && isFirebaseStorageUrl(target.url) ? target.url : undefined);
    try {
      await prepareCollectionBeforeDelete(
        'mediaAssets',
        firestoreMedia,
        INITIAL_MEDIA_ASSETS,
        [assetId],
        saveMediaAssetToFirestore
      );
      await deleteMediaAssetFromFirestore(assetId, resolvedStorageTarget);
      showToast('Media file permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const cleanupUnusedMediaAssets = async (assetsToDelete: MediaAsset[]): Promise<number> => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const safeUnused = assetsToDelete.filter((a) => getMediaAssetUsages(a.url).length === 0);
    if (safeUnused.length === 0) {
      throw new Error('All selected files are currently referenced on your storefront.');
    }
    try {
      await prepareCollectionBeforeDelete(
        'mediaAssets',
        firestoreMedia,
        INITIAL_MEDIA_ASSETS,
        safeUnused.map((a) => a.id),
        saveMediaAssetToFirestore
      );
      let deletedCount = 0;
      for (const asset of safeUnused) {
        const storageTarget =
          asset.storagePath || (isFirebaseStorageUrl(asset.url) ? asset.url : undefined);
        await deleteMediaAssetFromFirestore(asset.id, storageTarget);
        deletedCount += 1;
      }
      showToast(`Permanently deleted ${deletedCount} unused file(s)`);
      return deletedCount;
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteWebsiteSection = async (sectionId: string, syncLive = true) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const target = draftSections.find((s) => s.id === sectionId);
    try {
      await prepareCollectionBeforeDelete(
        'websiteSections',
        firestoreSections,
        INITIAL_WEBSITE_SECTIONS,
        [sectionId],
        saveWebsiteSectionToFirestore
      );
      const nextDraft = draftSections
        .filter((s) => s.id !== sectionId)
        .map((s, idx) => ({ ...s, displayOrder: idx + 1 }));

      setLocalDraftSections(nextDraft);
      await deleteWebsiteSectionFromFirestore(sectionId);
      await persistDraftSnapshot(draftSettings, nextDraft, draftMenus);

      if (syncLive && publishedSnapshot) {
        const nextPub = (publishedSnapshot.sections || [])
          .filter((s) => s.id !== sectionId)
          .map((s, idx) => ({ ...s, displayOrder: idx + 1 }));
        await saveWebsiteSnapshotToFirestore({
          ...publishedSnapshot,
          sections: nextPub,
        });
      }

      if (target?.images?.length) {
        await cleanupUnreferencedStorageUrls(target.images, {
          kind: 'section',
          id: sectionId,
        });
      }
      showToast('Homepage section permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const deleteNavigationMenu = async (menuId: string, syncLive = true) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await prepareCollectionBeforeDelete(
        'navigationMenus',
        firestoreMenus,
        INITIAL_NAVIGATION_MENUS,
        [menuId],
        saveNavigationMenuToFirestore
      );
      const nextMenus = draftMenus.filter((m) => m.id !== menuId);
      setLocalDraftMenus(nextMenus);
      await deleteNavigationMenuFromFirestore(menuId);
      await persistDraftSnapshot(draftSettings, draftSections, nextMenus);

      if (syncLive && publishedSnapshot) {
        const nextPubMenus = (publishedSnapshot.menus || []).filter((m) => m.id !== menuId);
        await saveWebsiteSnapshotToFirestore({
          ...publishedSnapshot,
          menus: nextPubMenus,
        });
      }
      showToast('Navigation menu permanently deleted');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const persistNavigationMenusLiveAndDraft = async (
    nextMenus: NavigationMenu[],
    syncLive = true
  ) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await markCollectionBootstrapped(['navigationMenus']);
      setLocalDraftMenus(nextMenus);
      await persistDraftSnapshot(draftSettings, draftSections, nextMenus);
      if (syncLive) {
        await Promise.all(nextMenus.map((m) => saveNavigationMenuToFirestore(m)));
        if (publishedSnapshot) {
          await saveWebsiteSnapshotToFirestore({
            ...publishedSnapshot,
            menus: nextMenus,
          });
        }
      }
      showToast(syncLive ? 'Navigation updated live & in draft' : 'Navigation draft saved');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const subscribeNewsletter = async (email: string, source: 'footer' | 'section' = 'footer') => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error('Please enter a valid email address.');
    }
    await subscribeNewsletterInFirestore(email, source);
    showToast('Subscribed to VEYRA updates.');
  };

  const removeNewsletterSubscriber = async (id: string) => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    try {
      await deleteNewsletterSubscriberFromFirestore(id);
      showToast('Subscriber permanently removed');
    } catch (err) {
      const msg = formatFirebaseError(err);
      showToast(msg);
      throw new Error(msg);
    }
  };

  const seedCatalogToFirestore = async () => {
    if (!isAdmin) throw new Error('Administrator authorization required.');
    const allKeys = [
      'products',
      'categories',
      'banners',
      'websiteSections',
      'navigationMenus',
      'cmsPages',
      'cmsPosts',
      'promotions',
      'mediaAssets',
    ];
    const seededSettings: StoreSettings = {
      ...DEFAULT_STORE_SETTINGS,
      bootstrappedCollections: allKeys,
    };
    setLocalBootstrappedCols(allKeys);
    await Promise.all([
      ...INITIAL_CATEGORIES.map((c) => saveCategoryToFirestore(c)),
      ...INITIAL_PRODUCTS.map((p) => saveProductToFirestore(p)),
      ...INITIAL_BANNERS.map((b) => saveBannerToFirestore(b)),
      ...INITIAL_WEBSITE_SECTIONS.map((s) => saveWebsiteSectionToFirestore(s)),
      ...INITIAL_NAVIGATION_MENUS.map((m) => saveNavigationMenuToFirestore(m)),
      ...INITIAL_CMS_PAGES.map((pg) => saveCmsPageToFirestore(pg)),
      ...INITIAL_CMS_POSTS.map((pt) => saveCmsPostToFirestore(pt)),
      ...INITIAL_PROMOTIONS.map((pr) => savePromotionToFirestore(pr)),
      ...INITIAL_MEDIA_ASSETS.map((ma) => saveMediaAssetToFirestore(ma)),
      saveStoreSettingsToFirestore(seededSettings),
      saveWebsiteSnapshotToFirestore({
        id: 'published',
        versionLabel: 'Initial VEYRA Release',
        settings: seededSettings,
        sections: INITIAL_WEBSITE_SECTIONS,
        menus: INITIAL_NAVIGATION_MENUS,
        publishedBy: currentUser?.email || '',
        publishedAt: new Date().toISOString(),
      }),
      saveWebsiteSnapshotToFirestore({
        id: 'draft',
        versionLabel: 'Current Admin Draft',
        settings: seededSettings,
        sections: INITIAL_WEBSITE_SECTIONS,
        menus: INITIAL_NAVIGATION_MENUS,
        publishedBy: currentUser?.email || '',
        publishedAt: new Date().toISOString(),
      }),
    ]);
    showToast('Complete VEYRA catalog & CMS workspace synced to Cloud Firestore');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        banners,
        storeSettings,
        websiteSections,
        navigationMenus,
        cmsPages,
        cmsPosts,
        promotions,
        isFirestoreCatalogActive,

        draftSettings,
        draftSections,
        draftMenus,
        publishedSnapshot,
        websiteVersions,
        isPreviewMode,
        setIsPreviewMode,
        hasUnpublishedChanges,
        updateDraftSettings,
        updateDraftSections,
        updateDraftMenus,
        publishWebsiteChanges,
        discardDraftChanges,
        restoreVersionToDraft,

        mediaAssets,
        newsletterSubscribers,
        adminCustomers,
        supplierIntegrations,
        supplierImportLogs,

        activeView,
        setActiveView,
        selectedProduct,
        openProductDetail,
        selectedPage,
        openPageBySlug,
        selectedPost,
        openPostBySlug,
        navigateTarget,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        navigateToShop,

        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
        calculateDeliveryFee,
        validatePromoCode,

        currentUser,
        authLoading,
        isAdmin,
        userProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithGoogle,
        loginWithEmailPassword,
        signupWithEmailPassword,
        logout,
        updateProfileInfo,
        saveAddress,
        deleteAddress,

        orders,
        customerOrders,
        lastOrder,
        trackedOrder,
        placeOrder,
        lookupOrder,
        updateOrder,
        deleteOrder,
        deleteOrdersBulk,

        saveProduct,
        batchSaveProducts,
        deleteProduct,
        saveSupplierIntegration,
        saveSupplierImportLog,
        deleteSupplierImportLog,
        saveCategory,
        deleteCategory,
        saveBanner,
        deleteBanner,
        saveStoreSettings,
        saveCmsPage,
        deleteCmsPage,
        saveCmsPost,
        deleteCmsPost,
        savePromotion,
        deletePromotion,
        saveMediaAsset,
        deleteMediaAsset,
        cleanupUnusedMediaAssets,
        getMediaAssetUsages,
        deleteWebsiteSection,
        deleteNavigationMenu,
        persistNavigationMenusLiveAndDraft,
        subscribeNewsletter,
        removeNewsletterSubscriber,
        seedCatalogToFirestore,

        firebaseStatus,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
