export type CategorySlug =
  | 'all'
  | 'electronics-gadgets'
  | 'fashion'
  | 'home-living'
  | 'accessories'
  | 'beauty-lifestyle'
  | string;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductVariation {
  id: string;
  name: string; // e.g., "Forest Green", "Medium", "128GB"
  type: string; // e.g., "Color", "Size", "Edition"
  priceAdjustment: number; // BDT delta from base price
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  price: number; // Base price in BDT (৳)
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  images: string[];
  stock: number;
  sku: string;
  variations: ProductVariation[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  popularityScore: number;
  isActive: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  categoryName: string;
  unitPrice: number;
  variationId?: string;
  variationLabel?: string;
  quantity: number;
  maxStock: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  area: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  savedAddresses: SavedAddress[];
  updatedAt?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'bkash_manual'
  | 'nagad_manual';

export type PaymentStatus =
  | 'Unpaid'
  | 'Pending Verification'
  | 'Paid'
  | 'Refunded';

export interface OrderItemSummary {
  productId: string;
  productName: string;
  productImage?: string;
  variationLabel?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  area: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  items: OrderItemSummary[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  promoCode?: string;
  totalAmount: number;
  status: OrderStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  targetCategory: CategorySlug;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
}

export interface FooterLink {
  id: string;
  label: string;
  targetType: 'home' | 'shop' | 'category' | 'page' | 'blog' | 'tracking' | 'url';
  targetValue: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  // Delivery & Payments
  insideDhakaDeliveryFee: number;
  outsideDhakaDeliveryFee: number;
  freeDeliveryThreshold: number;
  bkashEnabled: boolean;
  bkashNumber: string;
  nagadEnabled: boolean;
  nagadNumber: string;
  paymentInstructions: string;
  supportPhone: string;
  supportEmail: string;
  // Website Customizer — Global
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  headingFont?: 'Cormorant Garamond' | 'Playfair Display' | 'Fraunces' | 'Plus Jakarta Sans';
  bodyFont?: 'Plus Jakarta Sans' | 'DM Sans' | 'Manrope' | 'Lora';
  buttonStyle?: 'solid' | 'outline';
  borderRadius?: 'sharp' | 'soft' | 'rounded';
  layoutWidth?: 'compact' | 'standard' | 'wide';
  socialLinks?: SocialLinks;
  // Announcement Bar
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementLink?: string;
  // Header Customization
  headerSticky?: boolean;
  headerShowSearch?: boolean;
  headerShowAccount?: boolean;
  headerShowCart?: boolean;
  headerBgColor?: string;
  headerTextColor?: string;
  headerMenuId?: string;
  // Footer Customization
  footerDescription?: string;
  footerCopyright?: string;
  footerShowNewsletter?: boolean;
  footerBgColor?: string;
  footerTextColor?: string;
  footerColumns?: FooterColumn[];
  // Global SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  robotsAllowIndex?: boolean;
  robotsCustomText?: string;
  // Internal Firestore bootstrap tracking
  bootstrappedCollections?: string[];
}

// ---------------- VISUAL HOMEPAGE BUILDER ----------------

export type WebsiteSectionType =
  | 'hero_banner'
  | 'promotional_banner'
  | 'image_text'
  | 'featured_products'
  | 'new_arrivals'
  | 'best_sellers'
  | 'category_grid'
  | 'promotional_product_grid'
  | 'image_gallery'
  | 'brand_intro'
  | 'testimonials'
  | 'customer_reviews'
  | 'newsletter'
  | 'social_showcase'
  | 'rich_text'
  | 'countdown_promo'
  | 'collection_showcase';

export interface SectionItemEntry {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  author?: string;
  role?: string;
  rating?: number;
  imageUrl?: string;
  linkUrl?: string;
}

export interface WebsiteSection {
  id: string;
  type: WebsiteSectionType;
  name: string;
  heading: string;
  subtitle: string;
  description: string;
  images: string[];
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  buttonTargetType: 'shop' | 'category' | 'product' | 'page' | 'blog' | 'url';
  buttonDestination: string;
  productCount: number;
  productIds?: string[];
  categorySlug?: string;
  layout: 'split' | 'centered' | 'grid' | 'editorial';
  alignment: 'left' | 'center' | 'right';
  isVisible: boolean;
  visibleDesktop: boolean;
  visibleMobile: boolean;
  displayOrder: number;
  countdownEndAt?: string;
  items?: SectionItemEntry[];
  updatedAt?: string;
}

// ---------------- NAVIGATION MENUS ----------------

export interface NavMenuItem {
  id: string;
  label: string;
  targetType: 'home' | 'shop' | 'category' | 'product' | 'page' | 'blog' | 'tracking' | 'admin' | 'url';
  targetValue: string;
  children?: NavMenuItem[];
}

export interface NavigationMenu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'custom';
  items: NavMenuItem[];
  updatedAt?: string;
}

// ---------------- CMS PAGES & POSTS ----------------

export type PublicationStatus = 'draft' | 'published';
export type PostStatus = 'draft' | 'published' | 'scheduled';
export type PostType = 'blog' | 'announcement' | 'product_highlight' | 'campaign' | 'news';

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  status: PublicationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsPost {
  id: string;
  title: string;
  slug: string;
  postType: PostType;
  excerpt: string;
  content: string;
  featuredImage?: string;
  galleryImages: string[];
  categories: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: PostStatus;
  publishDate: string;
  authorName: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------- PROMOTIONS & MARKETING ----------------

export type DiscountType = 'percentage' | 'fixed' | 'free_delivery';

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  saleLabel?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------- MEDIA LIBRARY ----------------

export type MediaFolder = 'products' | 'banners' | 'posts' | 'pages' | 'branding' | 'general';

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  folder: MediaFolder;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  uploadedBy?: string;
  createdAt?: string;
}

// ---------------- NEWSLETTER ----------------

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: 'footer' | 'section';
  status: 'subscribed' | 'unsubscribed';
  createdAt?: string;
}

// ---------------- WEBSITE VERSION SNAPSHOTS ----------------

export interface WebsiteSnapshot {
  id: string; // 'draft' | 'published' | 'ver-...'
  versionLabel: string;
  settings: StoreSettings;
  sections: WebsiteSection[];
  menus: NavigationMenu[];
  publishedBy?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  projectId?: string;
  storageBucket?: string;
  mode: 'real' | 'unconfigured';
  message: string;
}

export type SortOption = 'featured' | 'newest' | 'popularity' | 'price_asc' | 'price_desc';
export type StoreView =
  | 'home'
  | 'shop'
  | 'product'
  | 'checkout'
  | 'confirmation'
  | 'account'
  | 'tracking'
  | 'blog'
  | 'post'
  | 'page'
  | 'admin';
